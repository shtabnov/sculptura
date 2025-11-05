// Gulp задача для деплоя CSS
const ssh2 = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Опциональная загрузка конфига деплоя
let deployConfig = null;
const configPath = path.join(__dirname, '..', 'deploy.config.js');
if (fs.existsSync(configPath)) {
  deployConfig = require(configPath);
}

const sftp = new ssh2();

function getPrivateKey() {
  if (deployConfig && deployConfig.ssh && deployConfig.ssh.privateKey) {
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

module.exports = function deployCSS() {
  return new Promise(async (resolve, reject) => {
    // Если конфиг не найден, пропускаем деплой
    if (!deployConfig) {
      console.log('⚠️  deploy.config.js не найден, пропускаем деплой CSS');
      resolve();
      return;
    }

    try {
      const themePath = deployConfig.remote.themePath;
      const remoteCSSPath = path.join(themePath, 'assets/css').replace(/\\/g, '/');
      const localCSSPath = path.join(__dirname, '..', 'wp-theme', 'assets', 'css');
      
      const result = await deployAssets(localCSSPath, remoteCSSPath);
      if (result) {
        resolve();
      } else {
        reject(new Error('Деплой CSS не удался'));
      }
    } catch (error) {
      reject(error);
    }
  });
};

