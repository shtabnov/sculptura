// Gulp задача для деплоя JS
const ssh2 = require('ssh2-sftp-client');
const deployConfig = require('../deploy.config.js');
const path = require('path');
const fs = require('fs');
const os = require('os');

const sftp = new ssh2();

function getPrivateKey() {
  if (deployConfig.ssh.privateKey) {
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

module.exports = function deployJS() {
  return new Promise(async (resolve, reject) => {
    try {
      const themePath = deployConfig.remote.themePath;
      const remoteJSPath = path.join(themePath, 'assets/js').replace(/\\/g, '/');
      const localJSPath = path.join(__dirname, '..', 'wp-theme', 'assets', 'js');
      
      const result = await deployAssets(localJSPath, remoteJSPath);
      if (result) {
        resolve();
      } else {
        reject(new Error('Деплой JS не удался'));
      }
    } catch (error) {
      reject(error);
    }
  });
};

