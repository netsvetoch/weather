# Weather PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Одноэкранное PWA «Погода»: поиск города, текущая погода + 5-дневный прогноз + AQI, избранное до 8 мест, офлайн-снимок.

**Architecture:** SDK `lib/openweather` только в Route Handlers. Клиент ходит в `/api/geo`, `/api/geo/reverse`, `/api/weather`. Состояние и снимки — `localStorage` ключ `zalupy.weather.v1`. Serwist прекеширует оболочку; `/api/*` — NetworkOnly. UI — один маршрут `/`.

**Tech Stack:** Next.js 16.3 App Router, React 19, Zod/neverthrow SDK, Vitest, Serwist 9 (`@serwist/next`), React Bits Pro (`-tw` + App UI), Tailwind 4, next-themes.

## Global Constraints

- Язык UI и OWM: русский. `lang=ru` на `<html>` и в клиенте SDK. Единицы только `metric`.
- Ключ только `process.env.OPENWEATHERMAP_API_KEY`. Не логировать, не отдавать в JSON.
- Тексты ошибок — дословно из спеки (таблица ниже). Не перефразировать.
- Тесты только `lib/weather/*.test.ts`. Живого OWM нет. Компоненты / Serwist / geolocation / React Bits не тестируем.
- Стиль: double quotes, no semicolons, без комментариев в коде.
- Не использовать `components/blocks/hero-1.tsx` как каркас.
- После всех задач: `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- Спека: `docs/superpowers/specs/2026-08-16-weather-pwa-design.md`.

### Дословные тексты

| Ключ | Строка |
| --- | --- |
| `NOT_FOUND` | Ничего не найдено |
| `GEO_FAILED` | Не удалось найти город, попробуйте ещё раз |
| `UNAVAILABLE` | Сервис погоды недоступен |
| `RATE_LIMIT` | Слишком много запросов |
| `CORRUPT` | Данные погоды повреждены |
| `OFFLINE` | Нет соединения |
| `GEOLOCATION_FAILED` | Не удалось определить место |
| `FAVORITE_LIMIT` | Можно сохранить не больше 8 городов |
| `OFFLINE_BANNER` | `Нет сети, показано за ${HH:mm}` |

`type` в JSON ошибки: `"validation" | "network" | "http" | "parse"`.

### File map

Create:

- `lib/weather/types.ts`
- `lib/weather/errors.ts` + `errors.test.ts`
- `lib/weather/place.ts` + `place.test.ts`
- `lib/weather/storage.ts` + `storage.test.ts`
- `lib/weather/forecast-days.ts` + `forecast-days.test.ts`
- `lib/weather/server.ts`
- `lib/weather/handlers.ts` + `handlers.test.ts`
- `lib/weather/fixtures.ts` — общие мок-ответы для handlers/storage
- `app/api/geo/route.ts`
- `app/api/geo/reverse/route.ts`
- `app/api/weather/route.ts`
- `app/manifest.ts`
- `app/sw.ts`
- `app/icon.tsx`
- `hooks/use-weather.ts`
- `components/weather/*.tsx` (см. Task 7)
- `public/icon-192.png`, `public/icon-512.png`

Modify:

- `app/page.tsx`, `app/layout.tsx`, `next.config.ts`
- `app/globals.css` — токены палитры погоды

Do not: Zustand, URL на город, air.forecast/history, geo.zip, e2e.

`catalog` в store — дополнение к спеке: нужен, чтобы показать имя активного города, которого ещё нет в избранном. `activeId` остаётся источником «что открыто».

---

### Task 1: mapOpenWeatherError

**Files:**
- Create: `lib/weather/errors.ts`
- Create: `lib/weather/errors.test.ts`

**Interfaces:**
- Consumes: `OpenWeatherError` from `@/lib/openweather`
- Produces:
  - `export type WeatherSurface = "geo" | "weather"`
  - `export type MappedWeatherError = { status: number; type: OpenWeatherError["type"]; message: string }`
  - `export const WEATHER_COPY` — объект со всеми строками из таблицы
  - `export function mapOpenWeatherError(error: OpenWeatherError, surface: WeatherSurface): MappedWeatherError`
  - `export function unavailableError(): MappedWeatherError` — `{ status: 503, type: "http", message: WEATHER_COPY.UNAVAILABLE }`
  - `export function formatFetchedAt(ms: number): string` — `HH:mm` в `ru-RU`
  - `export function offlineBanner(fetchedAt: number): string` — `Нет сети, показано за ${formatFetchedAt(fetchedAt)}`

- [ ] **Step 1: Write the failing test**

Create `lib/weather/errors.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import {
  formatFetchedAt,
  mapOpenWeatherError,
  offlineBanner,
  unavailableError,
  WEATHER_COPY,
} from "./errors"

const issues = [
  {
    code: "custom" as const,
    path: [],
    message: "bad",
  },
]

describe("mapOpenWeatherError geo", () => {
  test("validation is 400 GEO_FAILED", () => {
    expect(mapOpenWeatherError({ type: "validation", issues }, "geo")).toEqual({
      status: 400,
      type: "validation",
      message: WEATHER_COPY.GEO_FAILED,
    })
  })

  test("network is 502 GEO_FAILED", () => {
    expect(mapOpenWeatherError({ type: "network", cause: "offline" }, "geo")).toEqual({
      status: 502,
      type: "network",
      message: WEATHER_COPY.GEO_FAILED,
    })
  })

  test("parse is 502 GEO_FAILED", () => {
    expect(mapOpenWeatherError({ type: "parse", issues }, "geo")).toEqual({
      status: 502,
      type: "parse",
      message: WEATHER_COPY.GEO_FAILED,
    })
  })

  test("http 401/403 is UNAVAILABLE", () => {
    expect(
      mapOpenWeatherError({ type: "http", status: 401, message: "x" }, "geo").message,
    ).toBe(WEATHER_COPY.UNAVAILABLE)
    expect(
      mapOpenWeatherError({ type: "http", status: 403, message: "x" }, "geo"),
    ).toMatchObject({ status: 403, type: "http" })
  })

  test("http 429 is RATE_LIMIT", () => {
    expect(mapOpenWeatherError({ type: "http", status: 429, message: "x" }, "geo")).toEqual({
      status: 429,
      type: "http",
      message: WEATHER_COPY.RATE_LIMIT,
    })
  })

  test("http other keeps status and GEO_FAILED", () => {
    expect(mapOpenWeatherError({ type: "http", status: 404, message: "x" }, "geo")).toEqual({
      status: 404,
      type: "http",
      message: WEATHER_COPY.GEO_FAILED,
    })
  })
})

describe("mapOpenWeatherError weather", () => {
  test("validation is 400 CORRUPT", () => {
    expect(mapOpenWeatherError({ type: "validation", issues }, "weather")).toEqual({
      status: 400,
      type: "validation",
      message: WEATHER_COPY.CORRUPT,
    })
  })

  test("parse is 502 CORRUPT", () => {
    expect(mapOpenWeatherError({ type: "parse", issues }, "weather").message).toBe(
      WEATHER_COPY.CORRUPT,
    )
  })

  test("network is 502 OFFLINE", () => {
    expect(mapOpenWeatherError({ type: "network", cause: null }, "weather")).toEqual({
      status: 502,
      type: "network",
      message: WEATHER_COPY.OFFLINE,
    })
  })

  test("http 401 and 429", () => {
    expect(
      mapOpenWeatherError({ type: "http", status: 401, message: "x" }, "weather").message,
    ).toBe(WEATHER_COPY.UNAVAILABLE)
    expect(
      mapOpenWeatherError({ type: "http", status: 429, message: "x" }, "weather").message,
    ).toBe(WEATHER_COPY.RATE_LIMIT)
  })
})

test("unavailableError is 503", () => {
  expect(unavailableError()).toEqual({
    status: 503,
    type: "http",
    message: WEATHER_COPY.UNAVAILABLE,
  })
})

test("offlineBanner uses HH:mm", () => {
  const ms = Date.UTC(2026, 0, 1, 9, 5, 0)
  const clock = formatFetchedAt(ms)
  expect(clock).toMatch(/^\d{2}:\d{2}$/)
  expect(offlineBanner(ms)).toBe(`Нет сети, показано за ${clock}`)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/weather/errors.test.ts`

Expected: FAIL — cannot find module `./errors`

- [ ] **Step 3: Write minimal implementation**

Create `lib/weather/errors.ts`:

```ts
import type { OpenWeatherError } from "@/lib/openweather"

export type WeatherSurface = "geo" | "weather"

export type MappedWeatherError = {
  status: number
  type: OpenWeatherError["type"]
  message: string
}

export const WEATHER_COPY = {
  NOT_FOUND: "Ничего не найдено",
  GEO_FAILED: "Не удалось найти город, попробуйте ещё раз",
  UNAVAILABLE: "Сервис погоды недоступен",
  RATE_LIMIT: "Слишком много запросов",
  CORRUPT: "Данные погоды повреждены",
  OFFLINE: "Нет соединения",
  GEOLOCATION_FAILED: "Не удалось определить место",
  FAVORITE_LIMIT: "Можно сохранить не больше 8 городов",
} as const

export function unavailableError(): MappedWeatherError {
  return { status: 503, type: "http", message: WEATHER_COPY.UNAVAILABLE }
}

export function mapOpenWeatherError(
  error: OpenWeatherError,
  surface: WeatherSurface,
): MappedWeatherError {
  if (error.type === "http") {
    if (error.status === 401 || error.status === 403) {
      return { status: error.status, type: "http", message: WEATHER_COPY.UNAVAILABLE }
    }
    if (error.status === 429) {
      return { status: 429, type: "http", message: WEATHER_COPY.RATE_LIMIT }
    }
    return {
      status: error.status,
      type: "http",
      message: surface === "geo" ? WEATHER_COPY.GEO_FAILED : WEATHER_COPY.CORRUPT,
    }
  }

  if (error.type === "validation") {
    return {
      status: 400,
      type: "validation",
      message: surface === "geo" ? WEATHER_COPY.GEO_FAILED : WEATHER_COPY.CORRUPT,
    }
  }

  if (error.type === "parse") {
    return {
      status: 502,
      type: "parse",
      message: surface === "geo" ? WEATHER_COPY.GEO_FAILED : WEATHER_COPY.CORRUPT,
    }
  }

  return {
    status: 502,
    type: "network",
    message: surface === "geo" ? WEATHER_COPY.GEO_FAILED : WEATHER_COPY.OFFLINE,
  }
}

export function formatFetchedAt(ms: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms))
}

export function offlineBanner(fetchedAt: number): string {
  return `Нет сети, показано за ${formatFetchedAt(fetchedAt)}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/weather/errors.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/weather/errors.ts lib/weather/errors.test.ts
git commit -m "маппинг ошибок owm в русские тексты"
```

---

### Task 2: PlaceId и placeFromGeo

**Files:**
- Create: `lib/weather/types.ts`
- Create: `lib/weather/place.ts`
- Create: `lib/weather/place.test.ts`

**Interfaces:**
- Consumes: `GeoPlace` from `@/lib/openweather`
- Produces:
  - `export type PlaceId = \`${number},${number}\``
  - `export type Place = { id: PlaceId; name: string; country: string; state?: string; lat: number; lon: number }`
  - `export function toPlaceId(lat: number, lon: number): PlaceId`
  - `export function placeFromGeo(place: GeoPlace): Place`

- [ ] **Step 1: Write the failing test**

Create `lib/weather/place.test.ts`:

```ts
import { expect, test } from "vitest"
import { placeFromGeo, toPlaceId } from "./place"

test("same coordinates produce one PlaceId", () => {
  expect(toPlaceId(55.7558, 37.6173)).toBe("55.7558,37.6173")
  expect(toPlaceId(55.7558, 37.6173)).toBe(toPlaceId(55.7558, 37.6173))
})

test("different names at same coords are one place", () => {
  const a = placeFromGeo({ name: "Москва", lat: 55.7558, lon: 37.6173, country: "RU" })
  const b = placeFromGeo({ name: "Moscow", lat: 55.7558, lon: 37.6173, country: "RU" })
  expect(a.id).toBe(b.id)
  expect(a.id).toBe("55.7558,37.6173")
  expect(a.name).toBe("Москва")
  expect(b.name).toBe("Moscow")
})

test("copies state when present", () => {
  const place = placeFromGeo({
    name: "Austin",
    lat: 30.2672,
    lon: -97.7431,
    country: "US",
    state: "Texas",
  })
  expect(place.state).toBe("Texas")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/weather/place.test.ts`

Expected: FAIL — cannot find module `./place`

- [ ] **Step 3: Write types + implementation**

Create `lib/weather/types.ts`:

```ts
import type { AirPollution, CurrentWeather, Forecast } from "@/lib/openweather"

export type PlaceId = `${number},${number}`

export type Place = {
  id: PlaceId
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

export type Snapshot = {
  current: CurrentWeather<"metric">
  forecast: Forecast<"metric">
  air: AirPollution
  fetchedAt: number
}

export type WeatherStore = {
  places: Place[]
  activeId: PlaceId | null
  catalog: Record<PlaceId, Place>
  snapshots: Record<PlaceId, Snapshot>
}

export const STORAGE_KEY = "zalupy.weather.v1"
export const MAX_PLACES = 8
export const FRESH_MS = 10 * 60 * 1000
```

Create `lib/weather/place.ts`:

```ts
import type { GeoPlace } from "@/lib/openweather"
import type { Place, PlaceId } from "./types"

export function toPlaceId(lat: number, lon: number): PlaceId {
  return `${lat},${lon}`
}

export function placeFromGeo(place: GeoPlace): Place {
  return {
    id: toPlaceId(place.lat, place.lon),
    name: place.name,
    country: place.country,
    state: place.state,
    lat: place.lat,
    lon: place.lon,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/weather/place.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/weather/types.ts lib/weather/place.ts lib/weather/place.test.ts
git commit -m "PlaceId из координат геокодера"
```

---

### Task 3: localStorage store

**Files:**
- Create: `lib/weather/storage.ts`
- Create: `lib/weather/storage.test.ts`

**Interfaces:**
- Consumes: `WeatherStore`, `Place`, `PlaceId`, `Snapshot`, `STORAGE_KEY`, `MAX_PLACES`, `FRESH_MS` from `./types`; `WEATHER_COPY` from `./errors`
- Produces:
  - `export function emptyStore(): WeatherStore`
  - `export function readStore(storage: Storage): WeatherStore`
  - `export function writeStore(storage: Storage, store: WeatherStore): void`
  - `export function selectPlace(store: WeatherStore, place: Place): WeatherStore`
  - `export function starActive(store: WeatherStore): { store: WeatherStore; error?: "limit" }`
  - `export function unstar(store: WeatherStore, id: PlaceId): WeatherStore`
  - `export function putSnapshot(store: WeatherStore, id: PlaceId, snapshot: Snapshot): WeatherStore`
  - `export function isFresh(snapshot: Snapshot, now: number): boolean`

Все функции store иммутабельны: возвращают новый объект.

- [ ] **Step 1: Write the failing test**

Create `lib/weather/storage.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import { emptyStore, isFresh, putSnapshot, readStore, selectPlace, starActive, unstar, writeStore } from "./storage"
import { MAX_PLACES, STORAGE_KEY, type Place, type Snapshot } from "./types"

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key) {
      return map.get(key) ?? null
    },
    key(index) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key) {
      map.delete(key)
    },
    setItem(key, value) {
      map.set(key, String(value))
    },
  }
}

const moscow: Place = {
  id: "55.7558,37.6173",
  name: "Москва",
  country: "RU",
  lat: 55.7558,
  lon: 37.6173,
}

const spb: Place = {
  id: "59.9343,30.3351",
  name: "Санкт-Петербург",
  country: "RU",
  lat: 59.9343,
  lon: 30.3351,
}

const snapshot = { fetchedAt: 1_700_000_000_000 } as Snapshot

test("selectPlace sets activeId and catalog, not places", () => {
  const next = selectPlace(emptyStore(), moscow)
  expect(next.activeId).toBe(moscow.id)
  expect(next.catalog[moscow.id]).toEqual(moscow)
  expect(next.places).toEqual([])
})

test("starActive respects limit 8", () => {
  let store = emptyStore()
  for (let i = 0; i < MAX_PLACES; i += 1) {
    const place: Place = {
      id: `${i},${i}`,
      name: `C${i}`,
      country: "RU",
      lat: i,
      lon: i,
    }
    store = starActive(selectPlace(store, place)).store
  }
  const ninth: Place = { id: "9,9", name: "C9", country: "RU", lat: 9, lon: 9 }
  const result = starActive(selectPlace(store, ninth))
  expect(result.error).toBe("limit")
  expect(result.store.places).toHaveLength(8)
})

test("unstar active clears activeId and snapshot", () => {
  let store = putSnapshot(starActive(selectPlace(emptyStore(), moscow)).store, moscow.id, snapshot)
  store = unstar(store, moscow.id)
  expect(store.activeId).toBeNull()
  expect(store.places).toEqual([])
  expect(store.snapshots[moscow.id]).toBeUndefined()
})

test("unstar non-active keeps activeId", () => {
  let store = starActive(selectPlace(emptyStore(), moscow)).store
  store = starActive(selectPlace(store, spb)).store
  store = unstar(store, moscow.id)
  expect(store.activeId).toBe(spb.id)
  expect(store.places.map((p) => p.id)).toEqual([spb.id])
})

test("write and read roundtrip", () => {
  const storage = memoryStorage()
  const store = putSnapshot(selectPlace(emptyStore(), moscow), moscow.id, snapshot)
  writeStore(storage, store)
  expect(storage.getItem(STORAGE_KEY)).toBeTruthy()
  expect(readStore(storage)).toEqual(store)
})

test("readStore returns empty on garbage", () => {
  const storage = memoryStorage()
  storage.setItem(STORAGE_KEY, "{")
  expect(readStore(storage)).toEqual(emptyStore())
})

test("isFresh is 10 minutes", () => {
  expect(isFresh({ ...snapshot, fetchedAt: 1000 }, 1000 + 9 * 60 * 1000)).toBe(true)
  expect(isFresh({ ...snapshot, fetchedAt: 1000 }, 1000 + 10 * 60 * 1000 + 1)).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/weather/storage.test.ts`

Expected: FAIL — cannot find module `./storage`

- [ ] **Step 3: Write minimal implementation**

Create `lib/weather/storage.ts`:

```ts
import {
  FRESH_MS,
  MAX_PLACES,
  STORAGE_KEY,
  type Place,
  type PlaceId,
  type Snapshot,
  type WeatherStore,
} from "./types"

export function emptyStore(): WeatherStore {
  return { places: [], activeId: null, catalog: {}, snapshots: {} }
}

export function readStore(storage: Storage): WeatherStore {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as WeatherStore
    if (!parsed || !Array.isArray(parsed.places) || typeof parsed.catalog !== "object") {
      return emptyStore()
    }
    return {
      places: parsed.places,
      activeId: parsed.activeId ?? null,
      catalog: parsed.catalog ?? {},
      snapshots: parsed.snapshots ?? {},
    }
  } catch {
    return emptyStore()
  }
}

export function writeStore(storage: Storage, store: WeatherStore): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function selectPlace(store: WeatherStore, place: Place): WeatherStore {
  return {
    ...store,
    activeId: place.id,
    catalog: { ...store.catalog, [place.id]: place },
  }
}

export function starActive(store: WeatherStore): { store: WeatherStore; error?: "limit" } {
  if (!store.activeId) return { store }
  if (store.places.some((place) => place.id === store.activeId)) return { store }
  if (store.places.length >= MAX_PLACES) return { store, error: "limit" }
  const place = store.catalog[store.activeId]
  if (!place) return { store }
  return { store: { ...store, places: [...store.places, place] } }
}

export function unstar(store: WeatherStore, id: PlaceId): WeatherStore {
  const { [id]: _removed, ...snapshots } = store.snapshots
  return {
    ...store,
    places: store.places.filter((place) => place.id !== id),
    activeId: store.activeId === id ? null : store.activeId,
    snapshots,
  }
}

export function putSnapshot(
  store: WeatherStore,
  id: PlaceId,
  snapshot: Snapshot,
): WeatherStore {
  return { ...store, snapshots: { ...store.snapshots, [id]: snapshot } }
}

export function isFresh(snapshot: Snapshot, now: number): boolean {
  return now - snapshot.fetchedAt < FRESH_MS
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/weather/storage.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/weather/storage.ts lib/weather/storage.test.ts
git commit -m "store избранного и снимков погоды"
```

---

### Task 4: groupForecastDays

**Files:**
- Create: `lib/weather/forecast-days.ts`
- Create: `lib/weather/forecast-days.test.ts`

**Interfaces:**
- Consumes: `ForecastItem` from `@/lib/openweather`
- Produces:
  - `export type ForecastDay = { date: string; min: number; max: number; icon: string; description: string; slots: ForecastItem<"metric">[] }`
  - `export function groupForecastDays(list: ForecastItem<"metric">[], timezoneOffsetSeconds: number): ForecastDay[]`

`date` — `YYYY-MM-DD` в локальной зоне города: `dt + timezone` как UTC- comp. `icon`/`description` — слот, ближайший к 12:00 локального, иначе первый. Дни в порядке появления. Не больше 5 дней.

- [ ] **Step 1: Write the failing test**

Create `lib/weather/forecast-days.test.ts`:

```ts
import { expect, test } from "vitest"
import type { ForecastItem } from "@/lib/openweather"
import { groupForecastDays } from "./forecast-days"

function item(dt: number, tempMin: number, tempMax: number, icon: string): ForecastItem<"metric"> {
  return {
    dt,
    main: {
      temp: tempMax as ForecastItem<"metric">["main"]["temp"],
      feels_like: tempMax as ForecastItem<"metric">["main"]["feels_like"],
      temp_min: tempMin as ForecastItem<"metric">["main"]["temp_min"],
      temp_max: tempMax as ForecastItem<"metric">["main"]["temp_max"],
      pressure: 1015,
      humidity: 64,
      temp_kf: 0 as ForecastItem<"metric">["main"]["temp_kf"],
    },
    weather: [{ id: 800, main: "Clear", description: "ясно", icon }],
    clouds: { all: 0 },
    wind: { speed: 1 as ForecastItem<"metric">["wind"]["speed"], deg: 10 },
    pop: 0,
    sys: { pod: "d" },
    dt_txt: "2022-08-30 12:00:00",
  }
}

test("groups 3-hour slots into local calendar days", () => {
  const tz = 7200
  const day1noon = 1661853600
  const day1eve = 1661871600
  const day2noon = 1661940000
  const days = groupForecastDays(
    [
      item(day1noon, 10, 20, "01d"),
      item(day1eve, 8, 18, "02d"),
      item(day2noon, 12, 22, "10d"),
    ],
    tz,
  )
  expect(days).toHaveLength(2)
  expect(days[0]?.date).toBe("2022-08-30")
  expect(days[0]?.min).toBe(8)
  expect(days[0]?.max).toBe(20)
  expect(days[0]?.slots).toHaveLength(2)
  expect(days[0]?.icon).toBe("01d")
  expect(days[1]?.date).toBe("2022-08-31")
  expect(days[1]?.icon).toBe("10d")
})

test("caps at 5 days", () => {
  const tz = 0
  const start = 1_661_836_800
  const list = Array.from({ length: 16 }, (_, i) => item(start + i * 86400, 1, 2, "01d"))
  expect(groupForecastDays(list, tz)).toHaveLength(5)
})
```

Даты `2022-08-30` / `2022-08-31` проверь один раз в Node (`new Date((1661853600+7200)*1000).toISOString()`) и поправь ожидаемые строки, если TZ-арифметика даст соседний день. Источник чисел — фикстура `docs/forecast5.md` / `lib/openweather/schemas/forecast.test.ts` (`dt: 1661871600`, `timezone: 7200`).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/weather/forecast-days.test.ts`

Expected: FAIL — cannot find module `./forecast-days`

- [ ] **Step 3: Write implementation**

Create `lib/weather/forecast-days.ts`:

```ts
import type { ForecastItem } from "@/lib/openweather"

export type ForecastDay = {
  date: string
  min: number
  max: number
  icon: string
  description: string
  slots: ForecastItem<"metric">[]
}

function localDate(dt: number, timezoneOffsetSeconds: number): string {
  const shifted = new Date((dt + timezoneOffsetSeconds) * 1000)
  const year = shifted.getUTCFullYear()
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0")
  const day = String(shifted.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function localHour(dt: number, timezoneOffsetSeconds: number): number {
  return new Date((dt + timezoneOffsetSeconds) * 1000).getUTCHours()
}

export function groupForecastDays(
  list: ForecastItem<"metric">[],
  timezoneOffsetSeconds: number,
): ForecastDay[] {
  const byDate = new Map<string, ForecastItem<"metric">[]>()
  for (const slot of list) {
    const date = localDate(slot.dt, timezoneOffsetSeconds)
    const bucket = byDate.get(date)
    if (bucket) bucket.push(slot)
    else byDate.set(date, [slot])
  }

  return [...byDate.entries()].slice(0, 5).map(([date, slots]) => {
    const noon = slots.reduce((best, slot) => {
      const bestDist = Math.abs(localHour(best.dt, timezoneOffsetSeconds) - 12)
      const nextDist = Math.abs(localHour(slot.dt, timezoneOffsetSeconds) - 12)
      return nextDist < bestDist ? slot : best
    }, slots[0]!)
    return {
      date,
      min: Math.min(...slots.map((slot) => slot.main.temp_min)),
      max: Math.max(...slots.map((slot) => slot.main.temp_max)),
      icon: noon.weather[0]!.icon,
      description: noon.weather[0]!.description,
      slots,
    }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/weather/forecast-days.test.ts`

Expected: PASS. Если даты не совпали — поправь ожидания под фактический `localDate`, не подгоняй формулу под UTC браузера.

- [ ] **Step 5: Commit**

```bash
git add lib/weather/forecast-days.ts lib/weather/forecast-days.test.ts
git commit -m "группировка прогноза по локальным дням"
```

---

### Task 5: handlers + server client

**Files:**
- Create: `lib/weather/server.ts`
- Create: `lib/weather/handlers.ts`
- Create: `lib/weather/handlers.test.ts`
- Create: `lib/weather/fixtures.ts`

**Interfaces:**
- Consumes: `createOpenWeatherClient`, `OpenWeatherClient`, types from SDK; `mapOpenWeatherError`, `unavailableError`, `WEATHER_COPY`; `placeFromGeo`
- Produces:
  - `export type ApiOk<T> = { ok: true; data: T }`
  - `export type ApiErr = { ok: false; error: { type: string; message: string } }`
  - `export type HandlerResult<T> = { status: number; body: ApiOk<T> | ApiErr }`
  - `export function getWeatherClient(): OpenWeatherClient<"metric"> | null`
  - `export function handleGeo(params: URLSearchParams, client: OpenWeatherClient<"metric"> | null): Promise<HandlerResult<GeoPlace[]>>`
  - `export function handleGeoReverse(params: URLSearchParams, client: OpenWeatherClient<"metric"> | null): Promise<HandlerResult<GeoPlace>>`
  - `export function handleWeather(params: URLSearchParams, client: OpenWeatherClient<"metric"> | null): Promise<HandlerResult<{ current: CurrentWeather<"metric">; forecast: Forecast<"metric">; air: AirPollution }>>`

Правила:

- `client === null` → `unavailableError()` (503).
- `handleGeo`: нет `q` или `q.trim() === ""` → 400 validation + `GEO_FAILED`. Иначе `geo.direct({ q: q.trim(), limit: 5 })`. Пустой массив → 404 http + `NOT_FOUND`.
- `handleGeoReverse`: распарсить `lat`/`lon` как finite number; иначе 400. `geo.reverse({ lat, lon, limit: 1 })`. Пустой массив → 404 + `NOT_FOUND`. Успех — **первый** элемент, не массив.
- `handleWeather`: те же lat/lon. Параллельно `current.get`, `forecast.get`, `airPollution.current`. Любой `isErr()` → весь роут с этой ошибкой, без частичного `data`.
- Тело успеха/ошибки не содержит подстроку ключа. В тестах ключ `"secret-appid-key"`.

- [ ] **Step 1: Write fixtures + failing tests**

Create `lib/weather/fixtures.ts` — скопируй минимальные валидные объекты из `lib/openweather/client.test.ts` (current), `lib/openweather/schemas/forecast.test.ts` (forecast), и air:

```ts
export const currentFixture = {
  coord: { lon: 10.99, lat: 44.34 },
  weather: [{ id: 501, main: "Rain", description: "ливень", icon: "10d" }],
  base: "stations",
  main: { temp: 20, feels_like: 19, temp_min: 18, temp_max: 22, pressure: 1015, humidity: 64 },
  wind: { speed: 0.62, deg: 349 },
  clouds: { all: 100 },
  dt: 1661870592,
  sys: { country: "IT", sunrise: 1661834187, sunset: 1661882248 },
  timezone: 7200,
  id: 3163858,
  name: "Zocca",
  cod: 200,
}

export const forecastFixture = {
  cod: "200",
  message: 0,
  cnt: 1,
  list: [
    {
      dt: 1661871600,
      main: {
        temp: 20,
        feels_like: 19,
        temp_min: 18,
        temp_max: 22,
        pressure: 1015,
        humidity: 64,
        temp_kf: 0,
      },
      weather: [{ id: 501, main: "Rain", description: "ливень", icon: "10d" }],
      clouds: { all: 100 },
      wind: { speed: 0.62, deg: 349 },
      pop: 0.32,
      sys: { pod: "d" },
      dt_txt: "2022-08-30 15:00:00",
    },
  ],
  city: {
    id: 3163858,
    name: "Zocca",
    coord: { lat: 44.34, lon: 10.99 },
    country: "IT",
    population: 4593,
    timezone: 7200,
    sunrise: 1661834187,
    sunset: 1661882248,
  },
}

export const airFixture = {
  coord: [44.34, 10.99],
  list: [
    {
      dt: 1661870592,
      main: { aqi: 2 },
      components: { co: 1, no: 1, no2: 1, o3: 1, so2: 1, pm2_5: 5, pm10: 8, nh3: 1 },
    },
  ],
}

export const geoFixture = {
  name: "Москва",
  lat: 55.7558,
  lon: 37.6173,
  country: "RU",
}
```

Create `lib/weather/handlers.test.ts`:

```ts
import { errAsync, okAsync } from "neverthrow"
import { describe, expect, test, vi } from "vitest"
import type { OpenWeatherClient } from "@/lib/openweather"
import { WEATHER_COPY } from "./errors"
import { airFixture, currentFixture, forecastFixture, geoFixture } from "./fixtures"
import { handleGeo, handleGeoReverse, handleWeather } from "./handlers"

const secret = "secret-appid-key"

function client(partial: Partial<OpenWeatherClient<"metric">>): OpenWeatherClient<"metric"> {
  return {
    current: { get: vi.fn() },
    forecast: { get: vi.fn() },
    geo: {
      direct: vi.fn(),
      zip: vi.fn(),
      reverse: vi.fn(),
    },
    airPollution: {
      current: vi.fn(),
      forecast: vi.fn(),
      history: vi.fn(),
    },
    ...partial,
  } as OpenWeatherClient<"metric">
}

test("geo without q is 400", async () => {
  const result = await handleGeo(new URLSearchParams(), client({}))
  expect(result.status).toBe(400)
  expect(result.body.ok).toBe(false)
})

test("geo success and empty", async () => {
  const found = client({
    geo: { direct: () => okAsync([geoFixture]), zip: vi.fn(), reverse: vi.fn() },
  })
  const ok = await handleGeo(new URLSearchParams("q=москва"), found)
  expect(ok).toEqual({ status: 200, body: { ok: true, data: [geoFixture] } })

  const none = client({
    geo: { direct: () => okAsync([]), zip: vi.fn(), reverse: vi.fn() },
  })
  const empty = await handleGeo(new URLSearchParams("q=zzz"), none)
  expect(empty.status).toBe(404)
  expect(empty.body).toEqual({
    ok: false,
    error: { type: "http", message: WEATHER_COPY.NOT_FOUND },
  })
})

test("reverse without lat is 400; first place on success", async () => {
  const bad = await handleGeoReverse(new URLSearchParams("lon=1"), client({}))
  expect(bad.status).toBe(400)

  const good = client({
    geo: {
      direct: vi.fn(),
      zip: vi.fn(),
      reverse: () => okAsync([geoFixture, { ...geoFixture, name: "Other" }]),
    },
  })
  const result = await handleGeoReverse(new URLSearchParams("lat=55.7558&lon=37.6173"), good)
  expect(result.body).toEqual({ ok: true, data: geoFixture })
})

test("weather missing lat is 400; any sdk err fails all", async () => {
  const missing = await handleWeather(new URLSearchParams("lon=1"), client({}))
  expect(missing.status).toBe(400)

  const failing = client({
    current: { get: () => okAsync(currentFixture as never) },
    forecast: { get: () => errAsync({ type: "network", cause: "x" }) },
    airPollution: { current: () => okAsync(airFixture as never), forecast: vi.fn(), history: vi.fn() },
  })
  const result = await handleWeather(new URLSearchParams("lat=1&lon=2"), failing)
  expect(result.body.ok).toBe(false)
  if (!result.body.ok) expect(result.body.error.message).toBe(WEATHER_COPY.OFFLINE)
})

test("weather success and body has no api key", async () => {
  const good = client({
    current: { get: () => okAsync(currentFixture as never) },
    forecast: { get: () => okAsync(forecastFixture as never) },
    airPollution: { current: () => okAsync(airFixture as never), forecast: vi.fn(), history: vi.fn() },
  })
  const result = await handleWeather(new URLSearchParams("lat=44.34&lon=10.99"), good)
  expect(result.status).toBe(200)
  expect(JSON.stringify(result.body)).not.toContain(secret)
  expect(result.body.ok).toBe(true)
})

test("null client is 503", async () => {
  const result = await handleGeo(new URLSearchParams("q=x"), null)
  expect(result.status).toBe(503)
  expect(result.body).toEqual({
    ok: false,
    error: { type: "http", message: WEATHER_COPY.UNAVAILABLE },
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/weather/handlers.test.ts`

Expected: FAIL — cannot find module `./handlers`

- [ ] **Step 3: Implement server + handlers**

`lib/weather/server.ts`:

```ts
import { createOpenWeatherClient, type OpenWeatherClient } from "@/lib/openweather"

export function getWeatherClient(): OpenWeatherClient<"metric"> | null {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY
  if (!apiKey) return null
  return createOpenWeatherClient({ apiKey, units: "metric", lang: "ru" })
}
```

`lib/weather/handlers.ts` — реализуй три функции по правилам выше. Парс координат:

```ts
function readCoord(params: URLSearchParams): { lat: number; lon: number } | null {
  const lat = Number(params.get("lat"))
  const lon = Number(params.get("lon"))
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lon }
}
```

Ошибка SDK:

```ts
function fail(error: OpenWeatherError, surface: WeatherSurface): HandlerResult<never> {
  const mapped = mapOpenWeatherError(error, surface)
  return { status: mapped.status, body: { ok: false, error: { type: mapped.type, message: mapped.message } } }
}
```

`handleWeather`: `const [current, forecast, air] = await Promise.all([...])`. Если `current.isErr()` — `fail(current.error, "weather")`, то же для остальных, в этом порядке.

- [ ] **Step 4: Run tests**

Run: `pnpm test lib/weather`

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add lib/weather/server.ts lib/weather/handlers.ts lib/weather/handlers.test.ts lib/weather/fixtures.ts
git commit -m "обработчики geo и weather без ключа в ответе"
```

---

### Task 6: Route Handlers + PWA shell

**Files:**
- Create: `app/api/geo/route.ts`
- Create: `app/api/geo/reverse/route.ts`
- Create: `app/api/weather/route.ts`
- Create: `app/manifest.ts`
- Create: `app/sw.ts`
- Create: `app/icon.tsx`
- Create: `public/icon-192.svg` and reference PNG via `app/icon.tsx` + apple icon; also add `public/icon-192.png` / `public/icon-512.png` as simple generated PNGs (see step)
- Modify: `next.config.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `getWeatherClient`, `handleGeo`, `handleGeoReverse`, `handleWeather`
- Produces: HTTP GET endpoints; installable manifest name `Погода`, `display: "standalone"`, `start_url: "/"`; Serwist SW that does **not** cache `/api/`

Документация: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`, `.../01-metadata/manifest.md`, `.../02-guides/progressive-web-apps.md`. Serwist: `@serwist/next` default export `withSerwistInit`, worker `defaultCache` из `@serwist/next/worker`.

- [ ] **Step 1: Thin routes**

`app/api/geo/route.ts`:

```ts
import { getWeatherClient } from "@/lib/weather/server"
import { handleGeo } from "@/lib/weather/handlers"

export async function GET(request: Request) {
  const { status, body } = await handleGeo(new URL(request.url).searchParams, getWeatherClient())
  return Response.json(body, { status })
}
```

`app/api/geo/reverse/route.ts` — то же с `handleGeoReverse`.

`app/api/weather/route.ts` — то же с `handleWeather`.

- [ ] **Step 2: Manifest + icons + layout lang**

`app/manifest.ts`:

```ts
import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Погода",
    short_name: "Погода",
    description: "Текущая погода, прогноз и качество воздуха",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1220",
    theme_color: "#0B1220",
    lang: "ru",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  }
}
```

`app/icon.tsx` — `ImageResponse` 32×32, круг `#C4D4C0` на `#0B1220`.

Иконки 192/512: сгенерируй одним скриптом через `npx --yes pngjs-cli` **нельзя** (нет такого). Сделай так: маленький Node-скрипт без новых зависимостей, запиши минимальный валидный PNG через ручной IHDR+IDAT (или используй уже установленный пакет, если есть). Проще и допустимо: SVG в `public/icon-192.svg` **и** скопируй favicon не подойдёт для install. Используй `sharp` только если уже в дереве. Иначе — `pnpm add -D @resvg/resvg-js` не добавляй. Напиши SVG и конвертни так:

```bash
# если есть rsvg-convert или convert — используй
# иначе создай app/opengraph-image.tsx не для этого
```

Практичный путь без новых deps: в `public/` положи два PNG, сгенерированных из `ImageResponse` разовым `node` **не выйдет** без next/og runtime. Допустимая замена: `icons` в манифесте указывают на `/icon-192.png`, а файлы — это 192×192 и 512×512 PNG, нарисованные как однотонный `#0B1220` с кругом. Можно закодировать крошечный PNG в base64 в плане и сделать `Buffer.from(..., "base64")` в одноразовом `node -e` и записать файлы. Сделай это.

Также `export const metadata` в `app/layout.tsx`: `title: "Погода"`, `html lang="ru"`. Подключи `appleWebApp: { capable: true, title: "Погода" }`.

- [ ] **Step 3: Serwist**

`next.config.ts` (webpack-плагин `@serwist/next` 9.5, не turbopack wrapper):

```ts
import withSerwistInit from "@serwist/next"
import type { NextConfig } from "next"

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  reloadOnOnline: false,
})

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ]
  },
}

export default withSerwist(nextConfig)
```

`app/sw.ts`:

```ts
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { NetworkOnly, Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
})

serwist.addEventListeners()
```

NetworkOnly на `/api/` стоит первым: данные офлайн только из `localStorage`.

- [ ] **Step 4: Typecheck routes/PWA files**

Run: `pnpm typecheck`

Expected: PASS (или поправить типы SW / ImageResponse).

- [ ] **Step 5: Commit**

```bash
git add app/api app/manifest.ts app/sw.ts app/icon.tsx app/layout.tsx next.config.ts public/icon-192.png public/icon-512.png
git commit -m "api-роуты и оболочка pwa на serwist"
```

Не коммить `public/sw.js`, если withSerwist пишет его в `public/` при build — добавь `public/sw.js` и `public/swe-worker-*.js` в `.gitignore`.

---

### Task 7: UI экрана погоды

**Files:**
- Create: `hooks/use-weather.ts`
- Create: `components/weather/weather-app.tsx`
- Create: `components/weather/search-empty.tsx`
- Create: `components/weather/city-screen.tsx`
- Create: `components/weather/place-chips.tsx`
- Create: `components/weather/current-hero.tsx`
- Create: `components/weather/facts-row.tsx`
- Create: `components/weather/aqi-card.tsx`
- Create: `components/weather/forecast-list.tsx`
- Create: `components/weather/offline-banner.tsx`
- Create: `components/weather/weather-backdrop.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Install React Bits (Tailwind variants only):
  - `pnpm dlx shadcn@latest add @reactbits-starter/silk-waves-tw @reactbits-starter/fog-sphere-tw @reactbits-starter/rising-particles-tw @reactbits-pro/empty-state-1 @reactbits-pro/card-1`
  - После install прочитай `export` в каждом файле и импортируй соответственно (маркетинг/empty-state — проверить; App UI card — default export).

**Interfaces:**
- Consumes: storage, handlers' HTTP, `groupForecastDays`, `WEATHER_COPY`, `placeFromGeo`, `offlineBanner`
- Produces: клиентский хук + экран

Нет тестов в этом таске.

#### Визуал (не дефолтный AI-набор)

Палитра в `:root` / `.dark` дополнительно к shadcn:

- `--ink: #0B1220`
- `--dusk: #1A2744`
- `--mercury: #C4D4C0`
- `--flare: #E8A04A` — только температура
- `--fogline: #8BA3B5`
- `--glass: color-mix(in oklab, #E8F0F4 12%, transparent)`

Шрифты: температура — `Fraunces` (`next/font/google`, `variable: "--font-display"`), остальное Geist / Geist Mono. `lang="ru"` уже стоит.

Сигнатура: огромная цифра температуры как столбик термометра (узкий трекинг, `font-display`, цвет `--flare`), подпись города мелким `uppercase tracking-[0.18em]` цветом `--fogline`. Не карточка «big number + 3 stats» как герой.

Фон (один на экран, opacity ≤ 0.35, `prefers-reduced-motion: reduce` → статичный градиент `--ink`→`--dusk`):

| `weather[0].main` | компонент |
| --- | --- |
| Clear | `silk-waves-tw`, цвета `--ink` / `--dusk` / `--mercury` |
| Clouds, Atmosphere | `fog-sphere-tw` |
| Rain, Drizzle, Thunderstorm, Snow | `rising-particles-tw`, холодные `--fogline` |

Пустой поиск: отредактированный `empty-state-1` — заголовок «Куда смотрим», поле поиска, «Рядом». Не оставляй английский placeholder блока.

AQI: `card-1` переписать: индекс словами `Хорошо | Удовлетворительно | Умеренно | Плохо | Очень плохо` для 1–5; `pm2_5`, `pm10`, `no2`, `o3`.

Гармонизация: один контейнер `max-w-lg mx-auto px-4`, радиус карточек `rounded-2xl`, факты/прогноз/AQI — одно стекло `--glass`. Кнопки — существующий `@/components/ui/button`.

- [ ] **Step 1: Install React Bits items**

```bash
pnpm dlx shadcn@latest add @reactbits-starter/silk-waves-tw @reactbits-starter/fog-sphere-tw @reactbits-starter/rising-particles-tw @reactbits-pro/empty-state-1 @reactbits-pro/card-1
```

Прочитай export-строки. Не удаляй `"use client"`. WebGL-фоны оберни в `absolute inset-0` с явными width/height.

- [ ] **Step 2: Hook `hooks/use-weather.ts`**

Клиентский хук:

- На маунте `readStore(localStorage)` → state.
- Если `activeId` и snapshot есть — показать, затем `refresh(active)`.
- Если `activeId` без snapshot — `loading` + `refresh`.
- `selectPlace` → write + `refresh` (не звёздочка).
- `refresh(place)` → `GET /api/weather?lat&lon`. Успех → `putSnapshot` + `writeStore`. Сеть + snapshot → `banner = offlineBanner(fetchedAt)`. Сеть без snapshot → `fatal = WEATHER_COPY.OFFLINE`.
- Переключение чипа: если snapshot `isFresh` — показать и refresh в фоне; иначе показать snapshot (если есть) как загрузку и refresh.
- `star` / `unstar` по правилам storage; `error === "limit"` → toast `FAVORITE_LIMIT`.
- `search(q)`: debounce 300 ms, `q.trim().length >= 2`, иначе не fetch. `GET /api/geo?q=`.
- `nearby`: `navigator.geolocation.getCurrentPosition` timeout 10000 → `GET /api/geo/reverse` → как `selectPlace`. deny/timeout → toast `GEOLOCATION_FAILED`, `activeId` не трогать.

Типы ответа API на клиенте: `{ ok: true; data: T } | { ok: false; error: { type: string; message: string } }`.

- [ ] **Step 3: Components**

`search-empty.tsx`: инпут, список до 5 (`name`, `state`, `country`), кнопка «Рядом», чипы если `places.length > 0`.

`city-screen.tsx`: шапка (поиск на `md+` поле, на узком — иконка, раскрывает то же поле), «Рядом», звезда (`Star` lucide, fill если в `places`), чипы; герой; факты; AQI; прогноз.

`facts-row.tsx`: влажность `%`, ветер `N м/с` + румб из `deg` (С/СВ/В/ЮВ/Ю/ЮЗ/З/СЗ), давление `N гПа`, восход/закат через `dt + timezone` тем же приёмом, что `formatFetchedAt` (локаль города: `(unix + timezone) * 1000` + UTC hours/minutes).

`forecast-list.tsx`: 5 дней свёрнуты, клик раскрывает слоты `HH:mm` + temp + icon. Один открытый день.

`offline-banner.tsx`: текст баннера, без apologizing.

`weather-app.tsx`: если `!activeId` → empty, иначе city. Toast — фиксированная плашка снизу.

`page.tsx`:

```ts
import { WeatherApp } from "@/components/weather/weather-app"

export default function Page() {
  return <WeatherApp />
}
```

- [ ] **Step 4: Verify locally**

Run: `pnpm lint && pnpm typecheck && pnpm test`

Expected: PASS. Вручную: `pnpm dev`, поиск «Москва», прогноз, звезда, reload, DevTools Offline → баннер со временем.

- [ ] **Step 5: Commit**

```bash
git add hooks/use-weather.ts components/weather app/page.tsx app/globals.css components/react-bits components/blocks package.json pnpm-lock.yaml
git commit -m "экран погоды: поиск, снимок, прогноз и aqi"
```

Не добавляй `.env.local`.

---

## Self-review

1. **Spec coverage**
   - current + forecast + air.current + 8 избранных → Task 5–7
   - RU / metric / search-first / «Рядом» → Task 5, 7
   - last snapshot offline + fetchedAt banner → Task 1, 3, 7
   - one route `/` → Task 7
   - key only on server → Task 5–6
   - Serwist shell, API NetworkOnly → Task 6
   - error copy verbatim → Task 1, 5, 7
   - tests listed in spec → Tasks 1–5
   - `catalog` — явное дополнение, чтобы имя города жило без избранного

2. **Placeholders:** дат в forecast тесте могут потребовать одной правки после первого прогона — это указано, не TBD.

3. **Types:** `PlaceId`, `WeatherStore`, `HandlerResult`, `MappedWeatherError`, `ForecastDay` согласованы между задачами.
