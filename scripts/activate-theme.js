// Скрипт для активации темы через WP-CLI
// Использование: node scripts/activate-theme.js

const { Client } = require('ssh2');
const deployConfig = require('../deploy.config.js');

async function activateTheme() {
  const conn = new Client();
  
  return new Promise((resolve, reject) => {
    conn.on('ready', () => {
      console.log('✅ Подключено к серверу\n');
      
      // Получаем путь к WordPress из конфигурации или используем стандартный путь
      // Путь должен быть указан в deploy.config.js или вычисляется автоматически
      const themePath = deployConfig.remote.themePath || '';
      // Извлекаем базовый путь WordPress (убираем wp-content/themes/sculptura/)
      const wpPath = themePath 
        ? themePath.replace(/\/wp-content\/themes\/sculptura\/?$/, '')
        : null;
      
      if (!wpPath) {
        console.error('❌ Не удалось определить путь к WordPress');
        console.log('💡 Укажите правильный themePath в deploy.config.js');
        reject(new Error('Не указан путь к WordPress'));
        return;
      }
      
      // Команда для активации темы через WP-CLI
      const command = `cd ${wpPath} && wp theme activate sculptura --allow-root`;
      
      console.log(`🔄 Активация темы "sculptura"...`);
      console.log(`   WordPress путь: ${wpPath}`);
      console.log(`   Команда: ${command}\n`);
      
      conn.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        
        let stdout = '';
        let stderr = '';
        
        stream.on('data', (data) => {
          stdout += data.toString();
        });
        
        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        stream.on('close', (code) => {
          conn.end();
          
          if (code === 0) {
            console.log('✅ Тема успешно активирована!');
            if (stdout) console.log(stdout);
            resolve();
          } else {
            if (stderr.includes('not found') || stderr.includes('command not found')) {
              console.log('⚠️ WP-CLI не установлен или не доступен на сервере');
              console.log('\n💡 Активируйте тему вручную через админку:');
              console.log('   1. Войдите в WordPress админку');
              console.log('   2. Перейдите: Внешний вид → Темы');
              console.log('   3. Найдите тему "Sculptura"');
              console.log('   4. Нажмите "Активировать"');
            } else {
              console.error('❌ Ошибка активации темы:');
              console.error(stderr || stdout);
            }
            reject(new Error(`Команда завершилась с кодом ${code}`));
          }
        });
      });
    });
    
    conn.on('error', (err) => {
      reject(err);
    });
    
    // Подключение
    const connectOptions = {
      host: deployConfig.ssh.host,
      port: deployConfig.ssh.port || 22,
      username: deployConfig.ssh.username,
      readyTimeout: 20000
    };
    
    if (deployConfig.ssh.password) {
      connectOptions.password = deployConfig.ssh.password;
    } else {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      let privateKey;
      if (deployConfig.ssh.privateKey) {
        privateKey = deployConfig.ssh.privateKey;
      } else {
        const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');
        if (fs.existsSync(defaultKeyPath)) {
          privateKey = fs.readFileSync(defaultKeyPath);
        }
      }
      
      if (privateKey) {
        connectOptions.privateKey = privateKey;
        if (deployConfig.ssh.passphrase) {
          connectOptions.passphrase = deployConfig.ssh.passphrase;
        }
      } else {
        reject(new Error('Не указан метод аутентификации'));
        return;
      }
    }
    
    conn.connect(connectOptions);
  });
}

// Запуск
activateTheme()
  .then(() => {
    console.log('\n🎉 Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  });

