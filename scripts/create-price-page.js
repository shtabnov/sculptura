/**
 * Скрипт для создания страницы прайс-листа в WordPress через SSH
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

// Данные страницы прайс-листа
const pageData = {
    title: "Прайс-лист",
    slug: "price",
    content: "", // Контент будет генерироваться шаблоном page-price.php
    status: "publish",
};

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

async function createPricePage() {
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

        // Используем PHP скрипт для создания страницы
        console.log("📝 Создаю страницу прайс-листа через PHP скрипт...\n");
        await createPageViaPHP(executeCommand);

        sshClient.end();

        await sftp.end();
        console.log("\n✅ Готово! Страница прайс-листа создана в WordPress.");

    } catch (error) {
        console.error("❌ Ошибка:", error.message);
        try {
            await sftp.end();
        } catch (e) {}
        process.exit(1);
    }
}

async function createPageViaPHP(executeCommand) {
    // Создаем PHP скрипт для создания страницы
    let themePath = deployConfig.remote.themePath.replace(/\/$/, "");
    let wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, "");
    // Убираем двойные слэши
    wpPath = wpPath.replace(/\/+/g, "/");
    themePath = themePath.replace(/\/+/g, "/");

    const phpScript = `<?php
require_once('${wpPath}/wp-load.php');

// Проверяем, существует ли уже страница с таким slug
$existing_page = get_page_by_path('${pageData.slug}');

if ($existing_page) {
    echo "Страница '${pageData.title}' уже существует (ID: {$existing_page->ID})\\n";
    echo "URL: " . get_permalink($existing_page->ID) . "\\n";
    
    // Обновляем данные страницы, если нужно
    wp_update_post([
        'ID' => $existing_page->ID,
        'post_title' => '${pageData.title}',
        'post_status' => 'publish',
        'post_name' => '${pageData.slug}',
    ]);
    
    echo "Страница обновлена\\n";
} else {
    // Создаем новую страницу
    $page_id = wp_insert_post([
        'post_type' => 'page',
        'post_title' => '${pageData.title}',
        'post_content' => '',
        'post_status' => 'publish',
        'post_name' => '${pageData.slug}',
        'post_author' => 1,
    ]);
    
    if ($page_id && !is_wp_error($page_id)) {
        echo "Создана страница: ${pageData.title} (ID: $page_id)\\n";
        echo "URL: " . get_permalink($page_id) . "\\n";
        echo "Slug: ${pageData.slug}\\n";
    } else {
        $error = is_wp_error($page_id) ? $page_id->get_error_message() : 'Неизвестная ошибка';
        echo "Ошибка при создании страницы: $error\\n";
        exit(1);
    }
}

// Очищаем кеш WordPress
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
    echo "Кеш WordPress очищен\\n";
}

echo "Готово!\\n";
`;

    const scriptPath = "/tmp/create_price_page.php";
    await sftp.put(Buffer.from(phpScript), scriptPath);

    const result = await executeCommand(`php ${scriptPath}`);

    console.log(result);

    // Удаляем временный файл
    await executeCommand(`rm ${scriptPath}`);
}

// Запускаем скрипт
createPricePage();

