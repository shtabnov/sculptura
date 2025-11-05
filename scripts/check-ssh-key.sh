# Проверка и исправление настроек SSH ключа
# Выполните эти команды на сервере

echo "=== Проверка прав доступа ==="
ls -la ~/.ssh/
ls -la ~/.ssh/authorized_keys

echo ""
echo "=== Установка правильных прав ==="
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

echo ""
echo "=== Проверка содержимого authorized_keys ==="
cat ~/.ssh/authorized_keys

echo ""
echo "=== Проверка прав после установки ==="
ls -la ~/.ssh/
ls -la ~/.ssh/authorized_keys

echo ""
echo "=== Проверка владельца файлов ==="
whoami
stat ~/.ssh/authorized_keys

