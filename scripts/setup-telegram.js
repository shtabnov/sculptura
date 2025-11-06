// Скрипт для добавления настроек Telegram в wp-config.php
// Использование: node scripts/setup-telegram.js

const WordPressSSH = require('./wp-ssh.js');
const deployConfig = require('../deploy.config.js');
const fs = require('fs');
const path = require('path');

// Безопасное получение токена из переменной окружения или файла
function getTelegramToken() {
  // 1. Проверяем переменную окружения (самый безопасный способ)
  if (process.env.TELEGRAM_BOT_TOKEN) {
    return process.env.TELEGRAM_BOT_TOKEN;
  }
  
  // 2. Проверяем локальный файл конфигурации (не в git)
  const localConfigPath = path.join(__dirname, '..', '.telegram-config.js');
  if (fs.existsSync(localConfigPath)) {
    try {
      const localConfig = require(localConfigPath);
      if (localConfig.TELEGRAM_BOT_TOKEN) {
        return localConfig.TELEGRAM_BOT_TOKEN;
      }
    } catch (e) {
      console.warn('⚠️ Не удалось прочитать .telegram-config.js');
    }
  }
  
  throw new Error('TELEGRAM_BOT_TOKEN не найден. Установите переменную окружения TELEGRAM_BOT_TOKEN или создайте файл .telegram-config.js');
}

function getTelegramChatIds() {
  // 1. Проверяем переменную окружения
  if (process.env.TELEGRAM_CHAT_IDS) {
    return process.env.TELEGRAM_CHAT_IDS.split(',').map(id => id.trim());
  }
  
  // 2. Проверяем локальный файл конфигурации
  const localConfigPath = path.join(__dirname, '..', '.telegram-config.js');
  if (fs.existsSync(localConfigPath)) {
    try {
      const localConfig = require(localConfigPath);
      if (localConfig.TELEGRAM_CHAT_IDS) {
        return Array.isArray(localConfig.TELEGRAM_CHAT_IDS) 
          ? localConfig.TELEGRAM_CHAT_IDS 
          : [localConfig.TELEGRAM_CHAT_IDS];
      }
    } catch (e) {
      console.warn('⚠️ Не удалось прочитать .telegram-config.js');
    }
  }
  
  throw new Error('TELEGRAM_CHAT_IDS не найдены. Установите переменную окружения TELEGRAM_CHAT_IDS или создайте файл .telegram-config.js');
}

const TELEGRAM_BOT_TOKEN = getTelegramToken();
const TELEGRAM_CHAT_IDS = getTelegramChatIds();

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
      
      // Удаляем старые настройки Telegram (поддержка старого формата с одним чатом и нового с массивом)
      configContent = configContent.replace(
        /\/\/ Настройки Telegram для формы записи Sculptura[\s\S]*?(?:define\('TELEGRAM_CHAT_ID', '[^']+'\);\s*\n|define\('TELEGRAM_CHAT_IDS', \[[^\]]+\]\);\s*\n)/g,
        ''
      );
    }
    
    // Ищем строку "/* That's all, stop editing! */"
    const stopEditingMarker = '/* That\'s all, stop editing!';
    const stopEditingIndex = configContent.indexOf(stopEditingMarker);
    
    if (stopEditingIndex === -1) {
      // Если маркер не найден, добавляем в конец файла перед закрывающим тегом PHP (если есть)
      const phpCloseTag = configContent.indexOf('?>');
      const chatIdsString = TELEGRAM_CHAT_IDS.map(id => `'${id}'`).join(', ');
      if (phpCloseTag !== -1) {
        const telegramConfig = `\n// Настройки Telegram для формы записи Sculptura\ndefine('TELEGRAM_BOT_TOKEN', '${TELEGRAM_BOT_TOKEN}');\ndefine('TELEGRAM_CHAT_IDS', [${chatIdsString}]);\n\n`;
        configContent = configContent.slice(0, phpCloseTag) + telegramConfig + configContent.slice(phpCloseTag);
      } else {
        // Добавляем в конец файла
        configContent += `\n// Настройки Telegram для формы записи Sculptura\ndefine('TELEGRAM_BOT_TOKEN', '${TELEGRAM_BOT_TOKEN}');\ndefine('TELEGRAM_CHAT_IDS', [${chatIdsString}]);\n`;
      }
    } else {
      // Добавляем перед маркером
      const chatIdsString = TELEGRAM_CHAT_IDS.map(id => `'${id}'`).join(', ');
      const telegramConfig = `// Настройки Telegram для формы записи Sculptura\ndefine('TELEGRAM_BOT_TOKEN', '${TELEGRAM_BOT_TOKEN}');\ndefine('TELEGRAM_CHAT_IDS', [${chatIdsString}]);\n\n`;
      configContent = configContent.slice(0, stopEditingIndex) + telegramConfig + configContent.slice(stopEditingIndex);
    }
    
    // Записываем файл обратно
    console.log('💾 Запись обновленного wp-config.php...');
    await wp.writeFile(wpConfigPath, configContent);
    
    console.log('\n✅ Настройки Telegram успешно добавлены в wp-config.php!');
    console.log(`   Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 20)}...`);
    console.log(`   Chat IDs: ${TELEGRAM_CHAT_IDS.join(', ')}`);
    console.log(`   Количество чатов: ${TELEGRAM_CHAT_IDS.length}`);
    console.log('\n📝 Теперь форма записи будет отправлять уведомления во все указанные Telegram чаты.');
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  } finally {
    await wp.disconnect();
  }
}

setupTelegram();

