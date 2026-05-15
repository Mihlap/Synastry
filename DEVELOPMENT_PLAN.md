# Synastry — подробный план разработки

> Версия документа: 1.0  
> Дата: 15.05.2026  
> Стек: React 19, TypeScript, Vite, RTK Query, Node.js BFF  
> ИИ по умолчанию: GigaChat (с возможностью смены провайдера)

---

## Содержание

1. [Описание продукта](#1-описание-продукта)
2. [Цели и границы MVP](#2-цели-и-границы-mvp)
3. [Архитектура системы](#3-архитектура-системы)
4. [Безопасность и защита ключей](#4-безопасность-и-защита-ключей) ⭐
5. [Технологический стек](#5-технологический-стек)
6. [Структура репозитория](#6-структура-репозитория)
7. [Модель данных и API](#7-модель-данных-и-api)
8. [Пользовательские сценарии и экраны](#8-пользовательские-сценарии-и-экраны)
9. [Натальная карта и ИИ-анализ](#9-натальная-карта-и-ии-анализ)
10. [Плагинная система ИИ-провайдеров](#10-плагинная-система-ии-провайдеров)
11. [Адаптивный UI/UX](#11-адаптивный-uiux)
12. [Деплой на GitHub и хостинг API](#12-деплой-на-github-и-хостинг-api)
13. [Фазы разработки и чеклисты](#13-фазы-разработки-и-чеклисты)
14. [Риски, compliance, disclaimer](#14-риски-compliance-disclaimer)
15. [Приложения](#15-приложения)

---

## 1. Описание продукта

**Synastry** — веб-приложение для оценки соответствия соискателя вакансии с использованием:

- **натальной карты** (астрологический расчёт по дате, времени и месту рождения);
- **анализа ИИ** (GigaChat и другие подключаемые модели);
- **контекста вакансии** (описание компании и должности).

### Входные данные

| Источник | Поля |
|----------|------|
| Кандидат (ручной ввод) | ФИО, дата рождения, время рождения (опционально), место рождения (город → координаты) |
| Кандидат (резюме) | PDF / DOCX / текст → извлечение данных; дата рождения обязательна (дозапрос, если не найдена) |
| Вакансия | Название должности, описание компании, описание вакансии (обязанности, требования, культура) |

### Выходные данные

- Краткое описание натальной карты (ключевые позиции, акценты).
- Вердикт совместимости: **рекомендован** / **условно** / **не рекомендован**.
- Аргументированный разбор: сильные стороны, риски, рекомендации для HR.
- Метаданные: модель ИИ, дата анализа, disclaimer.

---

## 2. Цели и границы MVP

### Цели MVP (фаза 1–2)

- [ ] Форма ввода кандидата и вакансии (ручной режим).
- [ ] Серверный расчёт натальной карты.
- [ ] Интеграция GigaChat через backend (BFF).
- [ ] Экран результата с вердиктом и аргументами.
- [ ] Адаптивная вёрстка (mobile / tablet / desktop).
- [ ] Деплой фронтенда на GitHub Pages, API — на отдельном хосте.
- [ ] **Ни один секрет не попадает в клиентский бандл и в git.**

### Вне MVP (последующие фазы)

- Загрузка и парсинг резюме.
- История анализов, экспорт PDF.
- Второй и третий ИИ-провайдеры в UI.
- Авторизация пользователей, личный кабинет.
- Оплата / лимиты запросов.

---

## 3. Архитектура системы

### 3.1. Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│  Браузер (React 19 SPA)                                     │
│  • Формы, wizard, отображение результата                    │
│  • RTK Query → только публичный VITE_API_URL                │
│  • НЕТ: API keys, client_secret, токенов GigaChat           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  BFF / API (Node.js) — единственное место с секретами       │
│  • /api/analyze, /api/health, /api/providers               │
│  • Natal Chart Engine                                       │
│  • AI Provider Adapter (GigaChat, …)                        │
│  • Rate limiting, CORS, валидация                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (server-to-server)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  GigaChat API (и другие провайдеры)                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2. Принципы

| Принцип | Реализация |
|---------|------------|
| **Zero secrets in frontend** | Все ключи только в env сервера |
| **BFF pattern** | Браузер не обращается к GigaChat напрямую |
| **Least privilege** | Минимальные scope ключей у провайдера |
| **Defense in depth** | CORS + rate limit + валидация + логи без секретов |

### 3.3. Монорепозиторий (рекомендуется)

```
synastry/
├── apps/web/          # React SPA
├── apps/api/          # Node BFF
├── packages/shared/   # Общие типы, Zod-схемы
└── docs/              # Доп. документация (опционально)
```

---

## 4. Безопасность и защита ключей

> **Это обязательный раздел.** Любое отклонение от этих правил — риск утечки ключей GigaChat и других провайдеров.

### 4.1. Золотое правило

**Секреты существуют только на сервере (BFF) и в защищённых хранилищах CI/CD. Никогда — в React-коде, в git, в логах, в URL, в issue/PR.**

### 4.2. Что считается секретом

| Переменная | Где хранить | Где ЗАПРЕЩЕНО |
|------------|-------------|----------------|
| `GIGACHAT_CLIENT_ID` | Server env, GitHub Secrets | Frontend, `.env` в git |
| `GIGACHAT_CLIENT_SECRET` | Server env, GitHub Secrets | Frontend, коммиты |
| `GIGACHAT_SCOPE` | Server env | — |
| Токены доступа GigaChat | Память сервера, кэш с TTL | localStorage, cookies клиента |
| `OPENAI_API_KEY` (будущее) | Server env | Frontend |
| Любой `*_API_KEY`, `*_SECRET` | Server env | Везде в клиенте |

### 4.3. Переменные окружения: разделение

#### Frontend (`apps/web`) — только публичные

```env
# .env.example (коммитится в git)
VITE_API_URL=https://api.example.com
VITE_APP_NAME=Synastry
```

Префикс `VITE_` означает: значение **попадёт в бандл** при сборке. Туда можно класть **только** то, что безопасно показать любому пользователю.

#### Backend (`apps/api`) — секреты

```env
# .env.example (коммитится — БЕЗ реальных значений)
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173

# GigaChat — только на сервере
GIGACHAT_CLIENT_ID=
GIGACHAT_CLIENT_SECRET=
GIGACHAT_SCOPE=GIGACHAT_API_PERS

# Опционально: выбор провайдера по умолчанию
AI_PROVIDER=gigachat
AI_DEFAULT_MODEL=GigaChat

# Rate limiting
RATE_LIMIT_MAX=30
RATE_LIMIT_WINDOW_MS=60000
```

Файл `.env` с реальными значениями:

- добавить в `.gitignore`;
- никогда не коммитить;
- не прикреплять к issue, Slack, скриншотам.

### 4.4. `.gitignore` (обязательные записи)

```gitignore
# Секреты и локальная конфигурация
.env
.env.local
.env.*.local
*.pem
*.key
secrets/

# Случайные дампы
.env.backup
.env.production.local
```

### 4.5. Защита на уровне кода

#### ❌ Запрещено

```typescript
// apps/web — НИКОГДА
const client = new GigaChat({ credentials: 'xxx' });
fetch('https://gigachat.devices.sberbank.ru/...', {
  headers: { Authorization: `Bearer ${import.meta.env.VITE_GIGACHAT_TOKEN}` }
});
```

```typescript
// Логирование — НИКОГДА не логировать
console.log(process.env.GIGACHAT_CLIENT_SECRET);
console.log('Token:', accessToken);
```

#### ✅ Правильно

```typescript
// apps/api/src/providers/gigachat.provider.ts
const client = new GigaChat({
  credentials: process.env.GIGACHAT_CLIENT_SECRET!, // только на сервере
});
// Токен кэшировать в памяти процесса, не отдавать клиенту
```

```typescript
// apps/web — только вызов своего API
analyzeApi.endpoints.analyze.initiate(payload);
// baseUrl: import.meta.env.VITE_API_URL
```

### 4.6. CI/CD и GitHub

| Действие | Как |
|----------|-----|
| Секреты для деплоя API | **GitHub → Settings → Secrets and variables → Actions** |
| Секреты для Vercel/Railway | Dashboard хостинга → Environment Variables |
| Сборка фронта в Actions | Передавать только `VITE_API_URL`, не GigaChat ключи |
| PR из форков | Не давать секреты workflow из fork (стандартная защита GitHub) |

**Workflow пример (фронт):**

```yaml
env:
  VITE_API_URL: ${{ vars.VITE_API_URL }}  # Repository Variable (публичный URL)
# НЕ использовать: secrets.GIGACHAT_CLIENT_SECRET в job сборки web
```

**Workflow API** — секреты только в job деплоя `apps/api`, с `environment: production`.

### 4.7. CORS

```typescript
// apps/api — разрешать только свой фронт
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'https://<user>.github.io',  // GitHub Pages
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: false, // не нужны cookie с токенами
}));
```

### 4.8. Rate limiting и злоупотребления

- Лимит запросов на IP (например, 30 req / мин для `/api/analyze`).
- Таймаут запроса к GigaChat (30–60 с).
- Максимальный размер тела запроса (например, 1 MB для текста резюме).
- При превышении — `429 Too Many Requests` без деталей внутренней конфигурации.

### 4.9. Логирование

| Логировать | Не логировать |
|------------|----------------|
| requestId, duration, status | client_secret, access_token |
| provider id, model name | полный prompt с ПДн (на prod — маскировать) |
| ошибки без stack trace наружу | заголовок Authorization |

Использовать редактирование (redaction):

```typescript
function redact(obj: Record<string, unknown>) {
  const sensitive = ['authorization', 'client_secret', 'api_key', 'token'];
  // заменить значения на '[REDACTED]'
}
```

### 4.10. Pre-commit и CI проверки

| Инструмент | Назначение |
|------------|------------|
| **gitleaks** / **trufflehog** | Поиск секретов в коммитах |
| **eslint-plugin-no-secrets** | Статический анализ строк в коде |
| **`.env.example` без значений** | Шаблон без утечки |
| **CODEOWNERS** для `apps/api`** | Ревью изменений в провайдерах |

**GitHub Actions (фрагмент):**

```yaml
- name: Secret scan
  uses: gitleaks/gitleaks-action@v2
```

### 4.11. Ротация ключей

1. Создать новый ключ в GigaChat Studio.
2. Обновить secret на хостинге API.
3. Передеплоить API.
4. Отозвать старый ключ в Studio.
5. Проверить логи на 401.

### 4.12. Чеклист перед каждым релизом

- [ ] В `apps/web` нет `import.meta.env.VITE_*` с секретами.
- [ ] `git grep -i "client_secret\|api_key\|Bearer sk-"` — пусто.
- [ ] `.env` в `.gitignore`.
- [ ] gitleaks в CI зелёный.
- [ ] CORS указывает только production URL фронта.
- [ ] README не содержит реальных ключей.
- [ ] Source maps на prod не раскрывают серверные пути с секретами (серверные maps не публиковать).

### 4.13. Персональные данные (152-ФЗ)

- В форме — согласие на обработку данных перед отправкой.
- Не логировать на prod ФИО и дату рождения в открытом виде.
- Политика конфиденциальности (отдельная страница).
- Опционально: не хранить результаты на сервере (stateless MVP).

---

## 5. Технологический стек

### Frontend (`apps/web`)

| Категория | Технология |
|-----------|------------|
| UI | React 19, TypeScript |
| Сборка | Vite 6 |
| Стили | Tailwind CSS 4 |
| Роутинг | React Router 7 |
| Серверное состояние | RTK Query (`@reduxjs/toolkit`) |
| Локальные формы | React Hook Form + Zod |
| HTTP | через RTK Query `fetchBaseQuery` |

### Backend (`apps/api`)

| Категория | Технология |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Framework | Express или Fastify |
| Валидация | Zod |
| ИИ | `gigachat` (официальный SDK) |
| Натальная карта | Swiss Ephemeris (node) / astronomia |
| Геокодинг | Open-Meteo Geocoding API (без ключа) или Nominatim |

### Инфраструктура

| Категория | Технология |
|-----------|------------|
| Репозиторий | GitHub |
| CI | GitHub Actions |
| Фронт хостинг | GitHub Pages |
| API хостинг | Vercel / Railway / Render |
| Скан секретов | gitleaks |

---

## 6. Структура репозитория

```
synastry/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # lint, typecheck, test, gitleaks
│       ├── deploy-web.yml         # GitHub Pages (только VITE_*)
│       └── deploy-api.yml         # API (secrets только здесь)
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/               # store, router, providers
│   │   │   ├── features/
│   │   │   │   ├── analyze/       # форма, wizard, результат
│   │   │   │   └── settings/      # выбор модели (id, не ключи)
│   │   │   ├── shared/
│   │   │   │   ├── api/           # RTK Query baseApi
│   │   │   │   ├── ui/            # Button, Input, Card, …
│   │   │   │   └── lib/
│   │   │   └── pages/
│   │   ├── .env.example
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── api/
│       ├── src/
│       │   ├── index.ts
│       │   ├── config/            # env validation (zod)
│       │   ├── middleware/        # cors, rateLimit, errorHandler
│       │   ├── routes/
│       │   │   ├── analyze.route.ts
│       │   │   ├── health.route.ts
│       │   │   └── providers.route.ts
│       │   ├── chart/             # natal chart engine
│       │   ├── resume/            # parser (фаза 2)
│       │   └── providers/
│       │       ├── ai-provider.interface.ts
│       │       ├── gigachat.provider.ts
│       │       └── registry.ts
│       ├── .env.example
│       └── package.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── schemas/           # Zod: AnalyzeRequest, AnalyzeResponse
│       │   └── types/
│       └── package.json
├── .gitignore
├── .env.example                   # корневой указатель «см. apps/*»
├── DEVELOPMENT_PLAN.md            # этот файл
└── README.md
```

---

## 7. Модель данных и API

### 7.1. `POST /api/analyze`

**Request:**

```typescript
{
  candidate: {
    fullName: string;
    birthDate: string;      // ISO date YYYY-MM-DD
    birthTime?: string;     // HH:mm или null
    birthPlace: {
      city: string;
      latitude: number;
      longitude: number;
      timezone: string;     // IANA, e.g. Europe/Moscow
    };
    resumeText?: string;    // фаза 2
  };
  vacancy: {
    title: string;
    companyDescription: string;
    jobDescription: string;
  };
  options?: {
    providerId?: string;    // 'gigachat' — только id, не ключ
    model?: string;
  };
}
```

**Response:**

```typescript
{
  natalChart: {
    summary: string;
    positions: Array<{ body: string; sign: string; degree: number; house?: number }>;
    aspects: Array<{ a: string; b: string; type: string; orb: number }>;
  };
  compatibility: {
    verdict: 'recommended' | 'conditional' | 'not_recommended';
    score?: number;         // 0–100, опционально
    summary: string;
    pros: string[];
    cons: string[];
    arguments: string[];
  };
  meta: {
    provider: string;
    model: string;
    analyzedAt: string;
    disclaimer: string;
    birthTimeAccuracy: 'exact' | 'approximate' | 'unknown';
  };
}
```

### 7.2. `GET /api/health`

```json
{ "status": "ok", "version": "1.0.0" }
```

### 7.3. `GET /api/providers`

Список **публичных** id моделей (без ключей):

```json
{
  "providers": [
    { "id": "gigachat", "name": "GigaChat", "models": ["GigaChat", "GigaChat-Pro"] }
  ]
}
```

### 7.4. Коды ошибок

| Код | Ситуация |
|-----|----------|
| 400 | Невалидные данные (Zod) |
| 429 | Rate limit |
| 502 | Ошибка upstream (GigaChat) — без деталей секретов |
| 500 | Внутренняя ошибка — общее сообщение |

---

## 8. Пользовательские сценарии и экраны

### 8.1. User Flow (MVP)

```
[Главная] → [Шаг 1: Кандидат] → [Шаг 2: Вакансия] → [Шаг 3: Подтверждение]
    → [Загрузка] → [Результат]
```

### 8.2. Экраны

| # | Экран | Компоненты |
|---|-------|------------|
| 1 | Landing / Home | CTA «Новый анализ», краткое описание, disclaimer |
| 2 | Wizard Step 1 | PersonForm: ФИО, дата, время, город (autocomplete) |
| 3 | Wizard Step 2 | VacancyForm: должность, компания, описание |
| 4 | Wizard Step 3 | Сводка + выбор модели (из GET /providers) + согласие на обработку ПДн |
| 5 | Result | NatalChartSummary, CompatibilityReport, кнопка «Новый анализ» |
| 6 | 404 / Error | Человекочитаемые ошибки без stack trace |

### 8.3. Состояния UI

- `idle` → `submitting` → `success` | `error`
- RTK Query: `isLoading`, `isError`, `error` (маппинг на русские сообщения)
- Skeleton на экране результата при загрузке

---

## 9. Натальная карта и ИИ-анализ

### 9.1. Расчёт карты (сервер)

1. Геокодинг города → lat, lon, timezone (если не передано с клиента).
2. Локальное время → UTC.
3. Расчёт: Солнце, Луна, Меркурий–Плутон, ASC, MC, дома (система Плацидус или Whole Sign — зафиксировать в коде).
4. Мажорные аспекты (соединение, секстиль, квадрат, трин, оппозиция) с орбисами.

### 9.2. Точность времени рождения

| Ввод пользователя | `birthTimeAccuracy` | Поведение |
|-------------------|---------------------|-----------|
| Точное время | `exact` | Полный расчёт домов и ASC |
| «Не знаю» | `unknown` | Default 12:00 локально + warning в отчёте |
| Интервал | `approximate` | Среднее время (фаза 2) |

### 9.3. Промпт для GigaChat

**System (сокращённо):**

- Ты HR-аналитик с опорой на натальную карту.
- Отвечай **только** валидным JSON по схеме.
- Не выдумывай позиции планет — используй только переданные данные.
- Тон: деловой, конструктивный, без эзотерических клише.
- Укажи ограничения точности при `birthTimeAccuracy !== exact`.

**User:**

```json
{
  "natalChart": { ... },
  "vacancy": { ... },
  "birthTimeAccuracy": "exact"
}
```

**Постобработка:**

- Парсинг JSON из ответа (вырезка из markdown-блока при необходимости).
- Zod-валидация ответа.
- До 2 retry при невалидном JSON.

---

## 10. Плагинная система ИИ-провайдеров

### 10.1. Интерфейс

```typescript
interface AIProvider {
  readonly id: string;
  readonly displayName: string;
  complete(messages: ChatMessage[], options: CompleteOptions): Promise<string>;
  listModels(): Promise<string[]>;
}
```

### 10.2. Реестр

```typescript
const registry = new Map<string, AIProvider>();
registry.set('gigachat', new GigaChatProvider());
// registry.set('openai', new OpenAIProvider()); // фаза 3
```

### 10.3. Выбор провайдера

- Клиент передаёт `providerId: 'gigachat'`.
- Сервер проверяет whitelist: `['gigachat']`.
- Ключи **не** принимаются от клиента никогда.

### 10.4. Добавление нового провайдера (чеклист)

1. Реализовать `AIProvider`.
2. Добавить env в `apps/api/.env.example` (пустые значения).
3. Зарегистрировать в `registry.ts`.
4. Добавить секреты на хостинг API.
5. Обновить `GET /api/providers`.
6. Проверить gitleaks и CORS.

---

## 11. Адаптивный UI/UX

### 11.1. Breakpoints (Tailwind)

| Класс | Ширина | Макет |
|-------|--------|-------|
| default | < 640px | 1 колонка, wizard fullscreen |
| `sm` | ≥ 640px | Увеличенные отступы |
| `md` | ≥ 768px | 2 колонки на шаге сводки |
| `lg` | ≥ 1024px | Sidebar + контент |
| `xl` | ≥ 1280px | max-width контейнера 1200px |

### 11.2. Компоненты дизайн-системы

- `Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, `Alert`, `Spinner`, `StepIndicator`
- Цвета через CSS variables (`--color-primary`, `--color-surface`)
- Dark mode — фаза 3 (опционально)

### 11.3. Доступность

- Семантические теги (`main`, `form`, `section`)
- `label` + `htmlFor` для всех полей
- Focus ring, контраст WCAG AA
- `aria-live` для результата анализа

---

## 12. Деплой на GitHub и хостинг API

### 12.1. GitHub Pages (фронт)

1. Repo: `github.com/<user>/Synastry`.
2. `vite.config.ts`: `base: '/Synastry/'`.
3. Workflow `deploy-web.yml`:
   - trigger: push `main`
   - `npm ci && npm run build` в `apps/web`
   - env: **только** `VITE_API_URL`
   - deploy: GitHub Pages artifact

### 12.2. API (Vercel / Railway)

1. Root directory: `apps/api`.
2. Build command: `npm run build`.
3. Env на хостинге: все `GIGACHAT_*`, `CORS_ORIGIN`, `AI_PROVIDER`.
4. URL API прописать в GitHub Variable `VITE_API_URL` для сборки фронта.

### 12.3. Схема окружений

| Окружение | Frontend URL | API URL | Секреты |
|-----------|--------------|---------|---------|
| local | localhost:5173 | localhost:3001 | `.env` локально |
| production | `*.github.io/Synastry/` | `api.xxx.vercel.app` | GitHub Secrets + Vercel Env |

### 12.4. README (обязательные секции)

- Как запустить локально (без ключей в примерах).
- Куда положить ключи (только `apps/api/.env`).
- Ссылка на получение ключей GigaChat Studio.
- Disclaimer.

---

## 13. Фазы разработки и чеклисты

### Фаза 0 — Инициализация (3–5 дней)

- [ ] Создать репозиторий GitHub, ветка `main`, branch protection.
- [ ] Монорепо: web + api + shared.
- [ ] `.gitignore`, `.env.example`, gitleaks в CI.
- [ ] ESLint, Prettier, TypeScript strict.
- [ ] README с инструкцией по секретам (раздел 4).
- [ ] Health endpoint на API.

**Критерий готовности:** `npm run dev` для web и api, CI зелёный, секретов в git нет.

---

### Фаза 1 — MVP анализ (1,5–2 недели)

- [ ] Wizard формы (кандидат + вакансия).
- [ ] Валидация Zod на клиенте и сервере.
- [ ] Natal chart engine (базовый набор тел).
- [ ] GigaChat provider на BFF.
- [ ] `POST /api/analyze` → результат.
- [ ] Экран результата.
- [ ] Адаптив mobile-first.
- [ ] CORS + rate limit.
- [ ] Деплой web (Pages) + api (Vercel).

**Критерий готовности:** полный flow на production URL, ключи только на сервере.

---

### Фаза 2 — Резюме и качество (1 неделя)

- [ ] Upload PDF/DOCX, извлечение текста на сервере.
- [ ] LLM-структурирование резюме (через тот же BFF).
- [ ] Обязательный дозапрос даты рождения.
- [ ] Retry и structured output.
- [ ] Улучшенные ошибки и skeleton UI.
- [ ] Чеклист безопасности (раздел 4.12) перед релизом.

---

### Фаза 3 — Мульти-провайдер (3–5 дней)

- [ ] Второй провайдер (например OpenAI) — только server env.
- [ ] UI выбора модели.
- [ ] Feature flag `ENABLED_PROVIDERS=gigachat,openai`.

---

### Фаза 4 — Полировка

- [ ] История в IndexedDB.
- [ ] Экспорт PDF.
- [ ] i18n ru/en.
- [ ] Страница Privacy Policy.
- [ ] E2E тесты (Playwright): smoke без реальных ключей (mock API).

---

## 14. Риски, compliance, disclaimer

| Риск | Митигация |
|------|-----------|
| Утечка ключей | Раздел 4, gitleaks, BFF-only |
| Неточная карта без времени | Warning + `birthTimeAccuracy` |
| Галлюцинации ИИ | JSON schema, retry, только факты из chart JSON |
| Дискриминация при найме | Disclaimer: «вспомогательный инструмент, не замена собеседованию» |
| 152-ФЗ | Согласие, минимизация логов, политика конфиденциальности |

**Текст disclaimer (шаблон):**

> Результат носит аналитический и ознакомительный характер. Окончательное решение о найме принимает работодатель на основе собеседований, квалификации и законодательства РФ. Сервис не гарантирует точность астрологических интерпретаций.

---

## 15. Приложения

### A. Зависимости (npm)

**web:** `react`, `react-dom`, `@reduxjs/toolkit`, `react-redux`, `react-router-dom`, `react-hook-form`, `zod`, `@hookform/resolvers`

**api:** `express`, `zod`, `gigachat`, `cors`, `express-rate-limit`, `helmet`, `swisseph` (или альтернатива)

**dev:** `typescript`, `eslint`, `prettier`, `vitest`, `gitleaks` (CI)

### B. Полезные ссылки

- [GigaChat для разработчиков](https://developers.sber.ru/docs/ru/gigachain/overview)
- [GigaChat JS SDK](https://developers.sber.ru/docs/ru/gigachain/tools/js/gigachat)
- [GitHub Pages](https://docs.github.com/en/pages)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

### C. Контакты и роли (заполнить)

| Роль | Ответственность |
|------|-----------------|
| Frontend | UI, RTK Query, адаптив |
| Backend | BFF, chart, providers, security |
| DevOps | Actions, Pages, Vercel, secrets |
| Product | Тексты, disclaimer, UX wizard |

---

*Документ является единым источником правды на этапе планирования. При изменении архитектуры или политики секретов — обновлять этот файл и версию в заголовке.*
