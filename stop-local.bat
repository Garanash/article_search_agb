@echo off
echo ========================================
echo Остановка локального приложения
echo ========================================
echo.

echo Остановка процессов на портах 8000 и 3000...

REM Находим и останавливаем процессы на порту 8000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    echo Остановка процесса Backend (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

REM Находим и останавливаем процессы на порту 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Остановка процесса Frontend (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo ✓ Приложение остановлено
echo.
echo Если процессы все еще запущены, закройте окна командной строки вручную
echo.
pause
