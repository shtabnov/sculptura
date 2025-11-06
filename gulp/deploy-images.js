const ssh2 = require('ssh2-sftp-client');
let deployConfig;
try {
  deployConfig = require('../deploy.config.js');
} catch (error) {
  console.warn('⚠️ deploy.config.js не найден. Деплой будет пропущен.');
  deployConfig = null;
}
const path = require('path');
const fs = require('fs');
const os = require('os');

const sftp = new ssh2();

function getPrivateKey() {
  if (!deployConfig || !deployConfig.ssh) return null;
  
  // Проверяем разные варианты путей к ключу
  const possiblePaths = [
    deployConfig.ssh.privateKeyPath,
    path.join(os.homedir(), '.ssh', 'id_rsa'),
    path.join(__dirname, '..', '.ssh', 'id_rsa'),
  ].filter(Boolean);
  
  for (const keyPath of possiblePaths) {
    if (fs.existsSync(keyPath)) {
      try {
        return fs.readFileSync(keyPath);
      } catch (error) {
        console.warn(`⚠️ Не удалось прочитать ключ из ${keyPath}`);
      }
    }
  }
  
  return null;
}

async function deployAssets(localPath, remotePath) {
  try {
    console.log(`📤 Деплой ${localPath} → ${remotePath}...`);
    
    if (!fs.existsSync(localPath)) {
      console.error(`❌ Локальная директория не найдена: ${localPath}`);
      return false;
    }

    const connectOptions = {
      host: deployConfig.ssh.host,
      port: deployConfig.ssh.port || 22,
      username: deployConfig.ssh.username,
      readyTimeout: 20000
    };

    // Сначала пробуем использовать ключ (для рабочего места)
    const privateKey = getPrivateKey();
    if (privateKey) {
      connectOptions.privateKey = privateKey;
      if (deployConfig.ssh.passphrase) {
        connectOptions.passphrase = deployConfig.ssh.passphrase;
      }
    }
    
    // Добавляем пароль как fallback (для работы из дома)
    if (deployConfig.ssh.password) {
      connectOptions.password = deployConfig.ssh.password;
    }
    
    // Проверяем, что хотя бы один метод указан
    if (!privateKey && !deployConfig.ssh.password) {
      throw new Error('Не указан метод аутентификации. Укажите password или добавьте SSH ключ');
    }

    await sftp.connect(connectOptions);
    await sftp.mkdir(remotePath, true);
    await sftp.uploadDir(localPath, remotePath);
    await sftp.end();
    
    console.log(`✅ Успешно задеплоено: ${remotePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка деплоя:`, error.message);
    try {
      await sftp.end();
    } catch (e) {}
    return false;
  }
}

module.exports = function deployImages() {
  return new Promise(async (resolve, reject) => {
    // Если конфиг не найден, пропускаем деплой
    if (!deployConfig) {
      console.log('⚠️  deploy.config.js не найден, пропускаем деплой изображений');
      resolve();
      return;
    }

    try {
      const themePath = deployConfig.remote.themePath;
      const remoteImagesPath = path.join(themePath, 'assets/images').replace(/\\/g, '/');
      const localImagesPath = path.join(__dirname, '..', 'wp-theme', 'assets', 'images');
      
      const result = await deployAssets(localImagesPath, remoteImagesPath);
      if (result) {
        resolve();
      } else {
        reject(new Error('Деплой изображений не удался'));
      }
    } catch (error) {
      reject(error);
    }
  });
};

