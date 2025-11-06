// Скрипт для добавления настроек Telegram в wp-config.php
// Использование: node scripts/setup-telegram.js

const WordPressSSH = require('./wp-ssh.js');
const deployConfig = require('../deploy.config.js');

const TELEGRAM_BOT_TOKEN = '1850261952:AAHSxGUD20ZJ34d9woe49ZJvpSIp-9QQyKA';
const TELEGRAM_CHAT_ID = '242846482';

const wp = new WordPressSSH();

async function setupTelegram() {
  try {
    console.log('🔧 Настройка Telegram в wp-config.php...\n');
    
    await wp.connect();
    
    // Определяем путь к wp-config.php
    // Обычно он находится на один уровень выше wp-content/themes/sculptura
    const themePath = deployConfig.remote.themePath;
    const wpRootPath = themePath.replace(/\/wp-content\/themes\/sculptura\/?$/, '');
    const wpConfigPath = `${wpRootPath}/wp-config.php`;
    
    console.log(`📁 Путь к WordPress: ${wpRootPath}`);
    console.log(`📄 Путь к wp-config.php: ${wpConfigPath}\n`);
    
    // Проверяем существование файла
    const configExists = await wp.exists(wpConfigPath);
    if (!configExists) {
      throw new Error(`Файл wp-config.php не найден по пути: ${wpConfigPath}`);
    }
    
    // Читаем файл
    console.log('📖 Чтение wp-config.php...');
    let configContent = await wp.readFile(wpConfigPath);
    
    // Проверяем, есть ли уже настройки Telegram
    if (configContent.includes('TELEGRAM_BOT_TOKEN')) {
      console.log('⚠️  Настройки Telegram уже присутствуют в wp-config.php');
      console.log('   Обновляю существующие настройки...\n');
      
      // Удаляем старые настройки Telegram
      configContent = configContent.replace(
        /\/\/ Настройки Telegram для формы записи Sculptura[\s\S]*?define\('TELEGRAM_CHAT_ID', '[^']+'\);\s*\n/g,
        ''
      );
    }
    
    // Ищем строку "/* That's all, stop editing! */"
    const stopEditingMarker = '/* That\'s all, stop editing!';
    const stopEditingIndex = configContent.indexOf(stopEditingMarker);
    
    if (stopEditingIndex === -1) {
      // Если маркер не найден, добавляем в конец файла перед закрывающим тегом PHP (если есть)
      const phpCloseTag = configContent.indexOf('?>');
      if (phpCloseTag !== -1) {
        const telegramConfig = `\n// Настройки Telegram для формы записи Sculptura\ndefine('TELEGRAM_BOT_TOKEN', '${TELEGRAM_BOT_TOKEN}');\ndefine('TELEGRAM_CHAT_ID', '${TELEGRAM_CHAT_ID}');\n\n`;
        configContent = configContent.slice(0, phpCloseTag) + telegramConfig + configContent.slice(phpCloseTag);
      } else {
        // Добавляем в конец файла
        configContent += `\n// Настройки Telegram для формы записи Sculptura\ndefine('TELEGRAM_BOT_TOKEN', '${TELEGRAM_BOT_TOKEN}');\ndefine('TELEGRAM_CHAT_ID', '${TELEGRAM_CHAT_ID}');\n`;
      }
    } else {
      // Добавляем перед маркером
      const telegramConfig = `// Настройки Telegram для формы записи Sculptura\ndefine('TELEGRAM_BOT_TOKEN', '${TELEGRAM_BOT_TOKEN}');\ndefine('TELEGRAM_CHAT_ID', '${TELEGRAM_CHAT_ID}');\n\n`;
      configContent = configContent.slice(0, stopEditingIndex) + telegramConfig + configContent.slice(stopEditingIndex);
    }
    
    // Записываем файл обратно
    console.log('💾 Запись обновленного wp-config.php...');
    await wp.writeFile(wpConfigPath, configContent);
    
    console.log('\n✅ Настройки Telegram успешно добавлены в wp-config.php!');
    console.log(`   Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 20)}...`);
    console.log(`   Chat ID: ${TELEGRAM_CHAT_ID}`);
    console.log('\n📝 Теперь форма записи будет отправлять уведомления в Telegram.');
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  } finally {
    await wp.disconnect();
  }
}

setupTelegram();

