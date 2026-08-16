# PWA просмотра погоды

Одноэкранное PWA на Next.js: поиск города, затем полный обзор одного места. Данные через существующий SDK `lib/openweather`. Ключ OpenWeather только на сервере. Офлайн — последний успешный снимок выбранных городов.

## Решения

- Скоуп: current + 5-дневный/3-часовой forecast + current AQI + до 8 избранных городов.
- Язык: русский. OWM `lang=ru`. Единицы `metric` (°C, м/с). Переключателя языка и единиц нет.
- Старт: пустой поиск. Геолокация только по кнопке «Рядом».
- Офлайн: показать закешированный снимок и время обновления. Без фоновой очереди запросов.
- Навигация: один маршрут `/`. Нет URL на город, нет дашборда карточек.

## Вне скоупа

- `air.forecast`, `air.history`, `geo.zip`
- Единицы imperial/standard, язык en, переключатель темы как продукт (системная тема next-themes остаётся)
- Аккаунты, синхронизация избранного, уведомления, виджеты
- Живые вызовы OWM в тестах, e2e, визуальные тесты React Bits / Serwist

## Архитектура

```
браузер                    Next.js                     OWM
────────                    ──────                     ───
поиск / «Рядом»  →  GET /api/geo[ /reverse]  →  owm.geo.*
выбор места      →  GET /api/weather         →  current + forecast + air.current
localStorage     ←  JSON { ok, data }        ←  ResultAsync
(снимки, места)
```

SDK вызывается только в Route Handlers. Клиент не импортирует `createOpenWeatherClient` и не видит `OPENWEATHERMAP_API_KEY`.

Сервис-воркер (Serwist) прекеширует оболочку приложения. Runtime: сеть для HTML/API. Офлайн-погода не из Cache Storage API, а из `localStorage`-снимков: SW не должен отдавать ответы, в которых мог бы оказаться ключ, и не является источником правды для данных.

## API

Один серверный клиент:

```ts
createOpenWeatherClient({
  apiKey: process.env.OPENWEATHERMAP_API_KEY,
  units: "metric",
  lang: "ru",
})
```

Ключ обязателен. Если его нет — все три роута отвечают `503` с сообщением «Сервис погоды недоступен».

| Метод и путь | Query | SDK | Успех |
| --- | --- | --- | --- |
| `GET /api/geo` | `q` (непустая строка) | `geo.direct({ q, limit: 5 })` | `{ ok: true, data: GeoPlace[] }` |
| `GET /api/geo/reverse` | `lat`, `lon` | `geo.reverse({ lat, lon, limit: 1 })` | `{ ok: true, data: GeoPlace }` — первый элемент; пустой массив → ошибка «Ничего не найдено» |
| `GET /api/weather` | `lat`, `lon` | параллельно `current.get`, `forecast.get`, `airPollution.current` | `{ ok: true, data: { current, forecast, air } }`. Любой из трёх `err` → весь роут с ошибкой, частичного ответа нет |

Ошибка: `{ ok: false, error: { type, message } }`. `message` — готовый русский текст (см. Ошибки). HTTP-статус: `400` validation, `401/403/404` как у OWM, `429` как у OWM, `502` parse/network, `503` нет ключа.

`appid` никогда не попадает в JSON и не логируется.

## Клиентское состояние

Без Zustand и без URL-state. Хук `useWeather` + `localStorage`.

Ключ хранилища: `zalupy.weather.v1`.

```ts
type PlaceId = `${number},${number}` // lat,lon с точностью как пришло от geo

type Place = {
  id: PlaceId
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

type Snapshot = {
  current: CurrentWeather<"metric">
  forecast: Forecast<"metric">
  air: AirPollution
  fetchedAt: number // unix ms
}

type WeatherStore = {
  places: Place[]      // избранное, максимум 8, порядок — порядок добавления
  activeId: PlaceId | null
  snapshots: Record<PlaceId, Snapshot>
}
```

Правила:

- Старт: прочитать store. Если `activeId` есть и для него есть snapshot — сразу показать город, затем ревалидировать `/api/weather`. Если `activeId` есть, а снимка нет — показать город в загрузке и запросить. Если `activeId` нет — пустой поиск.
- Выбор из поиска или «Рядом» ставит `activeId` и запрашивает погоду. В избранное место само не добавляется.
- Звезда добавляет активное место в `places`, если его ещё нет и `places.length < 8`. При лимите 8 звезда не добавляет, UI показывает «Можно сохранить не больше 8 городов».
- Снятие звезды удаляет место из `places` и его snapshot. Если это было активное — `activeId = null`, экран поиска.
- Переключение чипа меняет `activeId`. Если snapshot свежее 10 минут — показать его и ревалидировать в фоне. Иначе — показать snapshot (если есть) как загрузку и запросить.
- Успешный ответ всегда перезаписывает `snapshots[id]`.

`PlaceId` строится из `lat` и `lon` ответа геокодера, не из имени: «Москва» и «Moscow» с одними координатами — одно место.

## Экраны

Один маршрут `app/page.tsx`.

### Пустой поиск

Когда `activeId === null`:

- Поле поиска города (React Bits / App UI). Запрос `/api/geo` после паузы 300 ms, `q.trim().length >= 2`.
- Список до 5 подсказок: `name`, `state`, `country`. Клик выбирает место.
- Кнопка «Рядом»: `navigator.geolocation` (timeout 10 s) → `/api/geo/reverse` → то же, что выбор из списка.
- Если `places` не пуст, чипы избранного всё равно видны над поиском, чтобы вернуться к сохранённому городу.

### Экран города

Когда `activeId !== null`:

- Шапка: поиск (сворачивается в иконку на узком экране), «Рядом», звезда избранного, чипы `places`.
- Активный чип выделен. Клик по чужому чипу переключает город.
- Герой: температура (`main.temp`), описание (`weather[0].description`), «ощущается как» (`feels_like`), имя места.
- Ряд фактов: влажность, ветер (скорость + направление), давление, восход и закат (`sys.sunrise` / `sunset` + `timezone`).
- Блок AQI: индекс 1–5 словами (Хорошо / Удовлетворительно / Умеренно / Плохо / Очень плохо) и компоненты `pm2_5`, `pm10`, `no2`, `o3`.
- Прогноз: 5 календарных дней по `forecast.list` (группировка по локальной дате города через `timezone`). День свёрнут: мин/макс и иконка. Раскрытие — слоты по 3 часа (`dt_txt` / `dt`).
- Фон React Bits зависит от `weather[0].main`: Clear / Clouds / Rain|Drizzle|Thunderstorm / Snow / Atmosphere. Один эффект на экран, приглушённый, с `prefers-reduced-motion`.

PWA: web app manifest (имя «Погода», `standalone`, иконки), Serwist в `next.config`. Установка стандартная для браузера, отдельного промо-баннера нет.

## Ошибки

Все пользовательские тексты — ниже, дословно.

| Ситуация | UI |
| --- | --- |
| `q` короче 2 символов | запрос не уходит |
| Геокодер вернул `[]` | «Ничего не найдено» |
| Сеть / HTTP на поиске | «Не удалось найти город, попробуйте ещё раз» |
| Нет ключа, 401, 403 | «Сервис погоды недоступен» |
| 429 | «Слишком много запросов» |
| `validation` / `parse` погоды | «Данные погоды повреждены» |
| Сеть погоды, snapshot есть | оставить данные, баннер «Нет сети, показано за {time}» |
| Сеть погоды, snapshot нет | заглушка «Нет соединения» и кнопка «Повторить» |
| Геолокация отказана или timeout | тост «Не удалось определить место», остаёмся где были |
| Лимит избранного | «Можно сохранить не больше 8 городов» |

`{time}` — локальное время `fetchedAt` в формате `HH:mm`.

Отказ геолокации не переключает экран и не чистит `activeId`.

## Файлы

```
app/
  page.tsx
  layout.tsx              // metadata, ru, theme, PWA
  manifest.ts
  sw.ts                   // Serwist
  api/geo/route.ts
  api/geo/reverse/route.ts
  api/weather/route.ts
lib/weather/
  server.ts               // createOpenWeatherClient из env
  errors.ts               // OpenWeatherError → { status, message }
  storage.ts              // читать/писать WeatherStore
  place.ts                // PlaceId, placeFromGeo
  forecast-days.ts        // группировка list[] в дни
components/weather/
  search-empty.tsx
  city-screen.tsx
  place-chips.tsx
  current-hero.tsx
  facts-row.tsx
  aqi-card.tsx
  forecast-list.tsx
  offline-banner.tsx
```

React Bits ставятся в `components/react-bits/` и `components/blocks/` через shadcn registry, затем правятся под этот экран. Существующий `components/blocks/hero-1.tsx` не является экраном погоды и не используется как каркас.

## Тесты

Vitest. Расширить `include`: `lib/**/*.test.ts`. Новые тесты только в `lib/weather/*.test.ts`. Fetch в роутах подменяется, живого OWM нет.

Покрыть:

- `errors.ts`: каждый `OpenWeatherError.type` и статусы 401/429 → точный русский `message` и HTTP status
- `place.ts`: одинаковые координаты → один `PlaceId`; разные имена не плодят дубликаты
- `storage.ts`: лимит 8; снятие активного → `activeId === null` и snapshot удалён; запись snapshot по `fetchedAt`
- `forecast-days.ts`: фикстура из `docs/forecast5.md` даёт 5 дней и 3-часовые слоты внутри дня
- Роуты: query без `q`/`lat` → 400; успешный мок SDK → `{ ok: true }`; ключ не встречается в теле ответа

Не покрываем: компоненты, Serwist, geolocation, React Bits.

## Реализация

- HTTPS. Ключ только `OPENWEATHERMAP_API_KEY` из `.env.local`.
- `lang="ru"` на `<html>`.
- Без комментариев в коде, если не попросят.
- После сборки: `pnpm lint`, `pnpm typecheck`, `pnpm test`.
