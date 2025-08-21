@echo off
echo Компиляция TypeScript...
call yarn run build

if %errorlevel% neq 0 (
    echo Ошибка компиляции, проверьте ошибки выше
    pause
    exit /b 1
)

echo Запуск бота...
node dist/core/app.js