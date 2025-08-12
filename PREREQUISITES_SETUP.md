# 🛠️ Установка необходимых компонентов

## 🐍 Python 3.8+

### Windows
1. Скачайте Python с [python.org](https://python.org)
2. **Важно:** Отметьте "Add Python to PATH" при установке
3. Проверьте установку: `python --version`

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

### macOS
```bash
# Через Homebrew
brew install python3

# Или скачайте с python.org
```

## 🟢 Node.js 16+

### Windows
1. Скачайте Node.js с [nodejs.org](https://nodejs.org)
2. Выберите LTS версию (рекомендуется)
3. Проверьте установку: `node --version` и `npm --version`

### Linux (Ubuntu/Debian)
```bash
# Через NodeSource репозиторий
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### macOS
```bash
# Через Homebrew
brew install node

# Или скачайте с nodejs.org
```

## 🔍 Проверка установки

После установки всех компонентов выполните:

```bash
# Проверка Python
python --version
# или
python3 --version

# Проверка Node.js
node --version
npm --version

# Проверка PostgreSQL
psql --version
```

## 🚀 Быстрый запуск

После установки всех компонентов:

1. **Установите PostgreSQL** (см. `POSTGRESQL_SETUP.md`)
2. **Запустите приложение:**
   ```bash
   # Windows
   start-local.bat
   
   # Linux/macOS
   ./start-local.sh
   ```

## 🔧 Устранение неполадок

### Python не найден в PATH
- Перезапустите командную строку после установки
- Проверьте, что Python добавлен в PATH
- Попробуйте использовать `python3` вместо `python`

### Node.js не найден
- Перезапустите командную строку после установки
- Проверьте, что Node.js добавлен в PATH

### Ошибки pip
```bash
# Обновить pip
python -m pip install --upgrade pip

# Или
python3 -m pip install --upgrade pip
```

### Ошибки npm
```bash
# Очистить кэш
npm cache clean --force

# Переустановить глобальные пакеты
npm install -g npm@latest
```

## 📋 Минимальные версии

- **Python:** 3.8+
- **Node.js:** 16+
- **PostgreSQL:** 12+
- **npm:** 8+

## 🎯 Следующий шаг

После установки всех компонентов переходите к:
1. `POSTGRESQL_SETUP.md` - настройка базы данных
2. `README_LOCAL_SETUP.md` - подробные инструкции по запуску
