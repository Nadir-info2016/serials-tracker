# Трекер сериалов

Веб-приложение для учёта сериалов по статусам: **Смотрю**, **Буду смотреть**, **Перестал**, **Посмотрел**.

Стек: React + Vite (фронтенд) + Appwrite (бэкенд: авторизация и база данных).

---

## Как это работает

```
Браузер (React) → Appwrite API (авторизация, БД)
Coolify → хостит собранный React (dist/)
```

Appwrite — только бэкенд. Фронтенд деплоится отдельно (Coolify, Vercel, nginx и т.д.).

---

## 1. Настройка Appwrite

### 1.1 Создать проект

1. Открой свой Appwrite (например `https://appwrite.05.ru`) или [cloud.appwrite.io](https://cloud.appwrite.io)
2. **Create project** → задай имя, например `serials-tracker`
3. Скопируй **Project ID** из `Settings → General`

### 1.2 Добавить Web Platform

На главной странице проекта (**Overview**) → секция **Platforms** → **Add platform → Web**

- **Name:** любое (например `localhost` или `coolify`)
- **Hostname:** домен, с которого будет открываться сайт

> Если доменов несколько — добавь каждый отдельной платформой. Без этого Appwrite вернёт **403 Forbidden**.

### 1.3 Включить авторизацию

**Auth → Settings → Email/Password** → включить.

### 1.4 Создать базу данных

**Databases → Create database**

- **Database ID:** `serials-tracker`
- **Name:** `serials-tracker`

### 1.5 Создать коллекцию

Внутри базы → **Create collection**

- **Collection ID:** `serials`
- **Name:** `serials`

**Вкладка Attributes** → добавить 4 атрибута:

| Key      | Type   | Size | Required |
|----------|--------|------|----------|
| `title`  | String | 255  | ✅        |
| `status` | String | 20   | ✅        |
| `notes`  | String | 1000 | ❌        |
| `userId` | String | 36   | ✅        |

**Вкладка Settings → Permissions** → **Add role: Users** → отметить **Create, Read, Update, Delete**.

---

## 2. Переменные окружения

Все переменные начинаются с `VITE_` — это требование Vite для передачи значений в браузер.

| Переменная | Где взять |
|------------|-----------|
| `VITE_APPWRITE_ENDPOINT` | URL Appwrite + `/v1`, например `https://appwrite.05.ru/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Appwrite → Settings → General → **Project ID** |
| `VITE_APPWRITE_PROJECT_NAME` | Любое имя, например `serials-tracker` |
| `VITE_APPWRITE_DB_ID` | Appwrite → Databases → нужная БД → **Database ID** |
| `VITE_APPWRITE_COLLECTION_ID` | Appwrite → нужная БД → коллекция → **Collection ID** |

---

## 3. Локальный запуск

```bash
git clone https://github.com/Nadir-info2016/serials-tracker.git
cd serials-tracker
cp .env.example .env
```

Заполни `.env`:

```env
VITE_APPWRITE_ENDPOINT=https://appwrite.05.ru/v1
VITE_APPWRITE_PROJECT_ID=xxxxxxxxxxxxxxxx
VITE_APPWRITE_PROJECT_NAME=serials-tracker
VITE_APPWRITE_DB_ID=serials-tracker
VITE_APPWRITE_COLLECTION_ID=serials
```

```bash
npm install
npm run dev
```

Открой `http://localhost:5173` — зарегистрируйся прямо в приложении.

> Добавь `localhost` как Web Platform в Appwrite (шаг 1.2), иначе будет 403.

---

## 4. Деплой через Coolify

### 4.1 Создать приложение

1. Coolify → **New Resource → Application**
2. Source: **GitHub** → выбрать репозиторий `serials-tracker`
3. Настройки сборки:
   - **Install command:** `npm install`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

### 4.2 Добавить переменные окружения

Coolify → вкладка **Environment Variables**:

```
VITE_APPWRITE_ENDPOINT=https://appwrite.05.ru/v1
VITE_APPWRITE_PROJECT_ID=xxxxxxxxxxxxxxxx
VITE_APPWRITE_PROJECT_NAME=serials-tracker
VITE_APPWRITE_DB_ID=serials-tracker
VITE_APPWRITE_COLLECTION_ID=serials
```

### 4.3 Задеплоить

Нажми **Deploy**. После сборки Coolify выдаст публичный домен.

### 4.4 Добавить домен в Appwrite Platforms

Appwrite → проект → **Overview → Platforms → Add platform → Web**

- Hostname: домен из Coolify (например `myapp.95.213.212.155.sslip.io`)

> Этот шаг обязателен — без него Appwrite блокирует все запросы с нового домена.

---

## Возможности

- Регистрация и вход по email/паролю
- 4 статуса: Смотрю / Буду смотреть / Перестал / Посмотрел
- Добавление, редактирование, удаление сериалов
- Заметки к каждому сериалу
- Быстрая смена статуса прямо с карточки
- Данные каждого пользователя хранятся отдельно
