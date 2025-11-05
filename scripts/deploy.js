const ssh2 = require('ssh2-sftp-client');
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Загружаем конфигурацию
let deployConfig;

try {
  deployConfig = require('../deploy.config.js');
} catch (e) {
  console.error('❌ Ошибка: Не найден файл deploy.config.js');
  console.error('Создайте файл deploy.config.js на основе deploy.config.example.js');
  process.exit(1);
}

const sftp = new ssh2();
let sshClient = null;
let homeDir = null;

// Получаем режим деплоя из аргументов командной строки
const deployMode = process.argv[2] || deployConfig.deploy.mode || 'all';

// Функция для загрузки файлов
async function uploadFiles(localPath, remotePath) {
  try {
    console.log(`📤 Загрузка ${localPath} → ${remotePath}...`);
    
    // Проверяем существование локальной директории
    if (!fs.existsSync(localPath)) {
      console.error(`❌ Локальная директория не найдена: ${localPath}`);
      return false;
    }

    // Создаём удалённую директорию если её нет
    await sftp.mkdir(remotePath, true);
    
    // Загружаем файлы
    await sftp.uploadDir(localPath, remotePath);
    
    console.log(`✅ Успешно загружено: ${remotePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при загрузке ${localPath}:`, error.message);
    return false;
  }
}

// Функция для получения SSH ключа
function getPrivateKey() {
  // Если указан явно в конфиге
  if (deployConfig.ssh.privateKey) {
    return deployConfig.ssh.privateKey;
  }
  
  // Пробуем использовать стандартный ключ из ~/.ssh/id_rsa
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

// Функция для расширения пути с тильдой (~) через существующее SFTP соединение
async function expandTildePath(remotePath) {
  // Если путь не начинается с тильды, возвращаем как есть
  if (!remotePath.startsWith('~')) {
    return remotePath;
  }
  
  // Если домашняя директория уже получена, используем её
  if (homeDir) {
    return remotePath.replace('~', homeDir);
  }
  
  // Получаем домашнюю директорию через realPath() или команду echo
  try {
    // Пробуем использовать realPath для получения абсолютного пути
    try {
      const homePath = await sftp.realPath('~');
      homeDir = homePath;
      return remotePath.replace('~', homeDir);
    } catch (realPathError) {
      // Если realPath не работает, используем SSH команду через отдельное соединение
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
      
      return new Promise((resolve, reject) => {
        sshClient = new Client();
        
        sshClient.on('ready', () => {
          sshClient.exec('echo $HOME', (err, stream) => {
            if (err) {
              reject(err);
              return;
            }
            
            let output = '';
            stream.on('data', (chunk) => {
              output += chunk.toString();
            });
            
            stream.on('close', (code) => {
              if (code === 0) {
                homeDir = output.trim();
                sshClient.end();
                resolve(remotePath.replace('~', homeDir));
              } else {
                sshClient.end();
                reject(new Error(`Команда завершилась с кодом ${code}`));
              }
            });
          });
        });
        
        sshClient.on('error', (err) => {
          reject(err);
        });
        
        sshClient.connect(connectOptions);
      });
    }
  } catch (error) {
    console.warn(`⚠️ Не удалось расширить путь с тильдой: ${error.message}`);
    console.warn('   Используйте абсолютный путь в deploy.config.js');
    return remotePath;
  }
}

// Функция для синхронизации файлов темы
async function deployTheme() {
  try {
    console.log('🚀 Начинаем деплой WordPress темы...\n');
    console.log(`📋 Режим деплоя: ${deployMode}\n`);
    
    // Подготавливаем параметры подключения
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
        throw new Error('Не указан метод аутентификации. Укажите password или privateKey в deploy.config.js');
      }
    }
    
    // Подключаемся к серверу
    console.log(`🔌 Подключение к ${deployConfig.ssh.host}...`);
    await sftp.connect(connectOptions);
    
    console.log('✅ Подключение установлено\n');
    
    const results = [];
    
    // Расширяем пути с тильдой
    const themeRemotePath = await expandTildePath(deployConfig.remote.themePath);
    
    // Деплоим тему WordPress
    if (deployMode === 'theme' || deployMode === 'all') {
      const themeLocal = path.resolve(deployConfig.local.themeSource);
      
      const themeResult = await uploadFiles(themeLocal, themeRemotePath);
      results.push({ type: 'theme', success: themeResult });
    }
    
    // Деплоим ассеты (CSS, JS, изображения)
    if (deployMode === 'assets' || deployMode === 'all') {
      const assetsLocal = path.resolve(deployConfig.local.assetsPath);
      // Используем правильное объединение путей для удалённого сервера
      const assetsRemote = themeRemotePath.endsWith('/') 
        ? `${themeRemotePath}assets/` 
        : `${themeRemotePath}/assets/`;
      
      // Проверяем существование локальной директории ассетов
      if (fs.existsSync(assetsLocal)) {
        // Загружаем содержимое build/ в assets/ на сервере
        const assetsResult = await uploadFiles(assetsLocal, assetsRemote);
        results.push({ type: 'assets', success: assetsResult });
      } else {
        console.warn(`⚠️ Директория ассетов не найдена: ${assetsLocal}`);
        console.warn('   Сначала соберите проект: npm run dev или gulp dev');
        results.push({ type: 'assets', success: false });
      }
    }
    
    // Закрываем соединения
    await sftp.end();
    if (sshClient) {
      sshClient.end();
    }
    
    console.log('\n📊 Результаты деплоя:');
    results.forEach(result => {
      console.log(`  ${result.type}: ${result.success ? '✅ Успешно' : '❌ Ошибка'}`);
    });
    
    const allSuccess = results.every(r => r.success);
    if (allSuccess) {
      console.log('\n🎉 Деплой завершён успешно!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Деплой завершён с ошибками');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    
    if (sftp) {
      await sftp.end();
    }
    if (sshClient) {
      sshClient.end();
    }
    
    process.exit(1);
  }
}

// Запускаем деплой
deployTheme();

