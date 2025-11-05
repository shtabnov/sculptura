// Скрипт для проверки структуры WordPress после переустановки
const ssh2 = require("ssh2-sftp-client");
const deployConfig = require("../deploy.config.js");
const fs = require("fs");
const path = require("path");
const os = require("os");

const sftp = new ssh2();

// Функция для получения SSH ключа
function getPrivateKey() {
    // Если указан явно в конфиге
    if (deployConfig.ssh.privateKey) {
        return deployConfig.ssh.privateKey;
    }

    // Пробуем использовать стандартный ключ из ~/.ssh/id_rsa
    const defaultKeyPath = path.join(os.homedir(), ".ssh", "id_rsa");
    if (fs.existsSync(defaultKeyPath)) {
        try {
            return fs.readFileSync(defaultKeyPath);
        } catch (e) {
            console.warn("⚠️ Не удалось прочитать стандартный SSH ключ");
        }
    }

    return undefined;
}

(async () => {
    try {
        // Подготавливаем параметры подключения
        const connectOptions = {
            host: deployConfig.ssh.host,
            port: deployConfig.ssh.port || 22,
            username: deployConfig.ssh.username,
            readyTimeout: 20000,
        };

        // Добавляем метод аутентификации
        if (deployConfig.ssh.password) {
            connectOptions.password = deployConfig.ssh.password;
        } else {
            const privateKey = getPrivateKey();
            if (privateKey) {
                connectOptions.privateKey = privateKey;
                if (deployConfig.ssh.passphrase) {
                    connectOptions.passphrase = deployConfig.ssh.passphrase;
                }
            } else {
                throw new Error(
                    "Не указан метод аутентификации. Укажите password или privateKey в deploy.config.js"
                );
            }
        }

        await sftp.connect(connectOptions);

        console.log("✅ Подключено к серверу\n");

        // Проверяем структуру domains
        // Получаем домашнюю директорию пользователя динамически
        let homeDir;
        try {
            homeDir = await sftp.realPath("~");
        } catch (e) {
            // Если не удалось получить через realPath, используем стандартный путь
            homeDir = deployConfig.ssh.username
                ? `/home/${deployConfig.ssh.username}`
                : "/home/user";
        }
        const domainsPath = `${homeDir}/domains`;

        // Проверяем существование директории domains
        const domainsExists = await sftp.exists(domainsPath);
        if (!domainsExists) {
            console.log(`⚠️ Директория ${domainsPath} не найдена`);
            console.log(`💡 Проверьте путь к доменам в конфигурации`);
            await sftp.end();
            process.exit(0);
        }

        const domains = await sftp.list(domainsPath);

        console.log("📁 Домены:");
        domains.forEach((item) => {
            if (item.type === "d") {
                console.log(`   📁 ${item.name}`);
            }
        });

        // Ищем WordPress в каждом домене
        for (const item of domains) {
            if (item.type === "d") {
                const domainPath = `${domainsPath}/${item.name}`;
                console.log(`\n🔍 Проверка ${domainPath}...`);

                // Проверяем возможные пути
                const possibleWpPaths = [
                    `${domainPath}/public_html/wp-content`,
                    `${domainPath}/www/wp-content`,
                    `${domainPath}/httpdocs/wp-content`,
                    `${domainPath}/wp-content`,
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
                                const themeDirs = themes
                                    .filter((t) => t.type === "d")
                                    .map((t) => t.name);
                                console.log(
                                    `   📂 Темы: ${
                                        themeDirs.join(", ") || "нет"
                                    }`
                                );

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
        console.error("❌ Ошибка:", error.message);
        await sftp.end();
        process.exit(1);
    }
})();
