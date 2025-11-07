/**
 * Скрипт для деплоя шрифтов на сервер
 */

const ssh2 = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Загружаем конфиг деплоя
let deployConfig;
try {
  deployConfig = require('../deploy.config.js');
} catch (error) {
  console.error('❌ deploy.config.js не найден');
  process.exit(1);
}

const sftp = new ssh2();

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

async function deployFonts() {
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
        throw new Error('Не указан метод аутентификации');
      }
    }

    await sftp.connect(connectOptions);
    console.log('✅ Подключение установлено\n');

    const localFontsPath = path.join(__dirname, '..', 'wp-theme', 'assets', 'fonts');
    const remoteFontsPath = deployConfig.remote.themePath + '/assets/fonts';

    if (!fs.existsSync(localFontsPath)) {
      throw new Error(`Папка не найдена: ${localFontsPath}`);
    }

    console.log(`📤 Деплой шрифтов ${localFontsPath} → ${remoteFontsPath}...`);
    await sftp.mkdir(remoteFontsPath, true);
    await sftp.uploadDir(localFontsPath, remoteFontsPath);
    console.log('✅ Шрифты успешно задеплоены\n');

    await sftp.end();

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    try {
      await sftp.end();
    } catch (e) {}
    process.exit(1);
  }
}

deployFonts();

