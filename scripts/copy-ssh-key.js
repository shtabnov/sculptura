// Скрипт для копирования SSH ключа на сервер
// Использование: node scripts/copy-ssh-key.js

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Загружаем конфигурацию
let deployConfig;

try {
    deployConfig = require("../deploy.config.js");
} catch (e) {
    console.error("❌ Ошибка: Не найден файл deploy.config.js");
    process.exit(1);
}

const publicKeyPath = path.join(__dirname, "..", ".ssh", "id_rsa.pub");

if (!fs.existsSync(publicKeyPath)) {
    console.error("❌ Публичный ключ не найден: .ssh/id_rsa.pub");
    console.error("Сначала создайте SSH ключ");
    process.exit(1);
}

const publicKey = fs.readFileSync(publicKeyPath, "utf8").trim();
const host = deployConfig.ssh.host;
const username = deployConfig.ssh.username;
const port = deployConfig.ssh.port || 22;

console.log("📋 Информация для копирования SSH ключа:\n");
console.log(`Сервер: ${username}@${host}:${port}`);
console.log(`\nВаш публичный ключ:\n${publicKey}\n`);

console.log("🔧 Автоматическое копирование ключа...\n");

try {
    // Используем ssh-copy-id если доступен, иначе используем ssh
    let command;

    // Проверяем наличие ssh-copy-id (Windows может не иметь)
    try {
        execSync("ssh-copy-id --version", { stdio: "ignore" });
        command = `ssh-copy-id -p ${port} ${username}@${host}`;
    } catch (e) {
        // Альтернативный способ через ssh
        console.log(
            "⚠️ ssh-copy-id не найден, используем альтернативный метод...\n"
        );
        const sshCommand = `ssh -p ${port} ${username}@${host} "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '${publicKey}' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"`;
        command = sshCommand;
    }

    console.log(`Выполняется: ${command}\n`);
    execSync(command, { stdio: "inherit" });

    console.log("\n✅ SSH ключ успешно скопирован на сервер!");
    console.log("Теперь вы можете использовать npm run deploy для деплоя.\n");
} catch (error) {
    console.error("\n❌ Ошибка при копировании ключа:", error.message);
    console.log("\n📝 Ручное копирование ключа:");
    console.log("1. Скопируйте публичный ключ выше");
    console.log(
        `2. Подключитесь к серверу: ssh -p ${port} ${username}@${host}`
    );
    console.log("3. Выполните команды:");
    console.log("   mkdir -p ~/.ssh");
    console.log("   chmod 700 ~/.ssh");
    console.log('   echo "ВАШ_ПУБЛИЧНЫЙ_КЛЮЧ" >> ~/.ssh/authorized_keys');
    console.log("   chmod 600 ~/.ssh/authorized_keys");
    process.exit(1);
}
