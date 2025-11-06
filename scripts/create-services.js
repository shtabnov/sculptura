/**
 * Скрипт для создания услуг в WordPress через SSH
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

// Данные услуг из v2design
const services = [
  {
    title: 'Классический массаж',
    excerpt: 'Глубокая релаксация и восстановление мышечного тонуса',
    content: `Классический массаж — это глубокое воздействие на мышечные ткани, направленное на расслабление, восстановление тонуса и улучшение общего самочувствия. Процедура помогает снять напряжение, улучшить кровообращение и лимфоток.

<h3>Что включает процедура:</h3>
<ul>
<li>Глубокое расслабление мышц</li>
<li>Улучшение кровообращения</li>
<li>Стимуляция лимфотока</li>
<li>Восстановление мышечного тонуса</li>
<li>Снятие напряжения и стресса</li>
</ul>`,
    image: 'card_classic_massage.jpg',
    slug: 'classic-massage',
    menu_order: 1
  },
  {
    title: 'Массаж лица',
    excerpt: 'Омоложение и улучшение тонуса кожи лица',
    content: `Омоложение и улучшение тонуса кожи лица. Профессиональный массаж направлен на глубокое расслабление, улучшение кровообращения и лимфотока, а также повышение упругости и эластичности кожи.

<h3>Что включает процедура:</h3>
<ul>
<li>Расслабление мимических мышц</li>
<li>Улучшение кровообращения</li>
<li>Стимуляция лимфотока</li>
<li>Повышение упругости кожи</li>
<li>Улучшение цвета лица</li>
</ul>`,
    image: 'card_face_massage.jpg',
    slug: 'face-massage',
    menu_order: 2
  },
  {
    title: 'Буккальный массаж',
    excerpt: 'Уникальная техника внутриротового массажа для лифтинга',
    content: `Уникальная техника внутриротового массажа для лифтинга. Букальный массаж направлен на улучшение контуров лица, подтяжку кожи и тонизирование мышц.

<h3>Что включает процедура:</h3>
<ul>
<li>Улучшение кровообращения</li>
<li>Снятие мышечного напряжения</li>
<li>Повышение эластичности кожи</li>
<li>Улучшение контуров лица</li>
</ul>`,
    image: 'card_bucal.jpg',
    slug: 'bucal',
    menu_order: 3
  },
  {
    title: 'Маникюр',
    excerpt: 'Профессиональный уход за ногтями с натуральными покрытиями',
    content: `Профессиональный маникюр с использованием натуральных покрытий и бережных техник. Мы создаём ухоженные руки, подчёркивая вашу естественную красоту с помощью экологичных материалов.

<h3>Что включает процедура:</h3>
<ul>
<li>Обработка кутикулы</li>
<li>Придание формы ногтям</li>
<li>Покрытие натуральными лаками</li>
<li>Уход за кожей рук</li>
<li>Массаж кистей</li>
</ul>`,
    image: 'card_manicure.jpg',
    slug: 'manicure',
    menu_order: 4
  },
  {
    title: 'Ресницы',
    excerpt: 'Наращивание и ламинирование для естественного взгляда',
    content: `Наращивание и ламинирование ресниц для создания естественного, выразительного взгляда. Мы используем только качественные материалы и индивидуальный подход к каждому клиенту.

<h3>Что включает процедура:</h3>
<ul>
<li>Наращивание ресниц (классика, объем, гибрид)</li>
<li>Ламинирование натуральных ресниц</li>
<li>Окрашивание ресниц</li>
<li>Индивидуальный подбор формы и объема</li>
<li>Коррекция и уход</li>
</ul>`,
    image: 'card_eyelashes.jpg',
    slug: 'eyelashes',
    menu_order: 5
  },
  {
    title: 'Макияж',
    excerpt: 'Профессиональный макияж, подчёркивающий вашу естественную красоту',
    content: `Профессиональный макияж, который подчёркивает вашу естественную красоту. Мы создаём образы для любого случая — от повседневного до вечернего, используя качественную косметику и индивидуальный подход.

<h3>Что включает процедура:</h3>
<ul>
<li>Дневной макияж</li>
<li>Вечерний макияж</li>
<li>Свадебный макияж</li>
<li>Обучение технике макияжа</li>
<li>Подбор косметики под ваш тип кожи</li>
</ul>`,
    image: 'card_makeup.jpg',
    slug: 'makeup',
    menu_order: 6
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

async function createServices() {
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

    // Используем PHP скрипт для создания услуг (более надежно)
    console.log('📝 Создаю услуги через PHP скрипт...\n');
    await createServicesViaPHP(executeCommand);
    
    sshClient.end();

    await sftp.end();
    console.log('\n✅ Готово! Услуги созданы в WordPress.');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    try {
      await sftp.end();
    } catch (e) {}
    process.exit(1);
  }
}

async function createServicesViaWPCLI() {
  const themePath = deployConfig.remote.themePath;
  const wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, '');
  
  // Функция для выполнения команд через SSH2
  const execCommand = (command) => {
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

  for (const service of services) {
    console.log(`📝 Создаю услугу: ${service.title}`);
    
    // Проверяем, существует ли уже услуга с таким slug
    const checkCmd = `cd ${wpPath} && wp post list --post_type=service --name=${service.slug} --format=count`;
    const checkResult = await execCommand(checkCmd);
    
    if (parseInt(checkResult.trim()) > 0) {
      console.log(`   ⚠️ Услуга "${service.title}" уже существует, пропускаю...\n`);
      continue;
    }

    // Создаем пост
    const escapedContent = service.content.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/\n/g, '\\n');
    const createCmd = `cd ${wpPath} && wp post create --post_type=service --post_title="${service.title}" --post_excerpt="${service.excerpt}" --post_content="${escapedContent}" --post_status=publish --post_name=${service.slug} --menu_order=${service.menu_order}`;
    
    const createResult = await execCommand(createCmd);
    
    const postIdMatch = createResult.match(/Created post (\d+)/);
    if (!postIdMatch) {
      console.error(`   ❌ Ошибка создания: ${createResult}`);
      continue;
    }

    const postId = postIdMatch[1];
    console.log(`   ✅ Создан пост ID: ${postId}`);
    
    // Загружаем изображение
    const localImagePath = path.join(__dirname, '..', 'src', 'images', service.image);
    const remoteImagePath = `/tmp/${service.image}`;
    
    // Копируем изображение на сервер
    await sftp.put(localImagePath, remoteImagePath);
    
    // Импортируем изображение в WordPress
    const importCmd = `cd ${wpPath} && wp media import ${remoteImagePath} --post_id=${postId} --title="${service.title}" --featured_image`;
    const importResult = await execCommand(importCmd);
    
    if (importResult.includes('Successfully imported') || importResult.includes('Imported')) {
      console.log(`   ✅ Изображение загружено`);
    } else {
      console.warn(`   ⚠️ Не удалось загрузить изображение: ${importResult}`);
    }
    
    // Удаляем временный файл
    await execCommand(`rm ${remoteImagePath}`);
    
    console.log('');
  }
}


async function createServicesViaPHP(executeCommand) {
  // Создаем PHP скрипт для создания услуг
  let themePath = deployConfig.remote.themePath.replace(/\/$/, '');
  let wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, '');
  // Убираем двойные слэши
  wpPath = wpPath.replace(/\/+/g, '/');
  themePath = themePath.replace(/\/+/g, '/');
  
  // Создаем JSON файл с данными услуг
  const jsonPath = '/tmp/services_data.json';
  await sftp.put(Buffer.from(JSON.stringify(services, null, 2)), jsonPath);
  
  const phpScript = `<?php
require_once('${wpPath}/wp-load.php');

$json_data = file_get_contents('${jsonPath}');
$services = json_decode($json_data, true);

foreach ($services as $service) {
    // Проверяем, существует ли уже услуга
    $existing = get_posts([
        'post_type' => 'service',
        'name' => $service['slug'],
        'posts_per_page' => 1
    ]);
    
    $post_id = null;
    
    if (!empty($existing)) {
        $post_id = $existing[0]->ID;
        echo "Услуга '{$service['title']}' уже существует (ID: $post_id)\\n";
        
        // Обновляем данные услуги
        wp_update_post([
            'ID' => $post_id,
            'post_title' => $service['title'],
            'post_excerpt' => $service['excerpt'],
            'post_content' => $service['content'],
            'menu_order' => $service['menu_order']
        ]);
    } else {
        // Создаем пост
        $post_id = wp_insert_post([
            'post_type' => 'service',
            'post_title' => $service['title'],
            'post_excerpt' => $service['excerpt'],
            'post_content' => $service['content'],
            'post_status' => 'publish',
            'post_name' => $service['slug'],
            'menu_order' => $service['menu_order']
        ]);
        
        if ($post_id) {
            echo "Создана услуга: {$service['title']} (ID: $post_id)\\n";
        }
    }
    
    // Загружаем изображение (если услуга существует или создана)
    if ($post_id) {
        $image_path = '${themePath}/assets/images/' . $service['image'];
        if (file_exists($image_path)) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            require_once(ABSPATH . 'wp-admin/includes/media.php');
            require_once(ABSPATH . 'wp-admin/includes/image.php');
            
            // Копируем файл во временную директорию для media_handle_sideload
            $tmp_file = wp_tempnam(basename($image_path));
            copy($image_path, $tmp_file);
            
            $file_array = [
                'name' => $service['image'],
                'tmp_name' => $tmp_file
            ];
            
            $attachment_id = media_handle_sideload($file_array, $post_id);
            
            // Удаляем временный файл
            @unlink($tmp_file);
            
            if (!is_wp_error($attachment_id)) {
                set_post_thumbnail($post_id, $attachment_id);
                echo "  Изображение установлено\\n";
            } else {
                echo "  Ошибка загрузки изображения: " . $attachment_id->get_error_message() . "\\n";
            }
        } else {
            echo "  Изображение не найдено: $image_path\\n";
        }
    }
}
echo "Готово!\\n";
`;

  const scriptPath = '/tmp/create_services.php';
  await sftp.put(Buffer.from(phpScript), scriptPath);
  
  const result = await executeCommand(`php ${scriptPath}`);
  
  console.log(result);
  
  // Удаляем временные файлы
  await executeCommand(`rm ${scriptPath} ${jsonPath}`);
}

// Запускаем скрипт
createServices();

