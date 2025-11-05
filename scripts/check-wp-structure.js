// Скрипт для проверки структуры WordPress после переустановки
const ssh2 = require('ssh2-sftp-client');
const deployConfig = require('../deploy.config.js');

const sftp = new ssh2();

(async () => {
  try {
    await sftp.connect({
      host: deployConfig.ssh.host,
      port: deployConfig.ssh.port || 22,
      username: deployConfig.ssh.username,
      password: deployConfig.ssh.password || 'dufuefubux'
    });
    
    console.log('✅ Подключено к серверу\n');
    
    // Проверяем структуру domains
    const domainsPath = '/home/a1140618/domains';
    const domains = await sftp.list(domainsPath);
    
    console.log('📁 Домены:');
    domains.forEach(item => {
      if (item.type === 'd') {
        console.log(`   📁 ${item.name}`);
      }
    });
    
    // Ищем WordPress в каждом домене
    for (const item of domains) {
      if (item.type === 'd') {
        const domainPath = `${domainsPath}/${item.name}`;
        console.log(`\n🔍 Проверка ${domainPath}...`);
        
        // Проверяем возможные пути
        const possibleWpPaths = [
          `${domainPath}/public_html/wp-content`,
          `${domainPath}/www/wp-content`,
          `${domainPath}/httpdocs/wp-content`,
          `${domainPath}/wp-content`
        ];
        
        for (const wpPath of possibleWpPaths) {
          try {
            const exists = await sftp.exists(wpPath);
            if (exists) {
              console.log(`   ✅ WordPress найден: ${wpPath}`);
              
              const themesPath = `${wpPath}/themes`;
              const themesExists = await sftp.exists(themesPath);
              
              if (themesExists) {
                const themes = await sftp.list(themesPath);
                const themeDirs = themes.filter(t => t.type === 'd').map(t => t.name);
                console.log(`   📂 Темы: ${themeDirs.join(', ') || 'нет'}`);
                
                const fullThemePath = `${themesPath}/sculptura/`;
                console.log(`\n💡 Путь для deploy.config.js:`);
                console.log(`   themePath: "${fullThemePath}"`);
                break;
              }
            }
          } catch (e) {
            // Игнорируем ошибки
          }
        }
      }
    }
    
    await sftp.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    await sftp.end();
    process.exit(1);
  }
})();

