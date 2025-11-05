// Утилита для работы с WordPress через SSH
// Использование: node scripts/wp-edit.js <команда> [аргументы]

const WordPressSSH = require('./wp-ssh.js');
const fs = require('fs');
const path = require('path');

const command = process.argv[2];
const args = process.argv.slice(3);

const wp = new WordPressSSH();

async function main() {
  try {
    switch (command) {
      case 'read':
        if (!args[0]) {
          console.error('❌ Укажите путь к файлу');
          console.log('Использование: node scripts/wp-edit.js read <путь_к_файлу>');
          process.exit(1);
        }
        await readFile(args[0]);
        break;

      case 'write':
        if (!args[0] || !args[1]) {
          console.error('❌ Укажите путь к файлу и локальный файл для записи');
          console.log('Использование: node scripts/wp-edit.js write <удаленный_путь> <локальный_файл>');
          process.exit(1);
        }
        await writeFile(args[0], args[1]);
        break;

      case 'list':
        const listPath = args[0] || wp.getThemePath();
        await listFiles(listPath);
        break;

      case 'exec':
        if (!args[0]) {
          console.error('❌ Укажите команду для выполнения');
          console.log('Использование: node scripts/wp-edit.js exec <команда>');
          process.exit(1);
        }
        await executeCommand(args.join(' '));
        break;

      case 'pull':
        if (!args[0] || !args[1]) {
          console.error('❌ Укажите удаленный и локальный пути');
          console.log('Использование: node scripts/wp-edit.js pull <удаленный_путь> <локальный_путь>');
          process.exit(1);
        }
        await pullFile(args[0], args[1]);
        break;

      case 'push':
        if (!args[0] || !args[1]) {
          console.error('❌ Укажите локальный и удаленный пути');
          console.log('Использование: node scripts/wp-edit.js push <локальный_путь> <удаленный_путь>');
          process.exit(1);
        }
        await pushFile(args[0], args[1]);
        break;

      default:
        console.log('📋 Доступные команды:');
        console.log('');
        console.log('  read <путь>              - Прочитать файл с сервера');
        console.log('  write <путь> <локальный>  - Записать локальный файл на сервер');
        console.log('  list [путь]               - Список файлов в директории');
        console.log('  exec <команда>            - Выполнить команду на сервере');
        console.log('  pull <удаленный> <локальный> - Скачать файл с сервера');
        console.log('  push <локальный> <удаленный> - Загрузить файл на сервер');
        console.log('');
        console.log('Примеры:');
        console.log('  node scripts/wp-edit.js read functions.php');
        console.log('  node scripts/wp-edit.js write header.php src/pug/common/header.pug');
        console.log('  node scripts/wp-edit.js list');
        console.log('  node scripts/wp-edit.js exec "ls -la"');
        break;
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  } finally {
    await wp.disconnect();
  }
}

async function readFile(filePath) {
  const remotePath = wp.getThemeFilePath(filePath);
  console.log(`📖 Чтение файла: ${remotePath}`);
  const content = await wp.readFile(remotePath);
  console.log('\n' + '='.repeat(50));
  console.log(content);
  console.log('='.repeat(50));
}

async function writeFile(remotePath, localPath) {
  const fullRemotePath = wp.getThemeFilePath(remotePath);
  console.log(`📝 Запись файла: ${localPath} → ${fullRemotePath}`);
  
  if (!fs.existsSync(localPath)) {
    throw new Error(`Локальный файл не найден: ${localPath}`);
  }

  const content = fs.readFileSync(localPath, 'utf8');
  await wp.writeFile(fullRemotePath, content);
}

async function listFiles(dirPath) {
  console.log(`📁 Содержимое: ${dirPath}`);
  const files = await wp.list(dirPath);
  console.log('\n' + files.map(f => 
    `${f.type === 'd' ? '📁' : '📄'} ${f.name} (${f.size} bytes)`
  ).join('\n'));
}

async function executeCommand(cmd) {
  console.log(`⚙️  Выполнение: ${cmd}`);
  const result = await wp.exec(cmd);
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  console.log(`Код завершения: ${result.code}`);
}

async function pullFile(remotePath, localPath) {
  const fullRemotePath = wp.getThemeFilePath(remotePath);
  console.log(`⬇️  Скачивание: ${fullRemotePath} → ${localPath}`);
  
  const content = await wp.readFile(fullRemotePath);
  
  // Создаём директорию если её нет
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(localPath, content, 'utf8');
  console.log(`✅ Файл сохранён: ${localPath}`);
}

async function pushFile(localPath, remotePath) {
  const fullRemotePath = wp.getThemeFilePath(remotePath);
  console.log(`⬆️  Загрузка: ${localPath} → ${fullRemotePath}`);
  
  if (!fs.existsSync(localPath)) {
    throw new Error(`Локальный файл не найден: ${localPath}`);
  }

  const content = fs.readFileSync(localPath, 'utf8');
  await wp.writeFile(fullRemotePath, content);
}

main();

