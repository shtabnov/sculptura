/**
 * Скрипт для настройки permalinks (постоянных ссылок) в WordPress через SSH
 */

const ssh2 = require("ssh2-sftp-client");
const { Client } = require("ssh2");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Загружаем конфиг деплоя
let deployConfig;
try {
    deployConfig = require("../deploy.config.js");
} catch (error) {
    console.error("❌ deploy.config.js не найден. Создайте его на основе deploy.config.example.js");
    process.exit(1);
}

const sftp = new ssh2();
const sshClient = new Client();

// Формат permalinks: /%postname%/ - самый популярный формат
// Другие варианты:
// - '/%year%/%monthnum%/%day%/%postname%/' - с датой
// - '/%postname%/' - только название поста/страницы (рекомендуется)
// - '/%category%/%postname%/' - с категорией
const permalinkStructure = "/%postname%/";

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

async function setupPermalinks() {
    try {
        console.log("🔌 Подключение к серверу...");

        const connectOptions = {
            host: deployConfig.ssh.host,
            port: deployConfig.ssh.port || 22,
            username: deployConfig.ssh.username,
            readyTimeout: 20000,
        };

        // Добавляем метод аутентификации
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
                throw new Error("Не указан метод аутентификации. Укажите password или добавьте SSH ключ");
            }
        }

        await sftp.connect(connectOptions);
        console.log("✅ Подключение установлено\n");

        // Определяем путь к WordPress
        let themePath = deployConfig.remote.themePath;
        // Убираем завершающий слэш если есть
        themePath = themePath.replace(/\/$/, "");
        let wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, "");
        // Убираем двойные слэши
        wpPath = wpPath.replace(/\/+/g, "/");

        console.log(`📁 Путь к WordPress: ${wpPath}\n`);

        // Подключаемся через SSH2 для выполнения команд
        await new Promise((resolve, reject) => {
            sshClient.on("ready", resolve);
            sshClient.on("error", reject);
            sshClient.connect(connectOptions);
        });

        // Функция для выполнения команд через SSH2
        const executeCommand = (command) => {
            return new Promise((resolve, reject) => {
                sshClient.exec(command, (err, stream) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    let output = "";
                    stream.on("close", () => {
                        resolve(output);
                    });

                    stream.on("data", (data) => {
                        output += data.toString();
                    });

                    stream.stderr.on("data", (data) => {
                        output += data.toString();
                    });
                });
            });
        };

        // Используем PHP скрипт для настройки permalinks
        console.log("📝 Настраиваю permalinks через PHP скрипт...\n");
        await setupPermalinksViaPHP(executeCommand);

        sshClient.end();

        await sftp.end();
        console.log("\n✅ Готово! Permalinks настроены в WordPress.");

    } catch (error) {
        console.error("❌ Ошибка:", error.message);
        try {
            await sftp.end();
        } catch (e) {}
        process.exit(1);
    }
}

async function setupPermalinksViaPHP(executeCommand) {
    // Создаем PHP скрипт для настройки permalinks
    let themePath = deployConfig.remote.themePath.replace(/\/$/, "");
    let wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, "");
    // Убираем двойные слэши
    wpPath = wpPath.replace(/\/+/g, "/");
    themePath = themePath.replace(/\/+/g, "/");

    const phpScript = `<?php
require_once('${wpPath}/wp-load.php');

// Получаем текущую структуру permalinks
$current_structure = get_option('permalink_structure');

echo "Текущая структура permalinks: " . ($current_structure ?: '(не настроена)') . "\\n";
echo "Новая структура permalinks: ${permalinkStructure}\\n\\n";

// Устанавливаем новую структуру permalinks
update_option('permalink_structure', '${permalinkStructure}');

echo "Структура permalinks обновлена\\n";

// Пересоздаем правила перезаписи URL
// Это необходимо для того, чтобы WordPress применил новую структуру
global $wp_rewrite;
$wp_rewrite->init();
$wp_rewrite->set_permalink_structure('${permalinkStructure}');
flush_rewrite_rules(true);

echo "Правила перезаписи URL обновлены\\n";

// Проверяем результат
$updated_structure = get_option('permalink_structure');
if ($updated_structure === '${permalinkStructure}') {
    echo "✅ Permalinks успешно настроены!\\n";
    echo "\\nТеперь страницы будут доступны по адресам вида:\\n";
    echo "- /price/ (вместо ?page_id=76)\\n";
    echo "- /services/makeup/ (вместо ?service=makeup)\\n";
} else {
    echo "⚠️ Предупреждение: структура permalinks не совпадает с ожидаемой\\n";
    echo "Текущее значение: " . ($updated_structure ?: '(пусто)') . "\\n";
}

// Очищаем кеш WordPress
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
    echo "Кеш WordPress очищен\\n";
}

echo "Готово!\\n";
`;

    const scriptPath = "/tmp/setup_permalinks.php";
    await sftp.put(Buffer.from(phpScript), scriptPath);

    const result = await executeCommand(`php ${scriptPath}`);

    console.log(result);

    // Удаляем временный файл
    await executeCommand(`rm ${scriptPath}`);
}

// Запускаем скрипт
setupPermalinks();

