# Synastry

Synastry — небольшое React-приложение для HR-анализа совместимости кандидата и вакансии. Пользователь заполняет данные кандидата и описание роли, а сервер строит базовую натальную карту и просит GigaChat подготовить аккуратный отчёт для HR.

Ключи GigaChat живут только в backend-части. Если ключей нет, API использует локальный демо-анализ, чтобы проект всё равно можно было запустить и проверить.

## Как запустить

Установите зависимости из корня проекта:

```sh
npm install
```

Скопируйте примеры окружения:

```sh
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

В `apps/api/.env` можно добавить `GIGACHAT_CREDENTIALS`, `GIGACHAT_SCOPE` и `GIGACHAT_MODEL`. Во frontend кладите только публичный `VITE_API_URL`.

Запустите API и веб-приложение в двух терминалах:

```sh
npm run dev:api
npm run dev:web
```

Frontend откроется на `http://localhost:5173`, API — на `http://localhost:3001`.
