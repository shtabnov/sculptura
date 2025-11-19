/**
 * Скрипт для проверки настроек индексации сайта
 */

const ssh2 = require("ssh2-sftp-client");
const { Client } = require("ssh2");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Загружаем конфигурацию
let deployConfig;

try {
    deployConfig = require("../deploy.config.js");
} catch (e) {
    console.error("❌ Ошибка: Не найден файл deploy.config.js");
    process.exit(1);
}

const sftp = new ssh2();
let sshClient = null;

function getPrivateKey() {
    if (deployConfig.ssh && deployConfig.ssh.privateKey) {
        return deployConfig.ssh.privateKey;
    }

    const projectKeyPath = path.join(__dirname, "..", ".ssh", "id_rsa");
    if (fs.existsSync(projectKeyPath)) {
        try {
            return fs.readFileSync(projectKeyPath);
        } catch (e) {
            console.warn("⚠️ Не удалось прочитать SSH ключ из проекта");
        }
    }

    const defaultKeyPath = path.join(os.homedir(), ".ssh", "id_rsa");
    if (fs.existsSync(defaultKeyPath)) {
        try {
            return fs.readFileSync(defaultKeyPath);
        } catch (e) {
            console.warn("⚠️ Не удалось прочитать стандартный SSH ключ");
        }
    }

    return undefined;
}

async function checkIndexingSettings() {
    try {
        console.log("🔍 Проверка настроек индексации сайта...\n");

        const connectOptions = {
            host: deployConfig.ssh.host,
            port: deployConfig.ssh.port || 22,
            username: deployConfig.ssh.username,
            readyTimeout: 20000,
        };

        if (deployConfig.ssh.password) {
            connectOptions.password = deployConfig.ssh.password;
        } else {
            const privateKey = getPrivateKey();
            if (privateKey) {
                connectOptions.privateKey = privateKey;
                if (deployConfig.ssh.passphrase) {
                    connectOptions.passphrase = deployConfig.ssh.passphrase;
                }
            } else {
                throw new Error("Не указан метод аутентификации");
            }
        }

        // Подключаемся через SSH для выполнения PHP команд
        sshClient = new Client();

        await new Promise((resolve, reject) => {
            sshClient.on("ready", resolve);
            sshClient.on("error", reject);
            sshClient.connect(connectOptions);
        });

        console.log("✅ Подключение установлено\n");

        // Получаем путь к WordPress
        let themePath = deployConfig.remote.themePath.replace(/\/$/, "");
        let wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, "");
        wpPath = wpPath.replace(/\/+/g, "/");

        // PHP скрипт для проверки настроек
        const phpScript = `<?php
require_once('${wpPath}/wp-load.php');

echo "=== ПРОВЕРКА НАСТРОЕК ИНДЕКСАЦИИ ===\\n\\n";

// 1. Проверка blog_public (видимость для поисковиков)
$blog_public = get_option('blog_public');
if ($blog_public == '0') {
    echo "❌ КРИТИЧНО: Сайт ЗАБЛОКИРОВАН от индексации!\\n";
    echo "   Настройка 'blog_public' = 0 (не индексировать)\\n";
    echo "   Решение: Админ-панель → Настройки → Чтение → 'Видимость для поисковых систем'\\n\\n";
} else {
    echo "✅ Сайт разрешен для индексации (blog_public = 1)\\n\\n";
}

// 2. Проверка robots.txt
$robots_path = ABSPATH . 'robots.txt';
if (file_exists($robots_path)) {
    echo "📄 robots.txt найден:\\n";
    $robots_content = file_get_contents($robots_path);
    echo "---\\n" . $robots_content . "---\\n\\n";
    
    // Проверяем на блокировку
    if (preg_match('/User-agent:\\s*\\*/i', $robots_content) && 
        preg_match('/Disallow:\\s*\\//i', $robots_content)) {
        echo "⚠️ ВНИМАНИЕ: robots.txt блокирует все страницы (Disallow: /)\\n\\n";
    }
} else {
    echo "ℹ️ robots.txt не найден (будет использован стандартный WordPress)\\n\\n";
}

// 3. Проверка мета-тегов в header.php
$header_path = get_template_directory() . '/header.php';
if (file_exists($header_path)) {
    $header_content = file_get_contents($header_path);
    if (preg_match('/<meta[^>]*name=["\']robots["\'][^>]*>/i', $header_content, $matches)) {
        echo "📋 Мета-теги robots в header.php:\\n";
        foreach ($matches as $match) {
            echo "   " . htmlspecialchars($match) . "\\n";
        }
        echo "\\n";
    } else {
        echo "✅ В header.php нет мета-тегов robots (блокирующих индексацию)\\n\\n";
    }
}

// 4. Проверка плагинов, которые могут блокировать индексацию
$active_plugins = get_option('active_plugins', []);
$blocking_plugins = ['wordfence', 'all-in-one-seo', 'yoast', 'rank-math'];
$found_blocking = false;
foreach ($active_plugins as $plugin) {
    foreach ($blocking_plugins as $blocking) {
        if (stripos($plugin, $blocking) !== false) {
            echo "⚠️ Найден плагин, который может влиять на индексацию: " . $plugin . "\\n";
            $found_blocking = true;
        }
    }
}
if (!$found_blocking) {
    echo "ℹ️ Плагины, блокирующие индексацию, не обнаружены\\n";
}
echo "\\n";

// 5. Проверка .htaccess на блокировку
$htaccess_path = ABSPATH . '.htaccess';
if (file_exists($htaccess_path)) {
    $htaccess_content = file_get_contents($htaccess_path);
    if (preg_match('/RewriteRule.*robots/i', $htaccess_content)) {
        echo "⚠️ В .htaccess найдены правила для robots.txt\\n\\n";
    }
}

// 6. Информация о сайте
echo "=== ИНФОРМАЦИЯ О САЙТЕ ===\\n";
echo "URL сайта: " . home_url() . "\\n";
echo "URL админки: " . admin_url() . "\\n";
echo "Версия WordPress: " . get_bloginfo('version') . "\\n\\n";

echo "=== РЕКОМЕНДАЦИИ ===\\n";
if ($blog_public == '0') {
    echo "1. СРОЧНО: Включите индексацию в настройках WordPress\\n";
}
echo "2. Проверьте сайт в Google Search Console\\n";
echo "3. Проверьте сайт в Яндекс.Вебмастер\\n";
echo "4. Убедитесь, что robots.txt не блокирует важные страницы\\n";
echo "5. Проверьте наличие sitemap.xml\\n";

echo "\\nГотово!\\n";
`;

        // Создаем временный PHP файл на сервере через SSH команду
        const tempPhpFile = "/tmp/check_indexing_" + Date.now() + ".php";
        const escapedScript = phpScript
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'")
            .replace(/\n/g, "\\n");

        // Создаем файл через echo
        const createFileCmd = `cat > ${tempPhpFile} << 'ENDOFFILE'
${phpScript}
ENDOFFILE`;

        // Выполняем PHP скрипт
        return new Promise((resolve, reject) => {
            // Сначала создаем файл
            sshClient.exec(createFileCmd, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }

                stream.on("close", (code) => {
                    if (code !== 0) {
                        sshClient.end();
                        reject(
                            new Error(
                                `Не удалось создать временный файл (код ${code})`
                            )
                        );
                        return;
                    }

                    // Теперь выполняем PHP скрипт
                    sshClient.exec(`php ${tempPhpFile}`, (err2, stream2) => {
                        if (err2) {
                            sshClient.end();
                            reject(err2);
                            return;
                        }

                        let output = "";
                        stream2.on("data", (chunk) => {
                            output += chunk.toString();
                            process.stdout.write(chunk.toString());
                        });

                        stream2.on("close", (code2) => {
                            // Удаляем временный файл
                            sshClient.exec(`rm -f ${tempPhpFile}`, () => {
                                sshClient.end();
                                if (code2 === 0) {
                                    resolve(output);
                                } else {
                                    reject(
                                        new Error(
                                            `Команда завершилась с кодом ${code2}`
                                        )
                                    );
                                }
                            });
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error("❌ Ошибка:", error.message);
        if (sshClient) {
            sshClient.end();
        }
        process.exit(1);
    }
}

// Запускаем проверку
checkIndexingSettings()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Критическая ошибка:", error.message);
        process.exit(1);
    });
