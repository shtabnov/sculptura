/**
 * ПРИМЕР конфигурации для SSH деплоя WordPress темы
 * 
 * Скопируйте этот файл как deploy.config.js и заполните своими данными
 * deploy.config.js уже добавлен в .gitignore и не будет закоммичен
 */

module.exports = {
  // SSH подключение
  ssh: {
    host: 'your-server.com',        // IP адрес или домен сервера
    port: 22,                        // Порт SSH (обычно 22)
    username: 'your-username',       // Имя пользователя для SSH
    
    // Вариант 1: Использование пароля (не рекомендуется)
    // password: 'your-password',
    
    // Вариант 2: Использование SSH ключа (рекомендуется)
    // privateKey: require('fs').readFileSync(require('path').join(__dirname, '.ssh/id_rsa')),
    // passphrase: 'your-passphrase-if-needed', // Если ключ защищён паролем
    
    // Вариант 3: Использование стандартного SSH ключа из ~/.ssh/id_rsa
    // Оставьте privateKey пустым, если используете стандартный ключ
  },
  
  // Пути на сервере
  remote: {
    // Путь к директории темы WordPress на сервере
    themePath: '/var/www/html/wp-content/themes/sculptura/',
    // Или относительный путь от домашней директории пользователя:
    // themePath: '~/public_html/wp-content/themes/sculptura/',
  },
  
  // Локальные пути
  local: {
    // Путь к папке темы (относительно корня проекта)
    themeSource: './wp-theme/',
    // Путь к собранным ассетам
    assetsPath: './build/',
  },
  
  // Настройки деплоя
  deploy: {
    // Что именно деплоить
    // 'theme' - только тему WordPress
    // 'assets' - только ассеты (CSS/JS/изображения)
    // 'all' - всё вместе
    mode: 'all'
  }
};

