# Synastry

Synastry — небольшое React-приложение для HR-анализа совместимости кандидата и вакансии. Пользователь заполняет данные кандидата и описание роли, а сервер строит базовую натальную карту и просит GigaChat подготовить аккуратный отчёт для HR.

Ключи GigaChat живут только в backend-части. Если ключи не настроены или GigaChat недоступен, API возвращает понятную ошибку вместо демо-отчёта.

## Стек технологий

| Слой | Технологии |
|------|------------|
| **Репозиторий** | npm **workspaces**, **TypeScript** |
| **Frontend** (`apps/frontend`) | **React** 19, **Vite**, **Tailwind CSS** 4, **React Router**, **Redux Toolkit** (в т.ч. RTK Query), **React Hook Form**, **Zod** |
| **Backend** (`apps/backend`) | **Node.js** 20+, **Fastify**, **Zod**, натальная карта (**astronomy-engine**), провайдер ИИ **GigaChat** (SDK gigachat), **@fastify/cors** / **helmet** / **rate-limit** |
| **Контракты** (`packages/contracts`) | **Zod**-схемы и типы API, общие для frontend и backend |
| **Качество** | **Vitest**, **Testing Library** (frontend), **ESLint** |

Описание репозитория на GitHub можно кратко оформить так: *React + Vite + RTK Query · Fastify · Zod · GigaChat · natal chart (astronomy-engine)*.

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

В `apps/backend/.env` можно добавить `GIGACHAT_CREDENTIALS`, `GIGACHAT_SCOPE` и `GIGACHAT_MODEL`. Во frontend в dev `VITE_API_URL` можно не задавать — Vite проксирует `/api` на порт из `apps/backend/.env` (`PORT`). Если задаёте `VITE_API_URL` вручную, он должен совпадать с портом backend.

Запустите backend и frontend в двух терминалах:

```sh
npm run dev:backend
npm run dev:frontend
```

Frontend откроется на `http://localhost:5173`, backend — на `http://localhost:3001`.
