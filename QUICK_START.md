# ⚡ Быстрый старт

## 🎯 Минимальные требования

- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL 12+**

## 🚀 Запуск за 3 шага

### 1. Установка компонентов
```bash
# Python: https://python.org
# Node.js: https://nodejs.org
# PostgreSQL: https://postgresql.org
```

### 2. Запуск приложения
```bash
# Windows
start-local.bat

# Linux/Mac
chmod +x start-local.sh
./start-local.sh
```

### 3. Открыть в браузере
```
http://localhost:3000
```

## 📋 Что происходит автоматически

✅ Проверка компонентов  
✅ Создание виртуального окружения Python  
✅ Установка зависимостей  
✅ Настройка базы данных PostgreSQL  
✅ Запуск Backend (порт 8000)  
✅ Запуск Frontend (порт 3000)  

## 🔧 Если что-то пошло не так

### Проверить статус
```bash
# Windows
check-status.bat

# Linux/Mac
./check-status.sh
```

### Остановить приложение
```bash
# Windows
stop-local.bat

# Linux/Mac
./stop-local.sh
```

### Подробные инструкции
- `README_LOCAL_SETUP.md` - полная настройка
- `PREREQUISITES_SETUP.md` - установка компонентов
- `POSTGRESQL_SETUP.md` - настройка базы данных

## 🌐 Доступ к приложению

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API документация:** http://localhost:8000/docs

## 🆘 Быстрая помощь

1. **Проверьте статус:** `check-status.bat` / `./check-status.sh`
2. **Остановите и запустите заново:** `stop-local.bat` → `start-local.bat`
3. **Проверьте логи** в окнах командной строки
4. **Убедитесь, что PostgreSQL запущен**

## 📱 Тестирование

После запуска:
1. Откройте http://localhost:3000
2. Создайте тестового пользователя
3. Войдите в систему
4. Проверьте основные функции

---

**Время запуска:** ~2-5 минут  
**Сложность:** Низкая  
**Автоматизация:** 95%  

🚀 **Готово к работе!**
