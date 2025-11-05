// Скрипт для поиска WordPress на сервере
// Использование: node scripts/find-wp-path.js

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

const sftp = new ssh2();

function getPrivateKey() {
  if (deployConfig.ssh.privateKey) {
    return deployConfig.ssh.privateKey;
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

async function findWordPressPath() {
  try {
    console.log('🔍 Поиск WordPress на сервере...\n');
    
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
    console.log('✅ Подключено к серверу\n');
    
    // Получаем домашнюю директорию
    let homeDir;
    try {
      homeDir = await sftp.realPath('~');
      if (homeDir.includes('~')) {
        // Если realPath вернул путь с тильдой, пробуем другой способ
        homeDir = `/home/${deployConfig.ssh.username}`;
      }
    } catch (e) {
      homeDir = `/home/${deployConfig.ssh.username}`;
    }
    
    console.log(`📁 Домашняя директория: ${homeDir}\n`);
    
    // Возможные пути к WordPress
    const possiblePaths = [
      `${homeDir}/public_html`,
      `${homeDir}/www`,
      `${homeDir}/httpdocs`,
      `${homeDir}/domains`,
      `/var/www/html`,
      `/var/www`,
      `/home/${deployConfig.ssh.username}/public_html`,
      `/home/${deployConfig.ssh.username}/www`,
    ];
    
    console.log('🔍 Проверка возможных путей...\n');
    
    const foundPaths = [];
    
    for (const testPath of possiblePaths) {
      try {
        const exists = await sftp.exists(testPath);
        if (exists) {
          const stats = await sftp.stat(testPath);
          if (stats.isDirectory) {
            foundPaths.push(testPath);
            console.log(`✅ ${testPath}`);
            
            // Проверяем, есть ли там WordPress
            try {
              const wpConfig = `${testPath}/wp-config.php`;
              const wpContent = `${testPath}/wp-content`;
              
              const hasWpConfig = await sftp.exists(wpConfig);
              const hasWpContent = await sftp.exists(wpContent);
              
              if (hasWpConfig || hasWpContent) {
                console.log(`   📦 WordPress найден!`);
                
                if (hasWpContent) {
                  const themesPath = `${wpContent}/themes`;
                  const themesExists = await sftp.exists(themesPath);
                  
                  if (themesExists) {
                    console.log(`   📂 Путь к темам: ${themesPath}`);
                    
                    // Список тем
                    try {
                      const themes = await sftp.list(themesPath);
                      console.log(`   📋 Установленные темы (${themes.length}):`);
                      themes.forEach(theme => {
                        if (theme.type === 'd') {
                          console.log(`      - ${theme.name}`);
                        }
                      });
                    } catch (e) {
                      // Игнорируем ошибки списка
                    }
                  }
                }
              }
            } catch (e) {
              // Игнорируем ошибки проверки WordPress
            }
          }
        }
      } catch (e) {
        // Игнорируем ошибки
      }
    }
    
    if (foundPaths.length === 0) {
      console.log('\n❌ WordPress не найден в стандартных местах\n');
      console.log('💡 Рекомендации:');
      console.log('   1. Проверьте путь вручную через SSH');
      console.log('   2. Используйте команду: find ~ -name "wp-config.php" 2>/dev/null');
      console.log('   3. Или укажите путь вручную в deploy.config.js');
    } else {
      console.log('\n💡 Рекомендуемый путь для deploy.config.js:');
      foundPaths.forEach(p => {
        console.log(`   themePath: "${p}/wp-content/themes/sculptura/"`);
      });
    }
    
    await sftp.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    if (sftp) {
      await sftp.end();
    }
    process.exit(1);
  }
}

findWordPressPath();

