/**
 * Скрипт для создания отзывов в WordPress через SSH
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

// Данные отзывов из локальной версии
const reviews = [
    {
        name: "Дарья Надвидная",
        service: "Массаж лица",
        text: "Хожу на массаж лица уже полгода. Результат превзошел все ожидания! Кожа стала более упругой, исчезли мелкие морщинки. Мастер очень внимательная, всегда подбирает индивидуальный подход. Атмосфера в студии уютная, чувствуешь себя как дома.",
        date: "2024-03-15",
        image: "review_darya_nadvidnaya.jpg"
    },
    {
        name: "Олечка Баранова",
        service: "Буккальный массаж",
        text: "Буккальный массаж — это что-то невероятное! После первого сеанса заметила, что овал лица стал более четким. Процедура очень приятная, мастер профессионал своего дела. Рекомендую всем, кто хочет подтянуть контур лица без инъекций.",
        date: "2024-03-22",
        image: "review_olechka_baranova.jpg"
    },
    {
        name: "Дарина Насырова",
        service: "Маникюр",
        text: "Делаю маникюр в Sculptura уже год. Мастера работают аккуратно, покрытие держится долго. Очень нравится, что используют качественные материалы и следят за стерильностью. Цены адекватные, а результат всегда на высоте!",
        date: "2024-04-08",
        image: "review_darina_nasyrova.jpg"
    },
    {
        name: "Лейла Нелюбина",
        service: "Наращивание ресниц",
        text: "Наращивание ресниц делаю только здесь! Мастер создает идеальную форму, которая подходит именно моим глазам. Реснички выглядят естественно, держатся долго. Никогда не было раздражения или дискомфорта. Очень довольна результатом!",
        date: "2024-04-12",
        image: "review_leyla_nelyubina.jpg"
    },
    {
        name: "Анна Провкова",
        service: "Макияж",
        text: "Пришла на макияж перед важным мероприятием. Мастер создала потрясающий образ! Все было идеально: и цветовая гамма, и техника нанесения. Макияж продержался весь вечер. Теперь обращаюсь только сюда за профессиональным макияжем.",
        date: "2024-04-18",
        image: "review_anna_provkova.jpg"
    }
];

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

async function createReviews() {
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
        themePath = themePath.replace(/\/$/, "");
        let wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, "");
        wpPath = wpPath.replace(/\/+/g, "/");
        themePath = themePath.replace(/\/+/g, "/");

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

        // Используем PHP скрипт для создания отзывов
        console.log("📝 Создаю отзывы через PHP скрипт...\n");
        await createReviewsViaPHP(executeCommand, wpPath, themePath);

        sshClient.end();
        await sftp.end();
        console.log("\n✅ Готово! Отзывы созданы в WordPress.");

    } catch (error) {
        console.error("❌ Ошибка:", error.message);
        try {
            await sftp.end();
        } catch (e) {}
        process.exit(1);
    }
}

async function createReviewsViaPHP(executeCommand, wpPath, themePath) {
    // Подготавливаем данные для PHP скрипта
    const reviewsJson = JSON.stringify(reviews).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    const phpScript = `<?php
require_once('${wpPath}/wp-load.php');
require_once('${wpPath}/wp-admin/includes/image.php');
require_once('${wpPath}/wp-admin/includes/file.php');
require_once('${wpPath}/wp-admin/includes/media.php');

$reviews = json_decode('${reviewsJson}', true);

$themeImagesPath = '${themePath}/assets/images/';
$uploadDir = wp_upload_dir();
$uploadPath = $uploadDir['path'] . '/';

foreach ($reviews as $review) {
    // Проверяем, существует ли уже отзыв с таким именем
    $existing_posts = get_posts([
        'post_type' => 'review',
        'title' => $review['name'],
        'post_status' => 'any',
        'numberposts' => 1
    ]);
    
    if (!empty($existing_posts)) {
        echo "Отзыв '{$review['name']}' уже существует (ID: {$existing_posts[0]->ID})\\n";
        continue;
    }
    
    // Создаем новый отзыв
    $post_id = wp_insert_post([
        'post_type' => 'review',
        'post_title' => $review['name'],
        'post_content' => $review['text'],
        'post_status' => 'publish',
        'post_author' => 1,
    ]);
    
    if ($post_id && !is_wp_error($post_id)) {
        // Сохраняем мета-поля
        update_post_meta($post_id, '_review_service', $review['service']);
        update_post_meta($post_id, '_review_date', $review['date']);
        
        // Загружаем изображение, если оно существует
        $imagePath = $themeImagesPath . $review['image'];
        if (file_exists($imagePath)) {
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
                
                echo "✅ Создан отзыв: {$review['name']} (ID: $post_id) с изображением\\n";
            } else {
                echo "⚠️ Создан отзыв: {$review['name']} (ID: $post_id), но не удалось загрузить изображение\\n";
            }
        } else {
            echo "✅ Создан отзыв: {$review['name']} (ID: $post_id) без изображения (файл не найден: $imagePath)\\n";
        }
    } else {
        $error = is_wp_error($post_id) ? $post_id->get_error_message() : 'Неизвестная ошибка';
        echo "❌ Ошибка при создании отзыва '{$review['name']}': $error\\n";
    }
}

echo "\\nГотово! Создано " . count($reviews) . " отзывов.\\n";
`;

    // Создаем PHP скрипт через SSH
    const scriptPath = "/tmp/create_reviews.php";
    const command = `cat > ${scriptPath} << 'ENDOFFILE'
${phpScript}
ENDOFFILE
`;
    
    await executeCommand(command);
    
    const result = await executeCommand(`php ${scriptPath}`);
    console.log(result);
    
    // Удаляем временный файл
    await executeCommand(`rm ${scriptPath}`);
}

// Запускаем скрипт
createReviews();

