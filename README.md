# QuizHub Live

MVP веб-приложения для проведения квизов в реальном времени.

## Возможности

- регистрация и вход для участников и организаторов;
- конструктор квиза для организатора;
- текстовые вопросы и вопросы с изображением;
- одиночный и множественный выбор ответа;
- запуск live-комнаты по короткому коду;
- синхронная демонстрация вопросов через Socket.IO;
- ответы доступны только во время активного вопроса;
- подсчёт баллов, бонус за скорость и лидерборд;
- личный кабинет с историей комнат и результатов.

## Запуск

```bash
npm install
npm run dev
```

Клиент: `http://localhost:5173`

API: `http://localhost:3001`

## Структура проекта

```text
frontend/
  index.html
  src/
    app/                 # корневая сборка клиентского приложения
    components/          # общие UI-компоненты
    pages/               # отдельная папка, JSX и CSS для каждой страницы
    services/            # API-клиент
    styles/              # дизайн-токены и глобальные стили
    utils/               # небольшие frontend-утилиты

backend/
  index.js               # точка входа сервера
  Dockerfile
  src/
    auth/                # авторизация, токены, middleware
    config/              # runtime-конфиг
    data/                # JSON-store
    quizzes/             # доменная логика квизов
    realtime/            # Socket.IO и live-сессии
    routes/              # HTTP endpoints

config/
  app-info.json          # базовая информация о проекте
  default-db.json        # стартовая структура JSON-хранилища
```

## Docker

Перед запуском Docker-образа соберите клиент:

```bash
npm run build
docker compose up --build
```

## Стек

- React + Vite
- Node.js + Express
- Socket.IO
- файловое JSON-хранилище для MVP

Подробности по архитектуре и этапам разработки находятся в `PROJECT_NOTE.md`.
