/**
 * Скрипт для вывода списка всех услуг в WordPress через SSH
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

async function listServices() {
  try {
    console.log('🔌 Подключение к серверу...');
    
    const connectOptions = {
      host: deployConfig.ssh.host,
      port: deployConfig.ssh.port || 22,
      username: deployConfig.ssh.username,
      readyTimeout: 20000
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
        throw new Error('Не указан метод аутентификации. Укажите password или добавьте SSH ключ');
      }
    }

    await sftp.connect(connectOptions);
    console.log('✅ Подключение установлено\n');

    let themePath = deployConfig.remote.themePath.replace(/\/$/, '');
    let wpPath = themePath.replace(/\/wp-content\/themes\/[^/]+$/, '');
    wpPath = wpPath.replace(/\/+/g, '/');
    
    console.log(`📁 Путь к WordPress: ${wpPath}\n`);

    await new Promise((resolve, reject) => {
      sshClient.on('ready', resolve);
      sshClient.on('error', reject);
      sshClient.connect(connectOptions);
    });

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

    const phpScript = `<?php
require_once('${wpPath}/wp-load.php');

$services = get_posts([
    'post_type' => 'service',
    'posts_per_page' => -1,
    'post_status' => 'any',
    'orderby' => 'menu_order',
    'order' => 'ASC'
]);

echo "Всего услуг: " . count($services) . "\\n\\n";

foreach ($services as $service) {
    echo "ID: {$service->ID}\\n";
    echo "Название: {$service->post_title}\\n";
    echo "Slug: {$service->post_name}\\n";
    echo "Статус: {$service->post_status}\\n";
    echo "Menu Order: {$service->menu_order}\\n";
    echo "---\\n";
}
`;

    const scriptPath = '/tmp/list_services.php';
    await sftp.put(Buffer.from(phpScript), scriptPath);

    const result = await executeCommand(`php ${scriptPath}`);
    console.log(result);

    await executeCommand(`rm ${scriptPath}`);

    sshClient.end();
    await sftp.end();

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    try {
      await sftp.end();
    } catch (e) {}
    process.exit(1);
  }
}

listServices();

