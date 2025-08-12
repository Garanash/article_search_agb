@echo off
echo ========================================
echo Проверка статуса приложения
echo ========================================
echo.

echo Проверка портов...

REM Проверяем порт 8000 (Backend)
netstat -an | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo ✓ Backend запущен на порту 8000
) else (
    echo ✗ Backend не запущен на порту 8000
)

REM Проверяем порт 3000 (Frontend)
netstat -an | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo ✓ Frontend запущен на порту 3000
) else (
    echo ✗ Frontend не запущен на порту 3000
)

echo.
echo Проверка процессов...

REM Проверяем процессы Python
tasklist /FI "IMAGENAME eq python.exe" 2>nul | findstr python.exe >nul
if %errorlevel% equ 0 (
    echo ✓ Python процессы найдены
) else (
    echo ✗ Python процессы не найдены
)

REM Проверяем процессы Node.js
tasklist /FI "IMAGENAME eq node.exe" 2>nul | findstr node.exe >nul
if %errorlevel% equ 0 (
    echo ✓ Node.js процессы найдены
) else (
    echo ✗ Node.js процессы не найдены
)

echo.
echo Проверка подключения к базе данных...
psql -h localhost -U postgres -d article_search_agb -c "SELECT version();" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Подключение к PostgreSQL успешно
) else (
    echo ✗ Ошибка подключения к PostgreSQL
)

echo.
echo ========================================
echo Результаты проверки
echo ========================================
echo.
echo Для запуска используйте: start-local.bat
echo Для остановки используйте: stop-local.bat
echo.
pause
