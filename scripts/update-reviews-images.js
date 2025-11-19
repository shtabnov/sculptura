/**
 * Скрипт для обновления отзывов - привязка изображений
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
    console.error("❌ deploy.config.js не найден");
    process.exit(1);
}

const sftp = new ssh2();
const sshClient = new Client();

// Соответствие имен и изображений
const reviewImages = {
    "Дарья Надвидная": "review_darya_nadvidnaya.jpg",
    "Олечка Баранова": "review_olechka_baranova.jpg",
    "Дарина Насырова": "review_darina_nasyrova.jpg",
    "Лейла Нелюбина": "review_leyla_nelyubina.jpg",
    "Анна Провкова": "review_anna_provkova.jpg"
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

async function updateReviewsImages() {
    try {
        console.log("🔌 Подключение к серверу...");

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

        await sftp.connect(connectOptions);
        console.log("✅ Подключение установлено\n");

        let themePath = deployConfig.remote.themePath.replace(/\/$/, "");
        let wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, "");
        wpPath = wpPath.replace(/\/+/g, "/");
        themePath = themePath.replace(/\/+/g, "/");

        console.log(`📁 Путь к WordPress: ${wpPath}\n`);

        await new Promise((resolve, reject) => {
            sshClient.on("ready", resolve);
            sshClient.on("error", reject);
            sshClient.connect(connectOptions);
        });

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

        console.log("📝 Обновляю отзывы с изображениями...\n");
        await updateImagesViaPHP(executeCommand, wpPath, themePath);

        sshClient.end();
        await sftp.end();
        console.log("\n✅ Готово! Изображения привязаны к отзывам.");

    } catch (error) {
        console.error("❌ Ошибка:", error.message);
        try {
            await sftp.end();
        } catch (e) {}
        process.exit(1);
    }
}

async function updateImagesViaPHP(executeCommand, wpPath, themePath) {
    const reviewImagesJson = JSON.stringify(reviewImages).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    const phpScript = `<?php
require_once('${wpPath}/wp-load.php');
require_once('${wpPath}/wp-admin/includes/image.php');
require_once('${wpPath}/wp-admin/includes/file.php');
require_once('${wpPath}/wp-admin/includes/media.php');

$reviewImages = json_decode('${reviewImagesJson}', true);
$themeImagesPath = '${themePath}/assets/images/';
$uploadDir = wp_upload_dir();
$uploadPath = $uploadDir['path'] . '/';

foreach ($reviewImages as $name => $imageFile) {
    // Находим отзыв по имени
    $posts = get_posts([
        'post_type' => 'review',
        'title' => $name,
        'post_status' => 'any',
        'numberposts' => 1
    ]);
    
    if (empty($posts)) {
        echo "⚠️ Отзыв '$name' не найден\\n";
        continue;
    }
    
    $post = $posts[0];
    $post_id = $post->ID;
    
    // Проверяем, есть ли уже изображение
    if (has_post_thumbnail($post_id)) {
        echo "ℹ️ У отзыва '$name' уже есть изображение, пропускаю...\\n";
        continue;
    }
    
    // Загружаем изображение
    $imagePath = $themeImagesPath . $imageFile;
    if (!file_exists($imagePath)) {
        echo "⚠️ Файл изображения не найден: $imagePath\\n";
        continue;
    }
    
    $filename = basename($imagePath);
    $uploadFile = $uploadPath . $filename;
    
    // Копируем файл во временную директорию загрузок
    if (copy($imagePath, $uploadFile)) {
        $fileType = wp_check_filetype($filename, null);
        $attachment = [
            'post_mime_type' => $fileType['type'],
            'post_title' => sanitize_file_name($filename),
            'post_content' => '',
            'post_status' => 'inherit'
        ];
        
        $attach_id = wp_insert_attachment($attachment, $uploadFile, $post_id);
        $attach_data = wp_generate_attachment_metadata($attach_id, $uploadFile);
        wp_update_attachment_metadata($attach_id, $attach_data);
        set_post_thumbnail($post_id, $attach_id);
        
        echo "✅ Изображение привязано к отзыву: $name (ID: $post_id)\\n";
    } else {
        echo "❌ Ошибка при копировании изображения для '$name'\\n";
    }
}

echo "\\nГотово!\\n";
`;

    const scriptPath = "/tmp/update_reviews_images.php";
    const command = `cat > ${scriptPath} << 'ENDOFFILE'
${phpScript}
ENDOFFILE
`;
    
    await executeCommand(command);
    
    const result = await executeCommand(`php ${scriptPath}`);
    console.log(result);
    
    await executeCommand(`rm ${scriptPath}`);
}

updateReviewsImages();

