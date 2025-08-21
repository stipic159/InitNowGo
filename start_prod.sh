#!/bin/bash

echo "Компиляция TypeScript..."
yarn run build

# shellcheck disable=SC2181
if [ $? -ne 0 ]; then
    echo "Ошибка компиляции, проверьте ошибки выше"
    exit 1
fi

echo "Запуск бота..."
node dist/core/app.js