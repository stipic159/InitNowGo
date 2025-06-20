#!/bin/bash

echo "Компиляция TypeScript..."
tsc

if [ $? -ne 0 ]; then
    echo "Ошибка компиляции, проверьте ошибки выше"
    exit 1
fi

echo "Запуск бота..."
node dist/main.js
