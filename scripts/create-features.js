/**
 * Скрипт для создания features (преимуществ) в WordPress через SSH
 */

const ssh2 = require('ssh2-sftp-client');
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Загружаем конфиг деплоя
let deployConfig;
try {
  deployConfig = require('../deploy.config.js');
} catch (error) {
  console.error('❌ deploy.config.js не найден. Создайте его на основе deploy.config.example.js');
  process.exit(1);
}

const sftp = new ssh2();
const sshClient = new Client();

// Данные features из захардкоженного массива
const features = [
  {
    title: 'Натуральные продукты',
    excerpt: 'Используем только органическую косметику и масла премиум-класса',
    icon: 'leaf.svg',
    menu_order: 1
  },
  {
    title: 'Профессионализм',
    excerpt: 'Сертифицированные мастера с многолетним опытом работы',
    icon: 'sparkles.svg',
    menu_order: 2
  },
  {
    title: 'Индивидуальный подход',
    excerpt: 'Персональные программы ухода для каждого клиента',
    icon: 'heart.svg',
    menu_order: 3
  },
  {
    title: 'Удобное время',
    excerpt: 'Работаем ежедневно с 9:00 до 21:00 без выходных',
    icon: 'clock.svg',
    menu_order: 4
  }
];

function getPrivateKey() {
  if (deployConfig.ssh && deployConfig.ssh.privateKey) {
    return deployConfig.ssh.privateKey;
  }
  
  const projectKeyPath = path.join(__dirname, '..', '.ssh', 'id_rsa');
  if (fs.existsSync(projectKeyPath)) {
    try {
      return fs.readFileSync(projectKeyPath);
    } catch (e) {
      console.warn('⚠️ Не удалось прочитать SSH ключ из проекта');
    }
  }
  
  const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');
  if (fs.existsSync(defaultKeyPath)) {
    try {
      return fs.readFileSync(defaultKeyPath);
    } catch (e) {
      console.warn('⚠️ Не удалось прочитать стандартный SSH ключ');
    }
  }
  
  return undefined;
}

async function createFeatures() {
  try {
    console.log('🔌 Подключение к серверу...');
    
    const connectOptions = {
      host: deployConfig.ssh.host,
      port: deployConfig.ssh.port || 22,
      username: deployConfig.ssh.username,
      readyTimeout: 20000
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
        throw new Error('Не указан метод аутентификации. Укажите password или добавьте SSH ключ');
      }
    }

    await sftp.connect(connectOptions);
    console.log('✅ Подключение установлено\n');

    // Определяем путь к WordPress
    let themePath = deployConfig.remote.themePath;
    // Убираем завершающий слэш если есть
    themePath = themePath.replace(/\/$/, '');
    let wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, '');
    // Убираем двойные слэши
    wpPath = wpPath.replace(/\/+/g, '/');
    
    console.log(`📁 Путь к WordPress: ${wpPath}\n`);

    // Подключаемся через SSH2 для выполнения команд
    await new Promise((resolve, reject) => {
      sshClient.on('ready', resolve);
      sshClient.on('error', reject);
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
          
          let output = '';
          stream.on('close', () => {
            resolve(output);
          });
          
          stream.on('data', (data) => {
            output += data.toString();
          });
          
          stream.stderr.on('data', (data) => {
            output += data.toString();
          });
        });
      });
    };

    // Используем PHP скрипт для создания features (более надежно)
    console.log('📝 Создаю features через PHP скрипт...\n');
    await createFeaturesViaPHP(executeCommand);
    
    sshClient.end();

    await sftp.end();
    console.log('\n✅ Готово! Features созданы в WordPress.');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    try {
      await sftp.end();
    } catch (e) {}
    process.exit(1);
  }
}

async function createFeaturesViaPHP(executeCommand) {
  // Создаем PHP скрипт для создания features
  let themePath = deployConfig.remote.themePath.replace(/\/$/, '');
  let wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, '');
  // Убираем двойные слэши
  wpPath = wpPath.replace(/\/+/g, '/');
  themePath = themePath.replace(/\/+/g, '/');
  
  // Создаем JSON файл с данными features
  const jsonPath = '/tmp/features_data.json';
  await sftp.put(Buffer.from(JSON.stringify(features, null, 2)), jsonPath);
  
  const phpScript = `<?php
require_once('${wpPath}/wp-load.php');

$json_data = file_get_contents('${jsonPath}');
$features = json_decode($json_data, true);

// Получаем список slug'ов новых features (создаем из title)
$new_slugs = [];
foreach ($features as $feature) {
    $new_slugs[] = sanitize_title($feature['title']);
}

// Получаем все существующие features
$all_features = get_posts([
    'post_type' => 'feature',
    'posts_per_page' => -1,
    'post_status' => 'any'
]);

// Удаляем старые features, которых нет в новом списке
foreach ($all_features as $old_feature) {
    $old_slug = $old_feature->post_name;
    if (!in_array($old_slug, $new_slugs)) {
        wp_delete_post($old_feature->ID, true);
        echo "Удален старый feature: {$old_feature->post_title} (slug: $old_slug)\\n";
    }
}

// Создаем/обновляем новые features
foreach ($features as $feature) {
    $slug = sanitize_title($feature['title']);
    
    // Проверяем, существует ли уже feature
    $existing = get_posts([
        'post_type' => 'feature',
        'name' => $slug,
        'posts_per_page' => 1
    ]);
    
    $post_id = null;
    
    if (!empty($existing)) {
        $post_id = $existing[0]->ID;
        echo "Feature '{$feature['title']}' уже существует (ID: $post_id)\\n";
        
        // Обновляем данные feature
        wp_update_post([
            'ID' => $post_id,
            'post_title' => $feature['title'],
            'post_excerpt' => $feature['excerpt'],
            'menu_order' => $feature['menu_order']
        ]);
    } else {
        // Создаем пост
        $post_id = wp_insert_post([
            'post_type' => 'feature',
            'post_title' => $feature['title'],
            'post_excerpt' => $feature['excerpt'],
            'post_status' => 'publish',
            'post_name' => $slug,
            'menu_order' => $feature['menu_order']
        ]);
        
        if ($post_id) {
            echo "Создан feature: {$feature['title']} (ID: $post_id)\\n";
        }
    }
    
    // Устанавливаем иконку в мета-поле
    if ($post_id) {
        $icon_path = '${themePath}/assets/images/icon/' . $feature['icon'];
        $icon_url = get_template_directory_uri() . '/assets/images/icon/' . $feature['icon'];
        
        // Принудительно используем HTTPS для URL иконки
        if (is_ssl() || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')) {
            $icon_url = str_replace('http://', 'https://', $icon_url);
        }
        
        // Сохраняем URL иконки в мета-поле
        update_post_meta($post_id, '_feature_icon', $icon_url);
        echo "  Иконка установлена: {$feature['icon']}\\n";
        
        // Также загружаем иконку как миниатюру, если файл существует
        if (file_exists($icon_path)) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            require_once(ABSPATH . 'wp-admin/includes/media.php');
            require_once(ABSPATH . 'wp-admin/includes/image.php');
            
            // Копируем файл во временную директорию для media_handle_sideload
            $tmp_file = wp_tempnam(basename($icon_path));
            copy($icon_path, $tmp_file);
            
            $file_array = [
                'name' => $feature['icon'],
                'tmp_name' => $tmp_file
            ];
            
            $attachment_id = media_handle_sideload($file_array, $post_id);
            
            // Удаляем временный файл
            @unlink($tmp_file);
            
            if (!is_wp_error($attachment_id)) {
                set_post_thumbnail($post_id, $attachment_id);
                echo "  Миниатюра установлена\\n";
            }
        }
    }
}

// Очищаем кеш WordPress
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
    echo "Кеш WordPress очищен\\n";
}

echo "Готово!\\n";
`;

  const scriptPath = '/tmp/create_features.php';
  await sftp.put(Buffer.from(phpScript), scriptPath);
  
  const result = await executeCommand(`php ${scriptPath}`);
  
  console.log(result);
  
  // Удаляем временные файлы
  await executeCommand(`rm ${scriptPath} ${jsonPath}`);
}

// Запускаем скрипт
createFeatures();

