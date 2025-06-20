@echo off
echo Компиляция TypeScript...
call npm run build

if %errorlevel% neq 0 (
    echo Ошибка компиляции, проверьте ошибки выше
    pause
    exit /b 1
)

echo Запуск бота...
node dist\main.js