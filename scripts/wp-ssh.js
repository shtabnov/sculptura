const ssh2 = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Загружаем конфигурацию
let deployConfig;

try {
  deployConfig = require('../deploy.config.js');
} catch (e) {
  console.error('❌ Ошибка: Не найден файл deploy.config.js');
  process.exit(1);
}

// Создаём класс для работы с WordPress через SSH
class WordPressSSH {
  constructor() {
    this.sftp = new ssh2();
    this.connected = false;
  }

  // Подключение к серверу
  async connect() {
    if (this.connected) return;

    try {
      const connectOptions = {
        host: deployConfig.ssh.host,
        port: deployConfig.ssh.port || 22,
        username: deployConfig.ssh.username,
        readyTimeout: 20000
      };

      if (deployConfig.ssh.password) {
        connectOptions.password = deployConfig.ssh.password;
      } else {
        const privateKey = this.getPrivateKey();
        if (privateKey) {
          connectOptions.privateKey = privateKey;
          if (deployConfig.ssh.passphrase) {
            connectOptions.passphrase = deployConfig.ssh.passphrase;
          }
        } else {
          throw new Error('Не указан метод аутентификации');
        }
      }

      await this.sftp.connect(connectOptions);
      this.connected = true;
      console.log('✅ Подключено к серверу');
    } catch (error) {
      throw new Error(`Ошибка подключения: ${error.message}`);
    }
  }

  // Получение приватного ключа
  getPrivateKey() {
    if (deployConfig.ssh.privateKey) {
      return deployConfig.ssh.privateKey;
    }

    const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');
    if (fs.existsSync(defaultKeyPath)) {
      try {
        return fs.readFileSync(defaultKeyPath);
      } catch (e) {
        return undefined;
      }
    }

    return undefined;
  }

  // Чтение файла с сервера
  async readFile(remotePath) {
    await this.connect();
    try {
      const content = await this.sftp.get(remotePath);
      return content.toString('utf8');
    } catch (error) {
      throw new Error(`Ошибка чтения файла ${remotePath}: ${error.message}`);
    }
  }

  // Запись файла на сервер
  async writeFile(remotePath, content) {
    await this.connect();
    try {
      // Создаём директорию если её нет
      const dir = path.dirname(remotePath);
      await this.sftp.mkdir(dir, true);
      
      // Записываем файл
      await this.sftp.put(Buffer.from(content, 'utf8'), remotePath);
      console.log(`✅ Файл записан: ${remotePath}`);
      return true;
    } catch (error) {
      throw new Error(`Ошибка записи файла ${remotePath}: ${error.message}`);
    }
  }

  // Выполнение команды на сервере
  async exec(command) {
    await this.connect();
    return new Promise((resolve, reject) => {
      this.sftp.client.exec(command, (err, stream) => {
        if (err) {
          reject(new Error(`Ошибка выполнения команды: ${err.message}`));
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code, signal) => {
          resolve({ code, signal, stdout, stderr });
        });

        stream.on('data', (data) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    });
  }

  // Список файлов в директории
  async list(remotePath) {
    await this.connect();
    try {
      return await this.sftp.list(remotePath);
    } catch (error) {
      throw new Error(`Ошибка получения списка файлов ${remotePath}: ${error.message}`);
    }
  }

  // Проверка существования файла
  async exists(remotePath) {
    await this.connect();
    try {
      await this.sftp.stat(remotePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Отключение
  async disconnect() {
    if (this.connected) {
      await this.sftp.end();
      this.connected = false;
      console.log('✅ Отключено от сервера');
    }
  }

  // Получение пути к теме WordPress
  getThemePath() {
    return deployConfig.remote.themePath;
  }

  // Получение пути к файлу темы
  getThemeFilePath(filePath) {
    const themePath = deployConfig.remote.themePath;
    return path.join(themePath, filePath).replace(/\\/g, '/');
  }
}

module.exports = WordPressSSH;

