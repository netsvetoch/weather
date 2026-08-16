# OpenWeatherMap Free API SDK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In-app typed SDK at `lib/openweather` for the free OpenWeatherMap JSON APIs (current, 5-day forecast, geocoding, air pollution).

**Architecture:** `createOpenWeatherClient` factory with namespaced methods. Zod 4 schemas are the runtime source of truth. Every call returns `ResultAsync<T, OpenWeatherError>`. Response temperatures/wind speeds are Zod-branded from the resolved `units` (client default, overridable per request). HTTP is a single `request` pipeline with injected `fetch`.

**Tech Stack:** TypeScript, Zod 4.4, neverthrow 8, Vitest 4. Optional type-fest/ts-extras only if a local type would be longer — this plan does not need them.

## Global Constraints

- JSON only. Never send `mode`. No XML, HTML, JSONP.
- Official endpoints only: weather/forecast/air by `lat`/`lon`; geocoding via `/geo/1.0/direct`, `/zip`, `/reverse`. No deprecated `q`/`zip`/`id` on weather or forecast.
- Default `baseUrl` is `https://api.openweathermap.org`. Strip trailing slash. Paths start with `/`.
- `appid` comes only from client config, never from a call.
- Methods return `ResultAsync`. Do not throw for validation, network, HTTP, or parse failures.
- No retries, no cache.
- No comments in production code.
- Match existing style: double quotes, no semicolons.
- Tests: Vitest, injected `fetch` only — no live OWM calls.
- Type tests use vitest `expectTypeOf` in `*.test.ts` next to the code.

## File map

Create:

- `vitest.config.ts` — test runner
- `lib/openweather/types/units.ts` — `Units`, brands, schema factories
- `lib/openweather/types/units.test.ts`
- `lib/openweather/types/lang.ts` — `Lang` union
- `lib/openweather/types/lang.test.ts`
- `lib/openweather/errors.ts` — `OpenWeatherError`
- `lib/openweather/schemas/common.ts` — shared response pieces + coord input
- `lib/openweather/schemas/common.test.ts`
- `lib/openweather/schemas/current.ts` — current input + response factory
- `lib/openweather/schemas/current.test.ts`
- `lib/openweather/schemas/forecast.ts` — forecast input + response factory
- `lib/openweather/schemas/forecast.test.ts`
- `lib/openweather/schemas/geocoding.ts` — geo input + response
- `lib/openweather/schemas/geocoding.test.ts`
- `lib/openweather/schemas/air-pollution.ts` — air input + response
- `lib/openweather/schemas/air-pollution.test.ts`
- `lib/openweather/schemas/error.ts` — OWM error body
- `lib/openweather/schemas/error.test.ts`
- `lib/openweather/http.ts` — `buildUrl`, `parseInput`, `request`
- `lib/openweather/http.test.ts`
- `lib/openweather/test/helpers.ts` — mock `fetch` / JSON `Response`
- `lib/openweather/endpoints/current.ts`
- `lib/openweather/endpoints/current.test.ts`
- `lib/openweather/endpoints/forecast.ts`
- `lib/openweather/endpoints/forecast.test.ts`
- `lib/openweather/endpoints/geocoding.ts`
- `lib/openweather/endpoints/geocoding.test.ts`
- `lib/openweather/endpoints/air-pollution.ts`
- `lib/openweather/endpoints/air-pollution.test.ts`
- `lib/openweather/client.ts` — `createOpenWeatherClient`
- `lib/openweather/client.test.ts`
- `lib/openweather/index.ts` — public exports

Modify:

- `package.json` — add `"test": "vitest run"` and `"test:watch": "vitest"`

Do not create endpoint files as public API. Do not add XML/HTML support. Do not publish a package.

---

### Task 1: Vitest + units + lang + errors

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts only)
- Create: `lib/openweather/types/units.ts`
- Create: `lib/openweather/types/units.test.ts`
- Create: `lib/openweather/types/lang.ts`
- Create: `lib/openweather/types/lang.test.ts`
- Create: `lib/openweather/errors.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `unitsSchema`, `type Units = "standard" | "metric" | "imperial"`
  - `type Temperature<U extends Units>`
  - `type WindSpeed<U extends Units>`
  - `type ResolveUnits<ClientU extends Units, R>`
  - `temperatureSchema<U extends Units>(units: U): z.ZodType<Temperature<U>>`
  - `windSpeedSchema<U extends Units>(units: U): z.ZodType<WindSpeed<U>>`
  - `langSchema`, `type Lang`
  - `type OpenWeatherError`

- [ ] **Step 1: Add Vitest scripts and config**

In `package.json` `scripts`, add after `"typecheck"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
})
```

- [ ] **Step 2: Write failing units tests**

Create `lib/openweather/types/units.test.ts`:

```ts
import { describe, expect, expectTypeOf, test } from "vitest"
import {
  temperatureSchema,
  type Temperature,
  type ResolveUnits,
  type Units,
} from "./units"

describe("temperatureSchema", () => {
  test("brands metric as Celsius", () => {
    const value = temperatureSchema("metric").parse(8.48)
    expect(value).toBe(8.48)
    expectTypeOf(value).toEqualTypeOf<Temperature<"metric">>()
  })

  test("brands imperial as Fahrenheit", () => {
    const value = temperatureSchema("imperial").parse(47.26)
    expectTypeOf(value).toEqualTypeOf<Temperature<"imperial">>()
  })

  test("brands standard as Kelvin", () => {
    const value = temperatureSchema("standard").parse(281.63)
    expectTypeOf(value).toEqualTypeOf<Temperature<"standard">>()
  })
})

describe("ResolveUnits", () => {
  test("keeps client units when request has none", () => {
    expectTypeOf<ResolveUnits<"metric", { lat: number }>>().toEqualTypeOf<"metric">()
  })

  test("request units override client units", () => {
    expectTypeOf<
      ResolveUnits<"metric", { units: "imperial" }>
    >().toEqualTypeOf<"imperial">()
  })
})

test("Celsius is not assignable to Fahrenheit", () => {
  expectTypeOf<Temperature<"metric">>().not.toMatchTypeOf<Temperature<"imperial">>()
  expectTypeOf<Units>().toEqualTypeOf<"standard" | "metric" | "imperial">()
})
```

- [ ] **Step 3: Run units test to verify it fails**

Run: `pnpm test lib/openweather/types/units.test.ts`

Expected: FAIL — cannot find module `./units`

- [ ] **Step 4: Implement units**

Create `lib/openweather/types/units.ts`:

```ts
import { z } from "zod"

export const unitsSchema = z.enum(["standard", "metric", "imperial"])
export type Units = z.infer<typeof unitsSchema>

export type Temperature<U extends Units> = U extends "metric"
  ? number & z.$brand<"Celsius">
  : U extends "imperial"
    ? number & z.$brand<"Fahrenheit">
    : number & z.$brand<"Kelvin">

export type WindSpeed<U extends Units> = U extends "imperial"
  ? number & z.$brand<"mph">
  : number & z.$brand<"m/s">

export type ResolveUnits<ClientU extends Units, R> = R extends {
  units: infer RU extends Units
}
  ? RU
  : ClientU

export function temperatureSchema<U extends Units>(
  units: U,
): z.ZodType<Temperature<U>> {
  if (units === "metric") {
    return z.number().brand<"Celsius">() as z.ZodType<Temperature<U>>
  }
  if (units === "imperial") {
    return z.number().brand<"Fahrenheit">() as z.ZodType<Temperature<U>>
  }
  return z.number().brand<"Kelvin">() as z.ZodType<Temperature<U>>
}

export function windSpeedSchema<U extends Units>(
  units: U,
): z.ZodType<WindSpeed<U>> {
  if (units === "imperial") {
    return z.number().brand<"mph">() as z.ZodType<WindSpeed<U>>
  }
  return z.number().brand<"m/s">() as z.ZodType<WindSpeed<U>>
}
```

- [ ] **Step 5: Run units tests to verify they pass**

Run: `pnpm test lib/openweather/types/units.test.ts`

Expected: PASS

- [ ] **Step 6: Write failing lang test**

Create `lib/openweather/types/lang.test.ts`:

```ts
import { expect, test } from "vitest"
import { langSchema } from "./lang"

test("accepts documented aliases", () => {
  expect(langSchema.parse("ru")).toBe("ru")
  expect(langSchema.parse("sp")).toBe("sp")
  expect(langSchema.parse("es")).toBe("es")
  expect(langSchema.parse("zh_cn")).toBe("zh_cn")
})

test("rejects unknown lang", () => {
  expect(langSchema.safeParse("xx").success).toBe(false)
})
```

- [ ] **Step 7: Run lang test to verify it fails**

Run: `pnpm test lib/openweather/types/lang.test.ts`

Expected: FAIL — cannot find module `./lang`

- [ ] **Step 8: Implement lang and errors**

Create `lib/openweather/types/lang.ts`:

```ts
import { z } from "zod"

export const langSchema = z.enum([
  "sq",
  "af",
  "ar",
  "az",
  "eu",
  "be",
  "bg",
  "ca",
  "zh_cn",
  "zh_tw",
  "hr",
  "cz",
  "da",
  "nl",
  "en",
  "fi",
  "fr",
  "gl",
  "de",
  "el",
  "he",
  "hi",
  "hu",
  "is",
  "id",
  "it",
  "ja",
  "kr",
  "ku",
  "la",
  "lt",
  "mk",
  "no",
  "fa",
  "pl",
  "pt",
  "pt_br",
  "ro",
  "ru",
  "sr",
  "sk",
  "sl",
  "sp",
  "es",
  "sv",
  "se",
  "th",
  "tr",
  "ua",
  "uk",
  "vi",
  "zu",
])

export type Lang = z.infer<typeof langSchema>
```

Create `lib/openweather/errors.ts`:

```ts
import type { z } from "zod"

export type OpenWeatherError =
  | { type: "validation"; issues: z.core.$ZodIssue[] }
  | { type: "network"; cause: unknown }
  | { type: "http"; status: number; cod?: string | number; message: string }
  | { type: "parse"; issues: z.core.$ZodIssue[] }
```

- [ ] **Step 9: Run lang tests to verify they pass**

Run: `pnpm test lib/openweather/types`

Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add package.json vitest.config.ts lib/openweather/types lib/openweather/errors.ts
git commit -m "типы units, lang и ошибок для owm sdk"
```

---

### Task 2: Shared and input pieces in common schemas

**Files:**
- Create: `lib/openweather/schemas/common.ts`
- Create: `lib/openweather/schemas/common.test.ts`

**Interfaces:**
- Consumes: `Units`, `temperatureSchema`, `windSpeedSchema`, `langSchema`, `unitsSchema` from Task 1
- Produces:
  - `coordSchema` — `{ lon: number, lat: number }`
  - `weatherMainSchema` / `WeatherMain`
  - `weatherIconSchema`
  - `weatherItemSchema`
  - `cloudsSchema` — `{ all: number }` 0–100
  - `rain1hSchema` / `snow1hSchema` / `rain3hSchema` / `snow3hSchema`
  - `windSchema<U extends Units>(units: U)`
  - `latSchema` — number ∈ [-90, 90]
  - `lonSchema` — number ∈ [-180, 180]
  - `coordInputSchema` — `{ lat, lon }`
  - `limitSchema` — int 1–5
  - `cntSchema` — int 1–40
  - `countrySchema` — `/^[A-Za-z]{2}$/`
  - `unixSecondsSchema` — finite number

- [ ] **Step 1: Write failing common schema tests**

Create `lib/openweather/schemas/common.test.ts`:

```ts
import { describe, expect, expectTypeOf, test } from "vitest"
import { windSchema, weatherItemSchema, weatherIconSchema, latSchema, lonSchema, cntSchema, limitSchema, cloudsSchema } from "./common"
import type { WindSpeed } from "../types/units"

describe("weatherItemSchema", () => {
  test("parses a rain item", () => {
    const item = weatherItemSchema.parse({
      id: 501,
      main: "Rain",
      description: "moderate rain",
      icon: "10d",
    })
    expect(item.main).toBe("Rain")
  })

  test("rejects bad icon", () => {
    expect(weatherIconSchema.safeParse("10").success).toBe(false)
  })
})

describe("windSchema", () => {
  test("brands metric speed as m/s", () => {
    const wind = windSchema("metric").parse({ speed: 7.3, deg: 189, gust: 13.48 })
    expectTypeOf(wind.speed).toEqualTypeOf<WindSpeed<"metric">>()
    expect(wind.gust).toBe(13.48)
  })

  test("allows missing gust", () => {
    const wind = windSchema("standard").parse({ speed: 4.1, deg: 80 })
    expect(wind.gust).toBeUndefined()
  })
})

describe("input bounds", () => {
  test("lat must be in [-90, 90]", () => {
    expect(latSchema.safeParse(91).success).toBe(false)
    expect(latSchema.parse(-90)).toBe(-90)
  })

  test("lon must be in [-180, 180]", () => {
    expect(lonSchema.safeParse(181).success).toBe(false)
    expect(lonSchema.parse(180)).toBe(180)
  })

  test("cnt is 1..40", () => {
    expect(cntSchema.safeParse(0).success).toBe(false)
    expect(cntSchema.safeParse(41).success).toBe(false)
    expect(cntSchema.parse(8)).toBe(8)
  })

  test("limit is 1..5", () => {
    expect(limitSchema.safeParse(0).success).toBe(false)
    expect(limitSchema.parse(5)).toBe(5)
  })

  test("clouds.all is 0..100", () => {
    expect(cloudsSchema.safeParse({ all: 101 }).success).toBe(false)
    expect(cloudsSchema.parse({ all: 83 })).toEqual({ all: 83 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/openweather/schemas/common.test.ts`

Expected: FAIL — cannot find module `./common`

- [ ] **Step 3: Implement common schemas**

Create `lib/openweather/schemas/common.ts`:

```ts
import { z } from "zod"
import { langSchema } from "../types/lang"
import {
  type Units,
  type WindSpeed,
  unitsSchema,
  windSpeedSchema,
} from "../types/units"

export { langSchema, unitsSchema }

export const latSchema = z.number().gte(-90).lte(90)
export const lonSchema = z.number().gte(-180).lte(180)
export const coordInputSchema = z.object({
  lat: latSchema,
  lon: lonSchema,
})

export const coordSchema = z.object({
  lon: z.number(),
  lat: z.number(),
})

export const weatherMainSchema = z.enum([
  "Thunderstorm",
  "Drizzle",
  "Rain",
  "Snow",
  "Atmosphere",
  "Clear",
  "Clouds",
])
export type WeatherMain = z.infer<typeof weatherMainSchema>

export const weatherIconSchema = z.string().regex(/^\d{2}[dn]$/)

export const weatherItemSchema = z.object({
  id: z.number(),
  main: weatherMainSchema,
  description: z.string(),
  icon: weatherIconSchema,
})
export type WeatherItem = z.infer<typeof weatherItemSchema>

export const cloudsSchema = z.object({
  all: z.number().gte(0).lte(100),
})

export const rain1hSchema = z.object({ "1h": z.number() })
export const snow1hSchema = z.object({ "1h": z.number() })
export const rain3hSchema = z.object({ "3h": z.number() })
export const snow3hSchema = z.object({ "3h": z.number() })

export function windSchema<U extends Units>(units: U) {
  return z.object({
    speed: windSpeedSchema(units),
    deg: z.number(),
    gust: windSpeedSchema(units).optional(),
  })
}

export type Wind<U extends Units> = {
  speed: WindSpeed<U>
  deg: number
  gust?: WindSpeed<U>
}

export const limitSchema = z.number().int().gte(1).lte(5)
export const cntSchema = z.number().int().gte(1).lte(40)
export const countrySchema = z.string().regex(/^[A-Za-z]{2}$/)
export const unixSecondsSchema = z.number().finite()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test lib/openweather/schemas/common.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/openweather/schemas/common.ts lib/openweather/schemas/common.test.ts
git commit -m "общие zod-схемы owm"
```

---

### Task 3: Current weather schema

**Files:**
- Create: `lib/openweather/schemas/current.ts`
- Create: `lib/openweather/schemas/current.test.ts`

**Interfaces:**
- Consumes: common schemas, `Units`, `Temperature`, `Wind`
- Produces:
  - `currentInputSchema` — `{ lat, lon, units?, lang? }` (no `signal`)
  - `currentWeatherSchema<U extends Units>(units: U): z.ZodType<CurrentWeather<U>>`
  - `type CurrentWeather<U extends Units = "standard">`

- [ ] **Step 1: Write failing current schema tests**

Create `lib/openweather/schemas/current.test.ts`:

```ts
import { describe, expect, expectTypeOf, test } from "vitest"
import { currentInputSchema, currentWeatherSchema } from "./current"
import type { CurrentWeather } from "./current"
import type { Temperature } from "../types/units"

const fixture = {
  coord: { lon: 10.99, lat: 44.34 },
  weather: [
    { id: 501, main: "Rain", description: "moderate rain", icon: "10d" },
  ],
  base: "stations",
  main: {
    temp: 298.48,
    feels_like: 298.74,
    temp_min: 297.56,
    temp_max: 300.05,
    pressure: 1015,
    humidity: 64,
    sea_level: 1015,
    grnd_level: 933,
  },
  visibility: 10000,
  wind: { speed: 0.62, deg: 349, gust: 1.18 },
  rain: { "1h": 3.16 },
  clouds: { all: 100 },
  dt: 1661870592,
  sys: {
    type: 2,
    id: 2075663,
    country: "IT",
    sunrise: 1661834187,
    sunset: 1661882248,
  },
  timezone: 7200,
  id: 3163858,
  name: "Zocca",
  cod: 200,
}

describe("currentWeatherSchema", () => {
  test("parses the docs fixture as Kelvin", () => {
    const parsed = currentWeatherSchema("standard").parse(fixture)
    expect(parsed.name).toBe("Zocca")
    expect(parsed.rain?.["1h"]).toBe(3.16)
    expectTypeOf(parsed.main.temp).toEqualTypeOf<Temperature<"standard">>()
    expectTypeOf(parsed).toEqualTypeOf<CurrentWeather<"standard">>()
  })

  test("allows missing rain and optional main pressures", () => {
    const { rain, main, ...rest } = fixture
    const slimMain = {
      temp: main.temp,
      feels_like: main.feels_like,
      temp_min: main.temp_min,
      temp_max: main.temp_max,
      pressure: main.pressure,
      humidity: main.humidity,
    }
    expect(currentWeatherSchema("metric").parse({ ...rest, main: slimMain }).rain).toBeUndefined()
  })

  test("rejects empty weather array", () => {
    expect(
      currentWeatherSchema("standard").safeParse({ ...fixture, weather: [] }).success,
    ).toBe(false)
  })
})

describe("currentInputSchema", () => {
  test("accepts lat lon", () => {
    expect(currentInputSchema.parse({ lat: 44.34, lon: 10.99 })).toEqual({
      lat: 44.34,
      lon: 10.99,
    })
  })

  test("rejects out of range lat", () => {
    expect(currentInputSchema.safeParse({ lat: 100, lon: 10 }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/openweather/schemas/current.test.ts`

Expected: FAIL — cannot find module `./current`

- [ ] **Step 3: Implement current schemas**

Create `lib/openweather/schemas/current.ts`:

```ts
import { z } from "zod"
import {
  cloudsSchema,
  coordInputSchema,
  coordSchema,
  langSchema,
  rain1hSchema,
  snow1hSchema,
  unitsSchema,
  weatherItemSchema,
  windSchema,
  type Wind,
} from "./common"
import type { Temperature, Units } from "../types/units"
import { temperatureSchema } from "../types/units"

export const currentInputSchema = coordInputSchema.extend({
  units: unitsSchema.optional(),
  lang: langSchema.optional(),
})

export type CurrentWeather<U extends Units = "standard"> = {
  coord: { lon: number; lat: number }
  weather: Array<{
    id: number
    main: z.infer<typeof weatherItemSchema>["main"]
    description: string
    icon: string
  }>
  base: string
  main: {
    temp: Temperature<U>
    feels_like: Temperature<U>
    temp_min: Temperature<U>
    temp_max: Temperature<U>
    pressure: number
    humidity: number
    sea_level?: number
    grnd_level?: number
  }
  visibility?: number
  wind: Wind<U>
  rain?: { "1h": number }
  snow?: { "1h": number }
  clouds: { all: number }
  dt: number
  sys: {
    type?: number
    id?: number
    message?: number | string
    country: string
    sunrise: number
    sunset: number
  }
  timezone: number
  id: number
  name: string
  cod: number
}

export function currentWeatherSchema<U extends Units>(
  units: U,
): z.ZodType<CurrentWeather<U>> {
  return z.object({
    coord: coordSchema,
    weather: z.array(weatherItemSchema).min(1),
    base: z.string(),
    main: z.object({
      temp: temperatureSchema(units),
      feels_like: temperatureSchema(units),
      temp_min: temperatureSchema(units),
      temp_max: temperatureSchema(units),
      pressure: z.number(),
      humidity: z.number(),
      sea_level: z.number().optional(),
      grnd_level: z.number().optional(),
    }),
    visibility: z.number().optional(),
    wind: windSchema(units),
    rain: rain1hSchema.optional(),
    snow: snow1hSchema.optional(),
    clouds: cloudsSchema,
    dt: z.number(),
    sys: z.object({
      type: z.number().optional(),
      id: z.number().optional(),
      message: z.union([z.number(), z.string()]).optional(),
      country: z.string(),
      sunrise: z.number(),
      sunset: z.number(),
    }),
    timezone: z.number(),
    id: z.number(),
    name: z.string(),
    cod: z.number(),
  }) as z.ZodType<CurrentWeather<U>>
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test lib/openweather/schemas/current.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/openweather/schemas/current.ts lib/openweather/schemas/current.test.ts
git commit -m "схема current weather"
```

---

### Task 4: Forecast schema

**Files:**
- Create: `lib/openweather/schemas/forecast.ts`
- Create: `lib/openweather/schemas/forecast.test.ts`

**Interfaces:**
- Consumes: common schemas, `Units`, `Temperature`, `Wind`
- Produces:
  - `forecastInputSchema` — `{ lat, lon, cnt?, units?, lang? }`
  - `forecastSchema<U extends Units>(units: U): z.ZodType<Forecast<U>>`
  - `type Forecast<U extends Units = "standard">`
  - `type ForecastItem<U extends Units = "standard">`

- [ ] **Step 1: Write failing forecast schema tests**

Create `lib/openweather/schemas/forecast.test.ts`:

```ts
import { describe, expect, expectTypeOf, test } from "vitest"
import { forecastInputSchema, forecastSchema } from "./forecast"
import type { Forecast } from "./forecast"
import type { Temperature } from "../types/units"

const fixture = {
  cod: "200",
  message: 0,
  cnt: 1,
  list: [
    {
      dt: 1661871600,
      main: {
        temp: 298.48,
        feels_like: 298.74,
        temp_min: 297.56,
        temp_max: 300.05,
        pressure: 1015,
        sea_level: 1015,
        grnd_level: 933,
        humidity: 64,
        temp_kf: 0.23,
      },
      weather: [
        { id: 501, main: "Rain", description: "moderate rain", icon: "10d" },
      ],
      clouds: { all: 100 },
      wind: { speed: 0.62, deg: 349, gust: 1.18 },
      visibility: 10000,
      pop: 0.32,
      rain: { "3h": 1.25 },
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

describe("forecastSchema", () => {
  test("accepts string cod and rain 3h", () => {
    const parsed = forecastSchema("standard").parse(fixture)
    expect(parsed.cod).toBe("200")
    expect(parsed.list[0]?.rain?.["3h"]).toBe(1.25)
    expectTypeOf(parsed.list[0]!.main.temp).toEqualTypeOf<Temperature<"standard">>()
    expectTypeOf(parsed).toEqualTypeOf<Forecast<"standard">>()
  })

  test("allows missing rain", () => {
    const { rain: _rain, ...item } = fixture.list[0]!
    const parsed = forecastSchema("metric").parse({
      ...fixture,
      list: [item],
    })
    expect(parsed.list[0]?.rain).toBeUndefined()
  })

  test("rejects pop outside 0..1", () => {
    const bad = {
      ...fixture,
      list: [{ ...fixture.list[0]!, pop: 1.2 }],
    }
    expect(forecastSchema("standard").safeParse(bad).success).toBe(false)
  })
})

test("forecastInputSchema accepts cnt", () => {
  expect(forecastInputSchema.parse({ lat: 1, lon: 2, cnt: 8 })).toMatchObject({
    cnt: 8,
  })
  expect(forecastInputSchema.safeParse({ lat: 1, lon: 2, cnt: 41 }).success).toBe(
    false,
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/openweather/schemas/forecast.test.ts`

Expected: FAIL — cannot find module `./forecast`

- [ ] **Step 3: Implement forecast schemas**

Create `lib/openweather/schemas/forecast.ts`:

```ts
import { z } from "zod"
import {
  cloudsSchema,
  cntSchema,
  coordInputSchema,
  coordSchema,
  langSchema,
  rain3hSchema,
  snow3hSchema,
  unitsSchema,
  weatherItemSchema,
  windSchema,
  type Wind,
} from "./common"
import type { Temperature, Units } from "../types/units"
import { temperatureSchema } from "../types/units"

export const forecastInputSchema = coordInputSchema.extend({
  cnt: cntSchema.optional(),
  units: unitsSchema.optional(),
  lang: langSchema.optional(),
})

export type ForecastItem<U extends Units = "standard"> = {
  dt: number
  main: {
    temp: Temperature<U>
    feels_like: Temperature<U>
    temp_min: Temperature<U>
    temp_max: Temperature<U>
    pressure: number
    sea_level?: number
    grnd_level?: number
    humidity: number
    temp_kf: Temperature<U>
  }
  weather: Array<{
    id: number
    main: z.infer<typeof weatherItemSchema>["main"]
    description: string
    icon: string
  }>
  clouds: { all: number }
  wind: Wind<U>
  visibility?: number
  pop: number
  rain?: { "3h": number }
  snow?: { "3h": number }
  sys: { pod: "d" | "n" }
  dt_txt: string
}

export type Forecast<U extends Units = "standard"> = {
  cod: string
  message: number | string
  cnt: number
  list: ForecastItem<U>[]
  city: {
    id: number
    name: string
    coord: { lat: number; lon: number }
    country: string
    population: number
    timezone: number
    sunrise: number
    sunset: number
  }
}

export function forecastSchema<U extends Units>(
  units: U,
): z.ZodType<Forecast<U>> {
  const main = z.object({
    temp: temperatureSchema(units),
    feels_like: temperatureSchema(units),
    temp_min: temperatureSchema(units),
    temp_max: temperatureSchema(units),
    pressure: z.number(),
    sea_level: z.number().optional(),
    grnd_level: z.number().optional(),
    humidity: z.number(),
    temp_kf: temperatureSchema(units),
  })

  return z.object({
    cod: z.string(),
    message: z.union([z.number(), z.string()]),
    cnt: z.number(),
    list: z.array(
      z.object({
        dt: z.number(),
        main,
        weather: z.array(weatherItemSchema).min(1),
        clouds: cloudsSchema,
        wind: windSchema(units),
        visibility: z.number().optional(),
        pop: z.number().gte(0).lte(1),
        rain: rain3hSchema.optional(),
        snow: snow3hSchema.optional(),
        sys: z.object({ pod: z.enum(["d", "n"]) }),
        dt_txt: z.string(),
      }),
    ),
    city: z.object({
      id: z.number(),
      name: z.string(),
      coord: coordSchema,
      country: z.string(),
      population: z.number(),
      timezone: z.number(),
      sunrise: z.number(),
      sunset: z.number(),
    }),
  }) as z.ZodType<Forecast<U>>
}
```

Note: `coordSchema` is `{ lon, lat }`. Forecast `city.coord` uses the same fields. The fixture has `{ lat, lon }` — both keys present, order in object literal does not matter.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test lib/openweather/schemas/forecast.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/openweather/schemas/forecast.ts lib/openweather/schemas/forecast.test.ts
git commit -m "схема 5-дневного прогноза"
```

---

### Task 5: Geocoding, air pollution, and error-body schemas

**Files:**
- Create: `lib/openweather/schemas/geocoding.ts`
- Create: `lib/openweather/schemas/geocoding.test.ts`
- Create: `lib/openweather/schemas/air-pollution.ts`
- Create: `lib/openweather/schemas/air-pollution.test.ts`
- Create: `lib/openweather/schemas/error.ts`
- Create: `lib/openweather/schemas/error.test.ts`

**Interfaces:**
- Consumes: common input schemas
- Produces:
  - `joinGeoQuery(q: string | { city: string; state?: string; country?: string }): string`
  - `geoDirectInputSchema` — `{ q: string | { city, state?, country? }, limit? }` with refine: `state` requires `country`; string `q` min 1
  - `geoZipInputSchema` — `{ zip: string.min(1), country }`
  - `geoReverseInputSchema` — `{ lat, lon, limit? }`
  - `geoPlaceSchema` / `type GeoPlace`
  - `geoZipSchema` / `type GeoZip`
  - `airInputSchema` — `{ lat, lon }`
  - `airHistoryInputSchema` — `{ lat, lon, start, end }` with `start < end`
  - `airPollutionSchema` / `type AirPollution` / `type AirQualityIndex = 1|2|3|4|5`
  - `errorBodySchema` / `type ErrorBody` — `{ cod: string | number, message: string }`

- [ ] **Step 1: Write failing geocoding tests**

Create `lib/openweather/schemas/geocoding.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import {
  geoDirectInputSchema,
  geoPlaceSchema,
  geoZipSchema,
  joinGeoQuery,
} from "./geocoding"

describe("joinGeoQuery", () => {
  test("joins city country state", () => {
    expect(joinGeoQuery("London")).toBe("London")
    expect(joinGeoQuery({ city: "London", country: "GB" })).toBe("London,GB")
    expect(joinGeoQuery({ city: "London", state: "OH", country: "US" })).toBe(
      "London,OH,US",
    )
  })
})

describe("geoDirectInputSchema", () => {
  test("rejects empty q", () => {
    expect(geoDirectInputSchema.safeParse({ q: "" }).success).toBe(false)
  })

  test("rejects state without country", () => {
    expect(
      geoDirectInputSchema.safeParse({ q: { city: "London", state: "OH" } })
        .success,
    ).toBe(false)
  })

  test("accepts limit 5", () => {
    expect(geoDirectInputSchema.parse({ q: "London", limit: 5 }).limit).toBe(5)
  })
})

test("parses geo place and zip fixtures", () => {
  const places = geoPlaceSchema.array().parse([
    {
      name: "London",
      local_names: { en: "London", ascii: "London", feature_name: "London" },
      lat: 51.5085,
      lon: -0.1257,
      country: "GB",
      state: "England",
    },
  ])
  expect(places[0]?.name).toBe("London")

  const zip = geoZipSchema.parse({
    zip: "90210",
    name: "Beverly Hills",
    lat: 34.0901,
    lon: -118.4065,
    country: "US",
  })
  expect(zip.name).toBe("Beverly Hills")
})
```

- [ ] **Step 2: Run geocoding test to verify it fails**

Run: `pnpm test lib/openweather/schemas/geocoding.test.ts`

Expected: FAIL — cannot find module `./geocoding`

- [ ] **Step 3: Implement geocoding schemas**

Create `lib/openweather/schemas/geocoding.ts`:

```ts
import { z } from "zod"
import {
  coordInputSchema,
  countrySchema,
  limitSchema,
} from "./common"

export type GeoQueryObject = {
  city: string
  state?: string
  country?: string
}

export function joinGeoQuery(q: string | GeoQueryObject): string {
  if (typeof q === "string") return q
  if (q.state && q.country) return `${q.city},${q.state},${q.country}`
  if (q.country) return `${q.city},${q.country}`
  return q.city
}

const geoQueryObjectSchema = z
  .object({
    city: z.string().min(1),
    state: z.string().min(1).optional(),
    country: countrySchema.optional(),
  })
  .refine((value) => !value.state || value.country, {
    message: "state requires country",
    path: ["state"],
  })

export const geoDirectInputSchema = z.object({
  q: z.union([z.string().min(1), geoQueryObjectSchema]),
  limit: limitSchema.optional(),
})

export const geoZipInputSchema = z.object({
  zip: z.string().min(1),
  country: countrySchema,
})

export const geoReverseInputSchema = coordInputSchema.extend({
  limit: limitSchema.optional(),
})

export const geoPlaceSchema = z.object({
  name: z.string(),
  local_names: z.record(z.string(), z.string()).optional(),
  lat: z.number(),
  lon: z.number(),
  country: z.string(),
  state: z.string().optional(),
})
export type GeoPlace = z.infer<typeof geoPlaceSchema>

export const geoZipSchema = z.object({
  zip: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  country: z.string(),
})
export type GeoZip = z.infer<typeof geoZipSchema>
```

- [ ] **Step 4: Run geocoding tests to verify they pass**

Run: `pnpm test lib/openweather/schemas/geocoding.test.ts`

Expected: PASS

- [ ] **Step 5: Write failing air and error-body tests**

Create `lib/openweather/schemas/air-pollution.test.ts`:

```ts
import { describe, expect, expectTypeOf, test } from "vitest"
import { airHistoryInputSchema, airPollutionSchema } from "./air-pollution"
import type { AirQualityIndex } from "./air-pollution"

const fixture = {
  coord: [50.0, 50.0],
  list: [
    {
      dt: 1606147200,
      main: { aqi: 4.0 },
      components: {
        co: 203.609,
        no: 0.0,
        no2: 0.396,
        o3: 75.102,
        so2: 0.648,
        pm2_5: 23.253,
        pm10: 92.214,
        nh3: 0.117,
      },
    },
  ],
}

describe("airPollutionSchema", () => {
  test("accepts coord tuple and coerces aqi 4.0 to 4", () => {
    const parsed = airPollutionSchema.parse(fixture)
    expect(parsed.coord).toEqual([50, 50])
    expect(parsed.list[0]?.main.aqi).toBe(4)
    expectTypeOf(parsed.list[0]!.main.aqi).toEqualTypeOf<AirQualityIndex>()
  })
})

describe("airHistoryInputSchema", () => {
  test("requires start < end", () => {
    expect(
      airHistoryInputSchema.safeParse({
        lat: 50,
        lon: 50,
        start: 1606747870,
        end: 1606488670,
      }).success,
    ).toBe(false)
    expect(
      airHistoryInputSchema.parse({
        lat: 50,
        lon: 50,
        start: 1606488670,
        end: 1606747870,
      }).start,
    ).toBe(1606488670)
  })
})
```

Create `lib/openweather/schemas/error.test.ts`:

```ts
import { expect, test } from "vitest"
import { errorBodySchema } from "./error"

test("parses string or numeric cod", () => {
  expect(errorBodySchema.parse({ cod: "401", message: "Invalid API key" })).toEqual({
    cod: "401",
    message: "Invalid API key",
  })
  expect(errorBodySchema.parse({ cod: 429, message: "blocked" }).cod).toBe(429)
})
```

- [ ] **Step 6: Run air/error tests to verify they fail**

Run: `pnpm test lib/openweather/schemas/air-pollution.test.ts lib/openweather/schemas/error.test.ts`

Expected: FAIL — cannot find modules

- [ ] **Step 7: Implement air and error schemas**

Create `lib/openweather/schemas/air-pollution.ts`:

```ts
import { z } from "zod"
import { coordInputSchema, unixSecondsSchema } from "./common"

export const airInputSchema = coordInputSchema

export const airHistoryInputSchema = coordInputSchema
  .extend({
    start: unixSecondsSchema,
    end: unixSecondsSchema,
  })
  .refine((value) => value.start < value.end, {
    message: "start must be less than end",
    path: ["start"],
  })

export const airQualityIndexSchema = z
  .number()
  .transform((value) => Math.trunc(value))
  .pipe(
    z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),
  )
export type AirQualityIndex = z.infer<typeof airQualityIndexSchema>

export const airPollutionSchema = z.object({
  coord: z.tuple([z.number(), z.number()]),
  list: z.array(
    z.object({
      dt: z.number(),
      main: z.object({
        aqi: airQualityIndexSchema,
      }),
      components: z.object({
        co: z.number(),
        no: z.number(),
        no2: z.number(),
        o3: z.number(),
        so2: z.number(),
        pm2_5: z.number(),
        pm10: z.number(),
        nh3: z.number(),
      }),
    }),
  ),
})
export type AirPollution = z.infer<typeof airPollutionSchema>
```

Create `lib/openweather/schemas/error.ts`:

```ts
import { z } from "zod"

export const errorBodySchema = z.object({
  cod: z.union([z.string(), z.number()]),
  message: z.string(),
})
export type ErrorBody = z.infer<typeof errorBodySchema>
```

- [ ] **Step 8: Run new tests to verify they pass**

Run: `pnpm test lib/openweather/schemas`

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add lib/openweather/schemas/geocoding.ts lib/openweather/schemas/geocoding.test.ts lib/openweather/schemas/air-pollution.ts lib/openweather/schemas/air-pollution.test.ts lib/openweather/schemas/error.ts lib/openweather/schemas/error.test.ts
git commit -m "схемы geocoding, air pollution и ошибок owm"
```

---

### Task 6: HTTP pipeline

**Files:**
- Create: `lib/openweather/test/helpers.ts`
- Create: `lib/openweather/http.ts`
- Create: `lib/openweather/http.test.ts`

**Interfaces:**
- Consumes: `OpenWeatherError`, `errorBodySchema`
- Produces:
  - `type HttpDeps = { apiKey: string; baseUrl: string; fetch: typeof globalThis.fetch }`
  - `buildUrl(baseUrl: string, path: string, query: Record<string, string | number | undefined>, apiKey: string): string`
  - `parseInput<T>(schema: z.ZodType<T>, data: unknown): Result<T, OpenWeatherError>`
  - `request<T>(deps: HttpDeps, args: { path: string; query: Record<string, string | number | undefined>; signal?: AbortSignal; schema: z.ZodType<T> }): ResultAsync<T, OpenWeatherError>`
  - `jsonResponse(body: unknown, status?: number): Response` (test helper)
  - `mockFetch(impl): ReturnType<typeof vi.fn>` (test helper)

- [ ] **Step 1: Write failing HTTP tests**

Create `lib/openweather/test/helpers.ts`:

```ts
import { vi } from "vitest"

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export function mockFetch(
  impl: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url
    return impl(url, init)
  })
}
```

Create `lib/openweather/http.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import { z } from "zod"
import { buildUrl, parseInput, request } from "./http"
import { jsonResponse, mockFetch } from "./test/helpers"

const deps = {
  apiKey: "test-key",
  baseUrl: "https://api.openweathermap.org/",
  fetch: globalThis.fetch,
}

describe("buildUrl", () => {
  test("strips trailing slash, adds appid, skips undefined", () => {
    const url = buildUrl(
      "https://api.openweathermap.org/",
      "/data/2.5/weather",
      { lat: 44.34, lon: 10.99, lang: undefined },
      "test-key",
    )
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe(
      "https://api.openweathermap.org/data/2.5/weather",
    )
    expect(parsed.searchParams.get("lat")).toBe("44.34")
    expect(parsed.searchParams.get("lon")).toBe("10.99")
    expect(parsed.searchParams.get("appid")).toBe("test-key")
    expect(parsed.searchParams.has("lang")).toBe(false)
  })
})

describe("parseInput", () => {
  test("maps zod failure to validation", () => {
    const result = parseInput(z.object({ lat: z.number() }), { lat: "x" })
    expect(result.isErr()).toBe(true)
    if (result.isErr()) expect(result.error.type).toBe("validation")
  })
})

describe("request", () => {
  test("returns parsed body on 200", async () => {
    const fetchImpl = mockFetch(() => jsonResponse({ ok: true }))
    const result = await request(
      { ...deps, fetch: fetchImpl },
      {
        path: "/data/2.5/weather",
        query: { lat: 1, lon: 2 },
        schema: z.object({ ok: z.literal(true) }),
      },
    )
    expect(result._unsafeUnwrap()).toEqual({ ok: true })
    const calledUrl = String(fetchImpl.mock.calls[0]?.[0])
    expect(calledUrl).toContain("appid=test-key")
  })

  test("maps 401 owm body to http error", async () => {
    const result = await request(
      {
        ...deps,
        fetch: mockFetch(() =>
          jsonResponse({ cod: 401, message: "Invalid API key" }, 401),
        ),
      },
      {
        path: "/data/2.5/weather",
        query: {},
        schema: z.object({}),
      },
    )
    const error = result._unsafeUnwrapErr()
    expect(error).toMatchObject({
      type: "http",
      status: 401,
      cod: 401,
      message: "Invalid API key",
    })
  })

  test("maps rejected fetch to network", async () => {
    const result = await request(
      {
        ...deps,
        fetch: mockFetch(() => {
          throw new Error("offline")
        }),
      },
      { path: "/x", query: {}, schema: z.object({}) },
    )
    expect(result._unsafeUnwrapErr().type).toBe("network")
  })

  test("maps invalid json on 200 to parse", async () => {
    const result = await request(
      {
        ...deps,
        fetch: mockFetch(() => new Response("not-json", { status: 200 })),
      },
      { path: "/x", query: {}, schema: z.object({ a: z.number() }) },
    )
    expect(result._unsafeUnwrapErr().type).toBe("parse")
  })

  test("maps schema miss on 200 to parse", async () => {
    const result = await request(
      {
        ...deps,
        fetch: mockFetch(() => jsonResponse({ a: "nope" })),
      },
      { path: "/x", query: {}, schema: z.object({ a: z.number() }) },
    )
    expect(result._unsafeUnwrapErr().type).toBe("parse")
  })

  test("passes signal to fetch and not to the query string", async () => {
    const controller = new AbortController()
    const fetchImpl = mockFetch((_url, init) => {
      expect(init?.signal).toBe(controller.signal)
      return jsonResponse({ ok: true })
    })
    await request(
      { ...deps, fetch: fetchImpl },
      {
        path: "/x",
        query: { lat: 1 },
        signal: controller.signal,
        schema: z.object({ ok: z.literal(true) }),
      },
    )
    const calledUrl = String(fetchImpl.mock.calls[0]?.[0])
    expect(calledUrl).not.toContain("signal")
  })
})
```

- [ ] **Step 2: Run HTTP tests to verify they fail**

Run: `pnpm test lib/openweather/http.test.ts`

Expected: FAIL — cannot find module `./http`

- [ ] **Step 3: Implement HTTP pipeline**

Create `lib/openweather/http.ts`:

```ts
import { err, errAsync, ok, okAsync, Result, ResultAsync } from "neverthrow"
import type { z } from "zod"
import type { OpenWeatherError } from "./errors"
import { errorBodySchema } from "./schemas/error"

export type HttpDeps = {
  apiKey: string
  baseUrl: string
  fetch: typeof globalThis.fetch
}

export function buildUrl(
  baseUrl: string,
  path: string,
  query: Record<string, string | number | undefined>,
  apiKey: string,
): string {
  const base = baseUrl.replace(/\/$/, "")
  const url = new URL(`${base}${path}`)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  url.searchParams.set("appid", apiKey)
  return url.toString()
}

export function parseInput<T>(
  schema: z.ZodType<T>,
  data: unknown,
): Result<T, OpenWeatherError> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return err({ type: "validation", issues: parsed.error.issues })
  }
  return ok(parsed.data)
}

export function request<T>(
  deps: HttpDeps,
  args: {
    path: string
    query: Record<string, string | number | undefined>
    signal?: AbortSignal
    schema: z.ZodType<T>
  },
): ResultAsync<T, OpenWeatherError> {
  const url = buildUrl(deps.baseUrl, args.path, args.query, deps.apiKey)
  return ResultAsync.fromPromise(
    deps.fetch(url, { signal: args.signal }),
    (cause): OpenWeatherError => ({ type: "network", cause }),
  ).andThen((response) =>
    ResultAsync.fromPromise(
      response.text(),
      (cause): OpenWeatherError => ({ type: "network", cause }),
    ).andThen((text) => {
      if (!response.ok) {
        const body = errorBodySchema.safeParse(tryJson(text))
        if (body.success) {
          return errAsync({
            type: "http",
            status: response.status,
            cod: body.data.cod,
            message: body.data.message,
          })
        }
        return errAsync({
          type: "http",
          status: response.status,
          message: response.statusText,
        })
      }

      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        return errAsync({
          type: "parse",
          issues: [
            {
              code: "custom",
              path: [],
              message: "Invalid JSON",
              input: text,
            },
          ],
        })
      }

      const parsed = args.schema.safeParse(json)
      if (!parsed.success) {
        return errAsync({ type: "parse", issues: parsed.error.issues })
      }
      return okAsync(parsed.data)
    }),
  )
}

function tryJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
```

- [ ] **Step 4: Run HTTP tests to verify they pass**

Run: `pnpm test lib/openweather/http.test.ts`

Expected: PASS

If Zod 4 custom issue type rejects the `issues` object, add whatever fields `$ZodIssue` requires (`input` is already set). Do not change the `parse` discriminant.

- [ ] **Step 5: Commit**

```bash
git add lib/openweather/http.ts lib/openweather/http.test.ts lib/openweather/test/helpers.ts
git commit -m "http-пайплайн owm с ResultAsync"
```

---

### Task 7: Current and forecast endpoints

**Files:**
- Create: `lib/openweather/endpoints/current.ts`
- Create: `lib/openweather/endpoints/current.test.ts`
- Create: `lib/openweather/endpoints/forecast.ts`
- Create: `lib/openweather/endpoints/forecast.test.ts`

**Interfaces:**
- Consumes: `HttpDeps`, `parseInput`, `request`, current/forecast schemas, `ResolveUnits`, `Lang`, `Units`
- Produces:
  - `type ClientDeps<U extends Units = Units> = HttpDeps & { units: U; lang?: Lang }`
  - `type CurrentParams = { lat: number; lon: number; units?: Units; lang?: Lang; signal?: AbortSignal }`
  - `getCurrent<U extends Units, R extends CurrentParams>(deps: ClientDeps<U>, params: R): ResultAsync<CurrentWeather<ResolveUnits<U, R>>, OpenWeatherError>`
  - `type ForecastParams = CurrentParams & { cnt?: number }`
  - `getForecast<U extends Units, R extends ForecastParams>(deps: ClientDeps<U>, params: R): ResultAsync<Forecast<ResolveUnits<U, R>>, OpenWeatherError>`

Put `ClientDeps` in `lib/openweather/client.ts` only later would cycle-import. Define `ClientDeps` in `lib/openweather/endpoints/current.ts` and re-export from `client.ts`, **or** create it here and import from forecast/current. Create the type in `endpoints/current.ts` and import it from forecast to avoid a new file the spec did not list.

- [ ] **Step 1: Write failing current endpoint tests**

Create `lib/openweather/endpoints/current.test.ts`:

```ts
import { describe, expect, expectTypeOf, test } from "vitest"
import type { CurrentWeather } from "../schemas/current"
import { jsonResponse, mockFetch } from "../test/helpers"
import { getCurrent } from "./current"

const fixture = {
  coord: { lon: 10.99, lat: 44.34 },
  weather: [
    { id: 501, main: "Rain", description: "moderate rain", icon: "10d" },
  ],
  base: "stations",
  main: {
    temp: 8.48,
    feels_like: 4.9,
    temp_min: 8.18,
    temp_max: 9.26,
    pressure: 1016,
    humidity: 79,
    sea_level: 1016,
    grnd_level: 1016,
  },
  visibility: 10000,
  wind: { speed: 7.3, deg: 189, gust: 13.48 },
  clouds: { all: 100 },
  dt: 1647347424,
  sys: {
    type: 2,
    id: 2031790,
    country: "GB",
    sunrise: 1647325488,
    sunset: 1647367827,
  },
  timezone: 0,
  id: 2641549,
  name: "Newtonhill",
  cod: 200,
}

function deps(fetchImpl: typeof globalThis.fetch) {
  return {
    apiKey: "k",
    baseUrl: "https://api.openweathermap.org",
    fetch: fetchImpl,
    units: "metric" as const,
    lang: "ru" as const,
  }
}

describe("getCurrent", () => {
  test("validates lat before fetch", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getCurrent(deps(fetchImpl), { lat: 100, lon: 10 })
    expect(result._unsafeUnwrapErr().type).toBe("validation")
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  test("calls /data/2.5/weather with client units and brands metric", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getCurrent(deps(fetchImpl), { lat: 57, lon: -2.15 })
    const value = result._unsafeUnwrap()
    expect(value.name).toBe("Newtonhill")
    expectTypeOf(value).toEqualTypeOf<CurrentWeather<"metric">>()
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/data/2.5/weather")
    expect(url.searchParams.get("units")).toBe("metric")
    expect(url.searchParams.get("lang")).toBe("ru")
    expect(url.searchParams.has("mode")).toBe(false)
  })

  test("per-request imperial override changes units query", async () => {
    const fetchImpl = mockFetch(() =>
      jsonResponse({
        ...fixture,
        main: { ...fixture.main, temp: 47.26, feels_like: 40.82, temp_min: 46.72, temp_max: 48.67 },
        wind: { speed: 16.33, deg: 189, gust: 30.15 },
      }),
    )
    const result = await getCurrent(deps(fetchImpl), {
      lat: 57,
      lon: -2.15,
      units: "imperial",
    })
    const value = result._unsafeUnwrap()
    expectTypeOf(value).toEqualTypeOf<CurrentWeather<"imperial">>()
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.searchParams.get("units")).toBe("imperial")
  })
})
```

- [ ] **Step 2: Run current endpoint test to verify it fails**

Run: `pnpm test lib/openweather/endpoints/current.test.ts`

Expected: FAIL — cannot find module `./current`

- [ ] **Step 3: Implement current endpoint**

Create `lib/openweather/endpoints/current.ts`:

```ts
import { errAsync, ResultAsync } from "neverthrow"
import type { OpenWeatherError } from "../errors"
import { parseInput, request, type HttpDeps } from "../http"
import {
  currentInputSchema,
  currentWeatherSchema,
  type CurrentWeather,
} from "../schemas/current"
import type { Lang } from "../types/lang"
import type { ResolveUnits, Units } from "../types/units"

export type ClientDeps<U extends Units = Units> = HttpDeps & {
  units: U
  lang?: Lang
}

export type CurrentParams = {
  lat: number
  lon: number
  units?: Units
  lang?: Lang
  signal?: AbortSignal
}

export function getCurrent<U extends Units, R extends CurrentParams>(
  deps: ClientDeps<U>,
  params: R,
): ResultAsync<CurrentWeather<ResolveUnits<U, R>>, OpenWeatherError> {
  const parsed = parseInput(currentInputSchema, params)
  if (parsed.isErr()) return errAsync(parsed.error)

  const units = (parsed.value.units ?? deps.units) as ResolveUnits<U, R>
  return request(deps, {
    path: "/data/2.5/weather",
    query: {
      lat: parsed.value.lat,
      lon: parsed.value.lon,
      units,
      lang: parsed.value.lang ?? deps.lang,
    },
    signal: params.signal,
    schema: currentWeatherSchema(units),
  })
}
```

- [ ] **Step 4: Run current endpoint tests to verify they pass**

Run: `pnpm test lib/openweather/endpoints/current.test.ts`

Expected: PASS

- [ ] **Step 5: Write failing forecast endpoint tests**

Create `lib/openweather/endpoints/forecast.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import { jsonResponse, mockFetch } from "../test/helpers"
import { getForecast } from "./forecast"

const fixture = {
  cod: "200",
  message: 0,
  cnt: 1,
  list: [
    {
      dt: 1661871600,
      main: {
        temp: 298.48,
        feels_like: 298.74,
        temp_min: 297.56,
        temp_max: 300.05,
        pressure: 1015,
        humidity: 64,
        temp_kf: 0.23,
      },
      weather: [
        { id: 501, main: "Rain", description: "moderate rain", icon: "10d" },
      ],
      clouds: { all: 100 },
      wind: { speed: 0.62, deg: 349 },
      pop: 0.32,
      rain: { "3h": 1.25 },
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

describe("getForecast", () => {
  test("sends cnt and /data/2.5/forecast", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getForecast(
      {
        apiKey: "k",
        baseUrl: "https://api.openweathermap.org",
        fetch: fetchImpl,
        units: "standard",
      },
      { lat: 44.34, lon: 10.99, cnt: 8 },
    )
    expect(result._unsafeUnwrap().list[0]?.rain?.["3h"]).toBe(1.25)
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/data/2.5/forecast")
    expect(url.searchParams.get("cnt")).toBe("8")
  })

  test("rejects cnt 41 before fetch", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getForecast(
      {
        apiKey: "k",
        baseUrl: "https://api.openweathermap.org",
        fetch: fetchImpl,
        units: "standard",
      },
      { lat: 1, lon: 2, cnt: 41 },
    )
    expect(result._unsafeUnwrapErr().type).toBe("validation")
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 6: Run forecast endpoint test to verify it fails**

Run: `pnpm test lib/openweather/endpoints/forecast.test.ts`

Expected: FAIL — cannot find module `./forecast`

- [ ] **Step 7: Implement forecast endpoint**

Create `lib/openweather/endpoints/forecast.ts`:

```ts
import { errAsync, ResultAsync } from "neverthrow"
import type { OpenWeatherError } from "../errors"
import { parseInput, request } from "../http"
import {
  forecastInputSchema,
  forecastSchema,
  type Forecast,
} from "../schemas/forecast"
import type { ResolveUnits, Units } from "../types/units"
import type { ClientDeps, CurrentParams } from "./current"

export type ForecastParams = CurrentParams & { cnt?: number }

export function getForecast<U extends Units, R extends ForecastParams>(
  deps: ClientDeps<U>,
  params: R,
): ResultAsync<Forecast<ResolveUnits<U, R>>, OpenWeatherError> {
  const parsed = parseInput(forecastInputSchema, params)
  if (parsed.isErr()) return errAsync(parsed.error)

  const units = (parsed.value.units ?? deps.units) as ResolveUnits<U, R>
  return request(deps, {
    path: "/data/2.5/forecast",
    query: {
      lat: parsed.value.lat,
      lon: parsed.value.lon,
      cnt: parsed.value.cnt,
      units,
      lang: parsed.value.lang ?? deps.lang,
    },
    signal: params.signal,
    schema: forecastSchema(units),
  })
}
```

- [ ] **Step 8: Run forecast tests to verify they pass**

Run: `pnpm test lib/openweather/endpoints/forecast.test.ts`

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add lib/openweather/endpoints/current.ts lib/openweather/endpoints/current.test.ts lib/openweather/endpoints/forecast.ts lib/openweather/endpoints/forecast.test.ts
git commit -m "эндпоинты current и forecast"
```

---

### Task 8: Geocoding and air pollution endpoints

**Files:**
- Create: `lib/openweather/endpoints/geocoding.ts`
- Create: `lib/openweather/endpoints/geocoding.test.ts`
- Create: `lib/openweather/endpoints/air-pollution.ts`
- Create: `lib/openweather/endpoints/air-pollution.test.ts`

**Interfaces:**
- Consumes: `HttpDeps`, `parseInput`, `request`, geo/air schemas
- Produces:
  - `type GeoDirectParams = { q: string | { city: string; state?: string; country?: string }; limit?: number; signal?: AbortSignal }`
  - `type GeoZipParams = { zip: string; country: string; signal?: AbortSignal }`
  - `type GeoReverseParams = { lat: number; lon: number; limit?: number; signal?: AbortSignal }`
  - `geoDirect(deps: HttpDeps, params: GeoDirectParams): ResultAsync<GeoPlace[], OpenWeatherError>`
  - `geoZip(deps: HttpDeps, params: GeoZipParams): ResultAsync<GeoZip, OpenWeatherError>`
  - `geoReverse(deps: HttpDeps, params: GeoReverseParams): ResultAsync<GeoPlace[], OpenWeatherError>`
  - `type AirParams = { lat: number; lon: number; signal?: AbortSignal }`
  - `type AirHistoryParams = AirParams & { start: number; end: number }`
  - `getAirCurrent(deps: HttpDeps, params: AirParams): ResultAsync<AirPollution, OpenWeatherError>`
  - `getAirForecast(deps: HttpDeps, params: AirParams): ResultAsync<AirPollution, OpenWeatherError>`
  - `getAirHistory(deps: HttpDeps, params: AirHistoryParams): ResultAsync<AirPollution, OpenWeatherError>`

- [ ] **Step 1: Write failing geocoding endpoint tests**

Create `lib/openweather/endpoints/geocoding.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import { jsonResponse, mockFetch } from "../test/helpers"
import { geoDirect, geoReverse, geoZip } from "./geocoding"

const place = {
  name: "London",
  lat: 51.5085,
  lon: -0.1257,
  country: "GB",
}

const http = (fetchImpl: typeof globalThis.fetch) => ({
  apiKey: "k",
  baseUrl: "https://api.openweathermap.org",
  fetch: fetchImpl,
})

describe("geoDirect", () => {
  test("joins q object and sends limit", async () => {
    const fetchImpl = mockFetch(() => jsonResponse([place]))
    const result = await geoDirect(http(fetchImpl), {
      q: { city: "London", country: "GB" },
      limit: 5,
    })
    expect(result._unsafeUnwrap()[0]?.name).toBe("London")
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/geo/1.0/direct")
    expect(url.searchParams.get("q")).toBe("London,GB")
    expect(url.searchParams.get("limit")).toBe("5")
  })

  test("rejects empty q", async () => {
    const fetchImpl = mockFetch(() => jsonResponse([place]))
    const result = await geoDirect(http(fetchImpl), { q: "" })
    expect(result._unsafeUnwrapErr().type).toBe("validation")
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe("geoZip", () => {
  test("sends zip,country", async () => {
    const fetchImpl = mockFetch(() =>
      jsonResponse({
        zip: "90210",
        name: "Beverly Hills",
        lat: 34.0901,
        lon: -118.4065,
        country: "US",
      }),
    )
    const result = await geoZip(http(fetchImpl), { zip: "90210", country: "US" })
    expect(result._unsafeUnwrap().name).toBe("Beverly Hills")
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/geo/1.0/zip")
    expect(url.searchParams.get("zip")).toBe("90210,US")
  })
})

describe("geoReverse", () => {
  test("calls /geo/1.0/reverse", async () => {
    const fetchImpl = mockFetch(() => jsonResponse([place]))
    await geoReverse(http(fetchImpl), { lat: 51.5098, lon: -0.118, limit: 5 })
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/geo/1.0/reverse")
    expect(url.searchParams.get("lat")).toBe("51.5098")
  })
})
```

- [ ] **Step 2: Run geocoding endpoint tests to verify they fail**

Run: `pnpm test lib/openweather/endpoints/geocoding.test.ts`

Expected: FAIL — cannot find module `./geocoding`

- [ ] **Step 3: Implement geocoding endpoints**

Create `lib/openweather/endpoints/geocoding.ts`:

```ts
import { errAsync, ResultAsync } from "neverthrow"
import type { OpenWeatherError } from "../errors"
import { parseInput, request, type HttpDeps } from "../http"
import {
  geoDirectInputSchema,
  geoPlaceSchema,
  geoReverseInputSchema,
  geoZipInputSchema,
  geoZipSchema,
  joinGeoQuery,
  type GeoPlace,
  type GeoQueryObject,
  type GeoZip,
} from "../schemas/geocoding"

export type GeoDirectParams = {
  q: string | GeoQueryObject
  limit?: number
  signal?: AbortSignal
}

export type GeoZipParams = {
  zip: string
  country: string
  signal?: AbortSignal
}

export type GeoReverseParams = {
  lat: number
  lon: number
  limit?: number
  signal?: AbortSignal
}

export function geoDirect(
  deps: HttpDeps,
  params: GeoDirectParams,
): ResultAsync<GeoPlace[], OpenWeatherError> {
  const parsed = parseInput(geoDirectInputSchema, params)
  if (parsed.isErr()) return errAsync(parsed.error)
  return request(deps, {
    path: "/geo/1.0/direct",
    query: {
      q: joinGeoQuery(parsed.value.q),
      limit: parsed.value.limit,
    },
    signal: params.signal,
    schema: geoPlaceSchema.array(),
  })
}

export function geoZip(
  deps: HttpDeps,
  params: GeoZipParams,
): ResultAsync<GeoZip, OpenWeatherError> {
  const parsed = parseInput(geoZipInputSchema, params)
  if (parsed.isErr()) return errAsync(parsed.error)
  return request(deps, {
    path: "/geo/1.0/zip",
    query: { zip: `${parsed.value.zip},${parsed.value.country}` },
    signal: params.signal,
    schema: geoZipSchema,
  })
}

export function geoReverse(
  deps: HttpDeps,
  params: GeoReverseParams,
): ResultAsync<GeoPlace[], OpenWeatherError> {
  const parsed = parseInput(geoReverseInputSchema, params)
  if (parsed.isErr()) return errAsync(parsed.error)
  return request(deps, {
    path: "/geo/1.0/reverse",
    query: {
      lat: parsed.value.lat,
      lon: parsed.value.lon,
      limit: parsed.value.limit,
    },
    signal: params.signal,
    schema: geoPlaceSchema.array(),
  })
}
```

- [ ] **Step 4: Run geocoding tests to verify they pass**

Run: `pnpm test lib/openweather/endpoints/geocoding.test.ts`

Expected: PASS

- [ ] **Step 5: Write failing air endpoint tests**

Create `lib/openweather/endpoints/air-pollution.test.ts`:

```ts
import { describe, expect, test } from "vitest"
import { jsonResponse, mockFetch } from "../test/helpers"
import { getAirCurrent, getAirForecast, getAirHistory } from "./air-pollution"

const fixture = {
  coord: [50, 50],
  list: [
    {
      dt: 1605182400,
      main: { aqi: 1 },
      components: {
        co: 201.94,
        no: 0.01,
        no2: 0.77,
        o3: 68.66,
        so2: 0.64,
        pm2_5: 0.5,
        pm10: 0.54,
        nh3: 0.12,
      },
    },
  ],
}

const http = (fetchImpl: typeof globalThis.fetch) => ({
  apiKey: "k",
  baseUrl: "https://api.openweathermap.org",
  fetch: fetchImpl,
})

describe("air pollution endpoints", () => {
  test("current hits /data/2.5/air_pollution", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getAirCurrent(http(fetchImpl), { lat: 50, lon: 50 })
    expect(result._unsafeUnwrap().list[0]?.main.aqi).toBe(1)
    expect(new URL(String(fetchImpl.mock.calls[0]?.[0])).pathname).toBe(
      "/data/2.5/air_pollution",
    )
  })

  test("forecast hits /data/2.5/air_pollution/forecast", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    await getAirForecast(http(fetchImpl), { lat: 50, lon: 50 })
    expect(new URL(String(fetchImpl.mock.calls[0]?.[0])).pathname).toBe(
      "/data/2.5/air_pollution/forecast",
    )
  })

  test("history sends start and end", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    await getAirHistory(http(fetchImpl), {
      lat: 50,
      lon: 50,
      start: 1606488670,
      end: 1606747870,
    })
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/data/2.5/air_pollution/history")
    expect(url.searchParams.get("start")).toBe("1606488670")
    expect(url.searchParams.get("end")).toBe("1606747870")
  })

  test("history rejects start >= end", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getAirHistory(http(fetchImpl), {
      lat: 50,
      lon: 50,
      start: 2,
      end: 1,
    })
    expect(result._unsafeUnwrapErr().type).toBe("validation")
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 6: Run air tests to verify they fail**

Run: `pnpm test lib/openweather/endpoints/air-pollution.test.ts`

Expected: FAIL — cannot find module `./air-pollution`

- [ ] **Step 7: Implement air endpoints**

Create `lib/openweather/endpoints/air-pollution.ts`:

```ts
import { errAsync, ResultAsync } from "neverthrow"
import type { OpenWeatherError } from "../errors"
import { parseInput, request, type HttpDeps } from "../http"
import {
  airHistoryInputSchema,
  airInputSchema,
  airPollutionSchema,
  type AirPollution,
} from "../schemas/air-pollution"

export type AirParams = {
  lat: number
  lon: number
  signal?: AbortSignal
}

export type AirHistoryParams = AirParams & {
  start: number
  end: number
}

export function getAirCurrent(
  deps: HttpDeps,
  params: AirParams,
): ResultAsync<AirPollution, OpenWeatherError> {
  return airRequest(deps, "/data/2.5/air_pollution", params)
}

export function getAirForecast(
  deps: HttpDeps,
  params: AirParams,
): ResultAsync<AirPollution, OpenWeatherError> {
  return airRequest(deps, "/data/2.5/air_pollution/forecast", params)
}

export function getAirHistory(
  deps: HttpDeps,
  params: AirHistoryParams,
): ResultAsync<AirPollution, OpenWeatherError> {
  const parsed = parseInput(airHistoryInputSchema, params)
  if (parsed.isErr()) return errAsync(parsed.error)
  return request(deps, {
    path: "/data/2.5/air_pollution/history",
    query: {
      lat: parsed.value.lat,
      lon: parsed.value.lon,
      start: parsed.value.start,
      end: parsed.value.end,
    },
    signal: params.signal,
    schema: airPollutionSchema,
  })
}

function airRequest(
  deps: HttpDeps,
  path: string,
  params: AirParams,
): ResultAsync<AirPollution, OpenWeatherError> {
  const parsed = parseInput(airInputSchema, params)
  if (parsed.isErr()) return errAsync(parsed.error)
  return request(deps, {
    path,
    query: { lat: parsed.value.lat, lon: parsed.value.lon },
    signal: params.signal,
    schema: airPollutionSchema,
  })
}
```

- [ ] **Step 8: Run air tests to verify they pass**

Run: `pnpm test lib/openweather/endpoints/air-pollution.test.ts`

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add lib/openweather/endpoints/geocoding.ts lib/openweather/endpoints/geocoding.test.ts lib/openweather/endpoints/air-pollution.ts lib/openweather/endpoints/air-pollution.test.ts
git commit -m "эндпоинты geocoding и air pollution"
```

---

### Task 9: Client factory and public exports

**Files:**
- Create: `lib/openweather/client.ts`
- Create: `lib/openweather/client.test.ts`
- Create: `lib/openweather/index.ts`

**Interfaces:**
- Consumes: all endpoint functions and types from Tasks 7–8
- Produces:
  - `type OpenWeatherConfig<U extends Units = "standard"> = { apiKey: string; units?: U; lang?: Lang; fetch?: typeof globalThis.fetch; baseUrl?: string }`
  - `type OpenWeatherClient<U extends Units = "standard">` with `current.get`, `forecast.get`, `geo.direct|zip|reverse`, `airPollution.current|forecast|history`
  - `createOpenWeatherClient<U extends Units = "standard">(config: OpenWeatherConfig<U>): OpenWeatherClient<U>`
  - Defaults: `units = "standard"`, `lang` omitted, `fetch = globalThis.fetch`, `baseUrl = "https://api.openweathermap.org"`
  - `index.ts` exports factory, config/client types, response types, `Lang`, `Units`, `Temperature`, `WindSpeed`, `ResolveUnits`, `OpenWeatherError`, and schemas. Do not export endpoint modules.

- [ ] **Step 1: Write failing client tests**

Create `lib/openweather/client.test.ts`:

```ts
import { describe, expect, expectTypeOf, test } from "vitest"
import { createOpenWeatherClient } from "./client"
import type { CurrentWeather } from "./schemas/current"
import { jsonResponse, mockFetch } from "./test/helpers"

const currentFixture = {
  coord: { lon: 10.99, lat: 44.34 },
  weather: [
    { id: 501, main: "Rain", description: "moderate rain", icon: "10d" },
  ],
  base: "stations",
  main: {
    temp: 298.48,
    feels_like: 298.74,
    temp_min: 297.56,
    temp_max: 300.05,
    pressure: 1015,
    humidity: 64,
  },
  wind: { speed: 0.62, deg: 349 },
  clouds: { all: 100 },
  dt: 1661870592,
  sys: { country: "IT", sunrise: 1661834187, sunset: 1661882248 },
  timezone: 7200,
  id: 3163858,
  name: "Zocca",
  cod: 200,
}

describe("createOpenWeatherClient", () => {
  test("defaults to standard units and official host", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(currentFixture))
    const owm = createOpenWeatherClient({ apiKey: "k", fetch: fetchImpl })
    const result = await owm.current.get({ lat: 44.34, lon: 10.99 })
    const value = result._unsafeUnwrap()
    expectTypeOf(value).toEqualTypeOf<CurrentWeather<"standard">>()
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.origin).toBe("https://api.openweathermap.org")
    expect(url.searchParams.get("units")).toBe("standard")
    expect(url.searchParams.get("appid")).toBe("k")
  })

  test("metric client current.get is Celsius-branded", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(currentFixture))
    const owm = createOpenWeatherClient({
      apiKey: "k",
      units: "metric",
      fetch: fetchImpl,
    })
    const result = await owm.current.get({ lat: 1, lon: 2 })
    expectTypeOf(result._unsafeUnwrap()).toEqualTypeOf<CurrentWeather<"metric">>()
  })

  test("exposes geo and air namespaces", () => {
    const owm = createOpenWeatherClient({ apiKey: "k", fetch: mockFetch(() => jsonResponse({})) })
    expect(typeof owm.geo.direct).toBe("function")
    expect(typeof owm.geo.zip).toBe("function")
    expect(typeof owm.geo.reverse).toBe("function")
    expect(typeof owm.airPollution.current).toBe("function")
    expect(typeof owm.airPollution.forecast).toBe("function")
    expect(typeof owm.airPollution.history).toBe("function")
    expect(typeof owm.forecast.get).toBe("function")
  })
})
```

- [ ] **Step 2: Run client tests to verify they fail**

Run: `pnpm test lib/openweather/client.test.ts`

Expected: FAIL — cannot find module `./client`

- [ ] **Step 3: Implement client and index**

Create `lib/openweather/client.ts`:

```ts
import { getAirCurrent, getAirForecast, getAirHistory } from "./endpoints/air-pollution"
import { getCurrent, type ClientDeps } from "./endpoints/current"
import { getForecast } from "./endpoints/forecast"
import { geoDirect, geoReverse, geoZip } from "./endpoints/geocoding"
import type { OpenWeatherError } from "./errors"
import type { AirHistoryParams, AirParams } from "./endpoints/air-pollution"
import type { CurrentParams } from "./endpoints/current"
import type { ForecastParams } from "./endpoints/forecast"
import type {
  GeoDirectParams,
  GeoReverseParams,
  GeoZipParams,
} from "./endpoints/geocoding"
import type { AirPollution } from "./schemas/air-pollution"
import type { CurrentWeather } from "./schemas/current"
import type { Forecast } from "./schemas/forecast"
import type { GeoPlace, GeoZip } from "./schemas/geocoding"
import type { Lang } from "./types/lang"
import type { ResolveUnits, Units } from "./types/units"
import type { ResultAsync } from "neverthrow"

export type { ClientDeps }

export type OpenWeatherConfig<U extends Units = "standard"> = {
  apiKey: string
  units?: U
  lang?: Lang
  fetch?: typeof globalThis.fetch
  baseUrl?: string
}

export type OpenWeatherClient<U extends Units = "standard"> = {
  current: {
    get: <R extends CurrentParams>(
      params: R,
    ) => ResultAsync<CurrentWeather<ResolveUnits<U, R>>, OpenWeatherError>
  }
  forecast: {
    get: <R extends ForecastParams>(
      params: R,
    ) => ResultAsync<Forecast<ResolveUnits<U, R>>, OpenWeatherError>
  }
  geo: {
    direct: (params: GeoDirectParams) => ResultAsync<GeoPlace[], OpenWeatherError>
    zip: (params: GeoZipParams) => ResultAsync<GeoZip, OpenWeatherError>
    reverse: (
      params: GeoReverseParams,
    ) => ResultAsync<GeoPlace[], OpenWeatherError>
  }
  airPollution: {
    current: (params: AirParams) => ResultAsync<AirPollution, OpenWeatherError>
    forecast: (params: AirParams) => ResultAsync<AirPollution, OpenWeatherError>
    history: (
      params: AirHistoryParams,
    ) => ResultAsync<AirPollution, OpenWeatherError>
  }
}

export function createOpenWeatherClient<U extends Units = "standard">(
  config: OpenWeatherConfig<U>,
): OpenWeatherClient<U> {
  const deps: ClientDeps<U> = {
    apiKey: config.apiKey,
    units: (config.units ?? "standard") as U,
    lang: config.lang,
    fetch: config.fetch ?? globalThis.fetch.bind(globalThis),
    baseUrl: config.baseUrl ?? "https://api.openweathermap.org",
  }

  return {
    current: {
      get: (params) => getCurrent(deps, params),
    },
    forecast: {
      get: (params) => getForecast(deps, params),
    },
    geo: {
      direct: (params) => geoDirect(deps, params),
      zip: (params) => geoZip(deps, params),
      reverse: (params) => geoReverse(deps, params),
    },
    airPollution: {
      current: (params) => getAirCurrent(deps, params),
      forecast: (params) => getAirForecast(deps, params),
      history: (params) => getAirHistory(deps, params),
    },
  }
}
```

Create `lib/openweather/index.ts`:

```ts
export { createOpenWeatherClient } from "./client"
export type { OpenWeatherClient, OpenWeatherConfig, ClientDeps } from "./client"
export type { OpenWeatherError } from "./errors"
export type { Lang } from "./types/lang"
export { langSchema } from "./types/lang"
export type { ResolveUnits, Temperature, Units, WindSpeed } from "./types/units"
export { temperatureSchema, unitsSchema, windSpeedSchema } from "./types/units"
export type { CurrentWeather } from "./schemas/current"
export { currentInputSchema, currentWeatherSchema } from "./schemas/current"
export type { Forecast, ForecastItem } from "./schemas/forecast"
export { forecastInputSchema, forecastSchema } from "./schemas/forecast"
export type { GeoPlace, GeoQueryObject, GeoZip } from "./schemas/geocoding"
export {
  geoDirectInputSchema,
  geoPlaceSchema,
  geoReverseInputSchema,
  geoZipInputSchema,
  geoZipSchema,
  joinGeoQuery,
} from "./schemas/geocoding"
export type { AirPollution, AirQualityIndex } from "./schemas/air-pollution"
export {
  airHistoryInputSchema,
  airInputSchema,
  airPollutionSchema,
} from "./schemas/air-pollution"
export type { CurrentParams } from "./endpoints/current"
export type { ForecastParams } from "./endpoints/forecast"
export type {
  GeoDirectParams,
  GeoReverseParams,
  GeoZipParams,
} from "./endpoints/geocoding"
export type { AirHistoryParams, AirParams } from "./endpoints/air-pollution"
```

- [ ] **Step 4: Run client tests to verify they pass**

Run: `pnpm test lib/openweather/client.test.ts`

Expected: PASS

- [ ] **Step 5: Run the full suite and typecheck**

Run: `pnpm test && pnpm typecheck`

Expected: all tests PASS, `tsc --noEmit` clean

If `fetch.bind` types fail, assign `config.fetch ?? globalThis.fetch`.

- [ ] **Step 6: Commit**

```bash
git add lib/openweather/client.ts lib/openweather/client.test.ts lib/openweather/index.ts
git commit -m "factory-клиент openweather и публичные экспорты"
```

---

## Self-review

**Spec coverage**

| Spec requirement | Task |
| --- | --- |
| current.get lat/lon | 7, 9 |
| forecast.get + cnt | 4, 7, 9 |
| geo.direct / zip / reverse | 5, 8, 9 |
| air current / forecast / history | 5, 8, 9 |
| factory + client defaults | 9 |
| units branding + request override | 1, 3, 7, 9 |
| Lang union including aliases | 1 |
| Optional rain/snow/gust/sea_level | 2, 3, 4 |
| Forecast `cod` string, `rain.3h` | 4, 7 |
| Air `aqi` 4.0 → 4, coord tuple | 5 |
| Input validation before fetch | 2, 5, 6, 7, 8 |
| Errors: validation / network / http / parse | 1, 6 |
| buildUrl trailing slash, appid, no signal in query | 6 |
| No mode, no deprecated q/zip/id on weather | 7, 9 |
| Vitest scripts, fixtures from docs | 1, 3–9 |
| Public exports, hide endpoint impl as entry | 9 |
| AbortSignal | 6, 7, 8 |

**Placeholder scan:** none.

**Type consistency:** `ClientDeps` is defined in `endpoints/current.ts` and re-exported from `client.ts`. `CurrentParams` / `ForecastParams` / geo / air param types are defined once in their endpoint files. `ResolveUnits<U, R>` is the only units-resolution type. Response types live in schema files.
