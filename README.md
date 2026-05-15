# Synastry

Synastry — небольшое React-приложение для HR-анализа совместимости кандидата и вакансии. Пользователь заполняет данные кандидата и описание роли, а сервер строит базовую натальную карту и просит GigaChat подготовить аккуратный отчёт для HR.

Ключи GigaChat живут только в backend-части. Если ключей нет, API использует локальный демо-анализ, чтобы проект всё равно можно было запустить и проверить.

## Структура

- `apps/frontend` — интерфейс в браузере (React)
- `apps/backend` — сервер и интеграция с GigaChat (Node.js)
- `packages/contracts` — общие типы и схемы запросов/ответов

## Как запустить

Установите зависимости из корня проекта:

```sh
npm install
```

Скопируйте примеры окружения:

```sh
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

В `apps/backend/.env` можно добавить `GIGACHAT_CREDENTIALS`, `GIGACHAT_SCOPE` и `GIGACHAT_MODEL`. Во frontend кладите только публичный `VITE_API_URL`.

Запустите backend и frontend в двух терминалах:

```sh
npm run dev:backend
npm run dev:frontend
```

Frontend откроется на `http://localhost:5173`, backend — на `http://localhost:3001`.
