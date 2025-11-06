// Временный скрипт для проверки SSH подключения по ключу
const ssh2 = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const deployConfig = require('../deploy.config.js');

const sftp = new ssh2();

async function testConnectionWithKey() {
  try {
    console.log('🔍 Проверка SSH подключения по ключу...\n');
    console.log(`📋 Параметры подключения:`);
    console.log(`   Host: ${deployConfig.ssh.host}`);
    console.log(`   Port: ${deployConfig.ssh.port || 22}`);
    console.log(`   Username: ${deployConfig.ssh.username}\n`);
    
    // Проверяем наличие ключа
    const keyPath = path.join(__dirname, '..', '.ssh', 'id_rsa');
    if (!fs.existsSync(keyPath)) {
      throw new Error(`SSH ключ не найден: ${keyPath}`);
    }
    
    console.log(`🔑 Найден SSH ключ: .ssh/id_rsa\n`);
    
    // Подготавливаем параметры подключения с ключом
    const connectOptions = {
      host: deployConfig.ssh.host,
      port: deployConfig.ssh.port || 22,
      username: deployConfig.ssh.username,
      privateKey: fs.readFileSync(keyPath),
      readyTimeout: 20000
    };
    
    // Подключаемся к серверу
    console.log(`🔌 Подключение к ${deployConfig.ssh.host}...`);
    await sftp.connect(connectOptions);
    console.log('✅ Подключение установлено по SSH ключу!\n');
    
    // Проверяем домашнюю директорию
    console.log('📁 Проверка домашней директории...');
    const homePath = await sftp.realPath('~');
    console.log(`✅ Домашняя директория: ${homePath}\n`);
    
    // Проверяем путь к теме
    console.log('📁 Проверка пути к теме WordPress...');
    const themePath = deployConfig.remote.themePath;
    const exists = await sftp.exists(themePath);
    
    if (exists) {
      const stat = await sftp.stat(themePath);
      console.log(`✅ Путь существует: ${themePath}`);
      console.log(`   Тип: ${stat.isDirectory ? 'Директория' : 'Файл'}`);
      console.log(`   Права: ${stat.mode}\n`);
    } else {
      console.log(`⚠️ Путь не существует: ${themePath}\n`);
    }
    
    await sftp.end();
    console.log('✅ Проверка завершена успешно!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Ошибка подключения:', error.message);
    
    if (error.message.includes('All configured authentication methods failed')) {
      console.log('\n💡 Возможные причины:');
      console.log('   1. SSH ключ не добавлен на сервер');
      console.log('   2. Неправильный формат ключа');
      console.log('   3. Ключ не соответствует серверу');
      console.log('\n🔧 Решения:');
      console.log('   1. Скопируйте публичный ключ на сервер:');
      console.log('      node scripts/copy-ssh-key-sftp.js');
      console.log('   2. Или используйте пароль для подключения');
    }
    
    if (sftp) {
      await sftp.end();
    }
    
    process.exit(1);
  }
}

testConnectionWithKey();

