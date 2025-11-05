// Скрипт для проверки SSH подключения к серверу
// Использование: node scripts/test-ssh-connection.js

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
  console.error('Создайте файл deploy.config.js на основе deploy.config.example.js');
  process.exit(1);
}

const sftp = new ssh2();

// Функция для получения SSH ключа
function getPrivateKey() {
  // Если указан явно в конфиге
  if (deployConfig.ssh.privateKey) {
    return deployConfig.ssh.privateKey;
  }
  
  // Пробуем использовать ключ из проекта .ssh/id_rsa
  const projectKeyPath = path.join(__dirname, '..', '.ssh', 'id_rsa');
  if (fs.existsSync(projectKeyPath)) {
    try {
      console.log('🔑 Найден SSH ключ в проекте: .ssh/id_rsa');
      return fs.readFileSync(projectKeyPath);
    } catch (e) {
      console.warn('⚠️ Не удалось прочитать SSH ключ из проекта');
    }
  }
  
  // Пробуем использовать стандартный ключ из ~/.ssh/id_rsa
  const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');
  if (fs.existsSync(defaultKeyPath)) {
    try {
      console.log('🔑 Найден стандартный SSH ключ: ~/.ssh/id_rsa');
      return fs.readFileSync(defaultKeyPath);
    } catch (e) {
      console.warn('⚠️ Не удалось прочитать стандартный SSH ключ');
    }
  }
  
  return undefined;
}

async function testConnection() {
  try {
    console.log('🔍 Проверка SSH подключения...\n');
    console.log(`📋 Параметры подключения:`);
    console.log(`   Host: ${deployConfig.ssh.host}`);
    console.log(`   Port: ${deployConfig.ssh.port || 22}`);
    console.log(`   Username: ${deployConfig.ssh.username}`);
    console.log(`   Theme Path: ${deployConfig.remote.themePath}\n`);
    
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
      console.log('🔑 Используется аутентификация по паролю\n');
    } else {
      const privateKey = getPrivateKey();
      if (privateKey) {
        connectOptions.privateKey = privateKey;
        if (deployConfig.ssh.passphrase) {
          connectOptions.passphrase = deployConfig.ssh.passphrase;
        }
        console.log('🔑 Используется аутентификация по SSH ключу\n');
      } else {
        throw new Error('Не указан метод аутентификации. Укажите password или privateKey в deploy.config.js');
      }
    }
    
    // Подключаемся к серверу
    console.log(`🔌 Подключение к ${deployConfig.ssh.host}...`);
    await sftp.connect(connectOptions);
    console.log('✅ Подключение установлено!\n');
    
    // Проверяем домашнюю директорию
    console.log('📁 Проверка домашней директории...');
    try {
      const homePath = await sftp.realPath('~');
      console.log(`✅ Домашняя директория: ${homePath}\n`);
    } catch (e) {
      console.warn(`⚠️ Не удалось определить домашнюю директорию: ${e.message}\n`);
    }
    
    // Проверяем путь к теме
    console.log('📁 Проверка пути к теме WordPress...');
    const themePath = deployConfig.remote.themePath;
    
    try {
      const exists = await sftp.exists(themePath);
      if (exists) {
        console.log(`✅ Путь существует: ${themePath}`);
        
        // Получаем информацию о директории
        const stats = await sftp.stat(themePath);
        console.log(`   Тип: ${stats.isDirectory ? 'Директория' : 'Файл'}`);
        console.log(`   Права: ${stats.mode}`);
        
        // Список файлов в директории (первые 10)
        try {
          const list = await sftp.list(themePath);
          console.log(`\n📄 Файлы в директории (${list.length} элементов):`);
          list.slice(0, 10).forEach(item => {
            const type = item.type === 'd' ? '📁' : '📄';
            console.log(`   ${type} ${item.name} (${item.size} байт)`);
          });
          if (list.length > 10) {
            console.log(`   ... и ещё ${list.length - 10} элементов`);
          }
        } catch (e) {
          console.warn(`   ⚠️ Не удалось получить список файлов: ${e.message}`);
        }
      } else {
        console.log(`❌ Путь не существует: ${themePath}`);
        console.log(`\n💡 Рекомендации:`);
        console.log(`   1. Проверьте правильность пути в deploy.config.js`);
        console.log(`   2. Убедитесь, что WordPress установлен на сервере`);
        console.log(`   3. Создайте директорию темы вручную, если нужно`);
        
        // Проверяем родительские директории
        const pathParts = themePath.split('/').filter(p => p);
        let currentPath = '';
        console.log(`\n🔍 Проверка родительских директорий:`);
        for (const part of pathParts) {
          currentPath += '/' + part;
          try {
            const exists = await sftp.exists(currentPath);
            if (exists) {
              const stats = await sftp.stat(currentPath);
              const type = stats.isDirectory ? '📁' : '📄';
              console.log(`   ${type} ${currentPath} - существует`);
            } else {
              console.log(`   ❌ ${currentPath} - не существует`);
              break;
            }
          } catch (e) {
            console.log(`   ⚠️ ${currentPath} - ошибка: ${e.message}`);
            break;
          }
        }
      }
    } catch (e) {
      console.error(`❌ Ошибка при проверке пути: ${e.message}`);
    }
    
    // Проверяем права на запись
    console.log(`\n✍️ Проверка прав на запись...`);
    try {
      const testFile = `${themePath}/.deploy-test-${Date.now()}.txt`;
      await sftp.put(Buffer.from('test'), testFile);
      await sftp.delete(testFile);
      console.log(`✅ Права на запись в ${themePath} - OK`);
    } catch (e) {
      console.error(`❌ Нет прав на запись в ${themePath}`);
      console.error(`   Ошибка: ${e.message}`);
      console.log(`\n💡 Рекомендации:`);
      console.log(`   1. Проверьте права доступа к директории`);
      console.log(`   2. Убедитесь, что пользователь ${deployConfig.ssh.username} имеет права на запись`);
    }
    
    // Закрываем соединение
    await sftp.end();
    console.log(`\n✅ Проверка завершена успешно!`);
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Ошибка подключения:', error.message);
    
    if (error.message.includes('All configured authentication methods failed')) {
      console.log('\n💡 Возможные причины:');
      console.log('   1. SSH ключ не добавлен на сервер');
      console.log('   2. Неправильный пароль (если используется)');
      console.log('   3. SSH ключ повреждён или неверный');
      console.log('\n🔧 Решения:');
      console.log('   1. Скопируйте SSH ключ на сервер:');
      console.log('      node scripts/copy-ssh-key.js');
      console.log('   2. Или используйте пароль для первого подключения');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Возможные причины:');
      console.log('   1. Неверный IP адрес или домен');
      console.log('   2. Сервер недоступен');
      console.log('   3. Неверный порт SSH');
      console.log('\n🔧 Решения:');
      console.log('   1. Проверьте доступность сервера: ping ' + deployConfig.ssh.host);
      console.log('   2. Проверьте правильность IP и порта в deploy.config.js');
    }
    
    if (sftp) {
      await sftp.end();
    }
    
    process.exit(1);
  }
}

// Запускаем проверку
testConnection();

