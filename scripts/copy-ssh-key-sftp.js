// Улучшенный скрипт для копирования SSH ключа через SFTP
// Использование: node scripts/copy-ssh-key-sftp.js

const ssh2 = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');

// Загружаем конфигурацию
let deployConfig;

try {
  deployConfig = require('../deploy.config.js');
} catch (e) {
  console.error('❌ Ошибка: Не найден файл deploy.config.js');
  process.exit(1);
}

const publicKeyPath = path.join(__dirname, '..', '.ssh', 'id_rsa.pub');

if (!fs.existsSync(publicKeyPath)) {
  console.error('❌ Публичный ключ не найден: .ssh/id_rsa.pub');
  console.error('Сначала создайте SSH ключ');
  process.exit(1);
}

const publicKey = fs.readFileSync(publicKeyPath, 'utf8').trim();
const host = deployConfig.ssh.host;
const username = deployConfig.ssh.username;
const port = deployConfig.ssh.port || 22;

console.log('📋 Информация для копирования SSH ключа:\n');
console.log(`Сервер: ${username}@${host}:${port}`);
console.log(`\nВаш публичный ключ:\n${publicKey}\n`);

// Функция для получения приватного ключа
function getPrivateKey() {
  if (deployConfig.ssh.privateKey) {
    return deployConfig.ssh.privateKey;
  }
  
  const projectKeyPath = path.join(__dirname, '..', '.ssh', 'id_rsa');
  if (fs.existsSync(projectKeyPath)) {
    try {
      return fs.readFileSync(projectKeyPath);
    } catch (e) {
      console.warn('⚠️ Не удалось прочитать ключ из проекта');
    }
  }
  
  return undefined;
}

async function copyKeyViaSFTP() {
  const sftp = new ssh2();
  
  try {
    console.log('🔧 Подключение к серверу через SFTP...\n');
    
    // Подготавливаем параметры подключения
    const connectOptions = {
      host: deployConfig.ssh.host,
      port: deployConfig.ssh.port || 22,
      username: deployConfig.ssh.username,
      readyTimeout: 20000
    };
    
    // Пробуем использовать пароль или ключ
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
        console.log('🔑 Используется аутентификация по ключу\n');
      } else {
        throw new Error('Не указан метод аутентификации. Укажите password в deploy.config.js для первого подключения');
      }
    }
    
    await sftp.connect(connectOptions);
    console.log('✅ Подключено к серверу\n');
    
    // Создаём директорию .ssh если её нет
    console.log('📁 Создание директории ~/.ssh...');
    try {
      await sftp.mkdir('~/.ssh', true);
    } catch (e) {
      // Директория может уже существовать
      console.log('   Директория уже существует');
    }
    
    // Читаем существующий authorized_keys или создаём новый
    console.log('📝 Чтение существующего authorized_keys...');
    let authorizedKeys = '';
    try {
      authorizedKeys = await sftp.get('~/.ssh/authorized_keys');
      authorizedKeys = authorizedKeys.toString('utf8');
      console.log('   Файл найден, проверяем наличие ключа...');
      
      // Проверяем, нет ли уже этого ключа
      if (authorizedKeys.includes(publicKey.split(' ')[1])) {
        console.log('✅ Ключ уже добавлен в authorized_keys');
        await sftp.end();
        return;
      }
    } catch (e) {
      console.log('   Файл не найден, будет создан новый');
    }
    
    // Добавляем новый ключ
    console.log('➕ Добавление ключа в authorized_keys...');
    const newAuthorizedKeys = authorizedKeys + (authorizedKeys && !authorizedKeys.endsWith('\n') ? '\n' : '') + publicKey + '\n';
    
    // Записываем обратно
    await sftp.put(Buffer.from(newAuthorizedKeys, 'utf8'), '~/.ssh/authorized_keys');
    
    // Устанавливаем правильные права доступа
    console.log('🔒 Установка прав доступа...');
    await sftp.chmod('~/.ssh', '700');
    await sftp.chmod('~/.ssh/authorized_keys', '600');
    
    await sftp.end();
    
    console.log('\n✅ SSH ключ успешно скопирован на сервер!');
    console.log('Теперь вы можете использовать npm run deploy для деплоя.\n');
    
  } catch (error) {
    console.error('\n❌ Ошибка при копировании ключа:', error.message);
    console.log('\n📝 Альтернативные способы копирования ключа:\n');
    console.log('Способ 1: Ручное копирование через SSH');
    console.log(`  1. Подключитесь к серверу: ssh -p ${port} ${username}@${host}`);
    console.log('  2. Выполните команды на сервере:');
    console.log('     mkdir -p ~/.ssh');
    console.log('     chmod 700 ~/.ssh');
    console.log('     nano ~/.ssh/authorized_keys');
    console.log('  3. Вставьте ваш публичный ключ (показан выше)');
    console.log('  4. Сохраните файл (Ctrl+X, затем Y, затем Enter)');
    console.log('  5. Выполните: chmod 600 ~/.ssh/authorized_keys\n');
    
    console.log('Способ 2: Использование пароля в deploy.config.js');
    console.log('  Добавьте строку: password: "ваш-пароль"');
    console.log('  Затем запустите этот скрипт снова\n');
    
    if (sftp) {
      await sftp.end();
    }
    process.exit(1);
  }
}

copyKeyViaSFTP();

