# OpenWeatherMap Free API TypeScript SDK

In-app SDK at `lib/openweather` for the free OpenWeatherMap JSON APIs documented in `docs/`. Factory client, Zod 4 as the runtime source of truth, neverthrow `ResultAsync` on every call, units branded on the response so `metric` temperatures are not assignable to `imperial` ones.

## Scope

In:

- Current weather: `GET /data/2.5/weather?lat&lon`
- 5 day / 3 hour forecast: `GET /data/2.5/forecast?lat&lon`
- Geocoding: `GET /geo/1.0/direct`, `/geo/1.0/zip`, `/geo/1.0/reverse`
- Air pollution: `GET /data/2.5/air_pollution`, `/forecast`, `/history`

Out:

- XML, HTML, JSONP/`callback`
- Deprecated built-in geocoder on weather/forecast (`q`, `zip`, `id`)
- One Call, hourly, 16-day, bulk, and any paid product
- Publishing as a separate npm package

## Public API

```ts
const owm = createOpenWeatherClient({
  apiKey: process.env.OPENWEATHER_API_KEY,
  units: "metric",
  lang: "ru",
});

const weather = await owm.current.get({ lat: 44.34, lon: 10.99 });
const forecast = await owm.forecast.get({ lat: 44.34, lon: 10.99, cnt: 8 });
const places = await owm.geo.direct({ q: "London", limit: 5 });
const zip = await owm.geo.zip({ zip: "E14", country: "GB" });
const nearby = await owm.geo.reverse({ lat: 51.5098, lon: -0.118, limit: 5 });
const air = await owm.airPollution.current({ lat: 50, lon: 50 });
const airForecast = await owm.airPollution.forecast({ lat: 50, lon: 50 });
const airHistory = await owm.airPollution.history({
  lat: 50,
  lon: 50,
  start: 1606488670,
  end: 1606747870,
});
```

`createOpenWeatherClient` is generic over the client default `units`. Per-request `units` overrides the default and changes the return brand.

```ts
type Units = "standard" | "metric" | "imperial";

type OpenWeatherConfig<U extends Units = "standard"> = {
  apiKey: string;
  units?: U;
  lang?: Lang;
  fetch?: typeof globalThis.fetch;
  baseUrl?: string;
};

function createOpenWeatherClient<U extends Units = "standard">(
  config: OpenWeatherConfig<U>,
): OpenWeatherClient<U>;
```

Defaults: `units = "standard"`, `lang` omitted (OWM English), `fetch = globalThis.fetch`, `baseUrl = "https://api.openweathermap.org"`. `appid` is always taken from the client, never from a call.

### Methods

| Method | Path | Extra params |
| --- | --- | --- |
| `current.get` | `/data/2.5/weather` | `lat`, `lon`, optional `units`, `lang`, `signal` |
| `forecast.get` | `/data/2.5/forecast` | `lat`, `lon`, optional `cnt` (1–40), `units`, `lang`, `signal` |
| `geo.direct` | `/geo/1.0/direct` | `q` (string or `{ city, state?, country? }`), optional `limit` (1–5), `signal` |
| `geo.zip` | `/geo/1.0/zip` | `zip`, `country` (ISO 3166-1 alpha-2), optional `signal` |
| `geo.reverse` | `/geo/1.0/reverse` | `lat`, `lon`, optional `limit` (1–5), `signal` |
| `airPollution.current` | `/data/2.5/air_pollution` | `lat`, `lon`, optional `signal` |
| `airPollution.forecast` | `/data/2.5/air_pollution/forecast` | `lat`, `lon`, optional `signal` |
| `airPollution.history` | `/data/2.5/air_pollution/history` | `lat`, `lon`, `start`, `end` (unix UTC, `start < end`), optional `signal` |

Every method returns `ResultAsync<T, OpenWeatherError>`. Nothing throws for expected HTTP/parse/network/validation failures.

`q` object form is joined as `city`, `city,country`, or `city,state,country`. `state` is only valid with `country` (OWM: US states). Invalid combinations are `validation` errors before the request.

## Units branding

Zod 4 `.brand<"Name">()` on output numbers. Input stays a plain `number`.

```ts
type Temperature<U extends Units> = U extends "metric"
  ? number & z.$brand<"Celsius">
  : U extends "imperial"
    ? number & z.$brand<"Fahrenheit">
    : number & z.$brand<"Kelvin">;

type WindSpeed<U extends Units> = U extends "imperial"
  ? number & z.$brand<"mph">
  : number & z.$brand<"m/s">;
```

Applied to: `main.temp`, `main.feels_like`, `main.temp_min`, `main.temp_max`, `main.temp_kf` (forecast only, same brand as temp), `wind.speed`, `wind.gust`.

Not branded (units do not change with `units`): pressure hPa, humidity %, visibility m, precipitation mm, cloudiness %, AQI, pollutant µg/m³, unix timestamps, coordinates.

Resolution: `Request.units` if present, else client `units`, else `"standard"`. Schema factories take the resolved units and brand accordingly.

```ts
type ResolveUnits<ClientU extends Units, R> = R extends { units: infer RU extends Units }
  ? RU
  : ClientU;
```

`Celsius` is not assignable to `Fahrenheit` or `Kelvin`. A metric client call with `{ units: "imperial" }` returns imperial brands.

## Schemas

Zod objects are the only response types. Export both schemas and `z.infer` types. Optional fields match OWM: omitted when the phenomenon is absent.

Shared:

- `coord`: `{ lon: number, lat: number }`
- `weatherItem`: `{ id: number, main: WeatherMain, description: string, icon: WeatherIcon }`
- `WeatherMain`: `"Thunderstorm" | "Drizzle" | "Rain" | "Snow" | "Atmosphere" | "Clear" | "Clouds"`
- `WeatherIcon`: `z.string().regex(/^\d{2}[dn]$/)`
- `rain1h` / `snow1h`: `{ "1h": number }` (current)
- `rain3h` / `snow3h`: `{ "3h": number }` (forecast)
- `clouds`: `{ all: number }` 0–100
- `wind<U>`: `{ speed: WindSpeed<U>, deg: number, gust?: WindSpeed<U> }`
- `Lang`: union of every code in the docs, including aliases `sp`/`es`, `sv`/`se`, `ua`/`uk`

Current weather: required `coord`, `weather` (min 1), `base`, `main` (`temp`, `feels_like`, `temp_min`, `temp_max`, `pressure`, `humidity`; `sea_level`/`grnd_level` optional), `visibility` optional, `wind`, `clouds`, `dt`, `sys` (`country`, `sunrise`, `sunset`; `type`/`id`/`message` optional), `timezone`, `id`, `name`, `cod`. Optional `rain`, `snow`.

Forecast: `cod` (OWM sends string `"200"`), `message`, `cnt`, `list[]` (each: `dt`, `main` plus `temp_kf`, `weather`, `clouds`, `wind`, `visibility` optional, `pop` 0–1, optional `rain`/`snow` with `3h`, `sys.pod` `"d" | "n"`, `dt_txt`), `city` (`id`, `name`, `coord`, `country`, `population`, `timezone`, `sunrise`, `sunset`).

Geocoding direct/reverse item: `name`, `lat`, `lon`, `country`, optional `state`, optional `local_names` as `Record<string, string>` (language codes plus internal `ascii` / `feature_name`). Response is an array. Zip: `{ zip, name, lat, lon, country }`.

Air pollution: `coord` is `z.tuple([z.number(), z.number()])`. OWM examples use `[50, 50]` and the field text says "latitude, longitude"; do not invent a lon/lat brand. `list[]`: `dt`, `main.aqi` as `1 | 2 | 3 | 4 | 5` (OWM sometimes sends `4.0`; coerce to int), `components` `{ co, no, no2, o3, so2, pm2_5, pm10, nh3 }` all numbers.

OWM error body: `{ cod: string | number, message: string }`.

Input schemas (fail as `validation` before fetch):

- `lat` ∈ [-90, 90], `lon` ∈ [-180, 180]
- `cnt` integer 1–40
- geo `limit` integer 1–5
- `start`/`end` finite unix seconds, `start < end`
- `country` two-letter ISO
- `q` non-empty; if object, `city` required; `state` requires `country`

## Errors

Discriminated union, never a thrown exception for these cases:

```ts
type OpenWeatherError =
  | { type: "validation"; issues: z.core.$ZodIssue[] }
  | { type: "network"; cause: unknown }
  | { type: "http"; status: number; cod?: string | number; message: string }
  | { type: "parse"; issues: z.core.$ZodIssue[] };
```

Mapping:

- Input schema fail → `validation`
- `fetch` throw / abort → `network`
- HTTP not OK → `http` (parse OWM `{cod,message}` when present; else `statusText`)
- HTTP OK but body fails response schema → `parse`

`cod` 200 with a successful body is success even if TypeScript `cod` is a string on forecast.

## Data flow

1. Merge client defaults with call params; resolve `units`/`lang`.
2. Parse input schema → `validation` or continue.
3. Build URL: strip trailing slash from `baseUrl`, join with path that starts with `/`, query from params, always `appid`. `signal` is passed to `fetch` only, never to the query string.
4. `ResultAsync.fromPromise(fetch(url, { signal }), cause => ({ type: "network", cause }))`.
5. Read text; if `!response.ok` → `http`.
6. `JSON.parse`; on throw → `parse` with a single issue.
7. Response schema (units factory) `.safeParse`; fail → `parse`.
8. `ok(parsed.data)`.

No retries. No caching. Caller owns that.

## File layout

```
lib/openweather/
  index.ts                 // public exports only
  client.ts                // createOpenWeatherClient
  http.ts                  // request pipeline
  errors.ts                // OpenWeatherError
  types/units.ts           // Units, Temperature, WindSpeed, ResolveUnits
  types/lang.ts            // Lang union
  schemas/common.ts
  schemas/current.ts       // factory(units)
  schemas/forecast.ts      // factory(units)
  schemas/geocoding.ts
  schemas/air-pollution.ts
  schemas/error.ts
  endpoints/current.ts
  endpoints/forecast.ts
  endpoints/geocoding.ts
  endpoints/air-pollution.ts
```

`index.ts` exports the factory, config/client types, all inferred response types, `Lang`, `Units`, branded helpers, and `OpenWeatherError`. Schemas may be exported for tests and advanced use. Endpoint modules are not part of the public path.

## Testing

Vitest (already a dependency). Add `"test": "vitest run"` and `"test:watch": "vitest"`.

No live OWM calls. Inject `fetch`.

Coverage:

- URL building: path, query, `appid`, omitted undefined optionals, `q` object join, `zip,country`
- Input validation: out-of-range lat/lon, `cnt`, `limit`, `start >= end`, empty `q`
- HTTP: 401/404/429 → `http` with `cod`/`message` when body is OWM-shaped
- Network: rejected fetch → `network`
- Parse: 200 with missing required field → `parse`
- Success: fixtures copied from `docs/*.md` JSON examples parse and brand
- Units: metric client brands Celsius; per-request imperial override brands Fahrenheit; type tests via `expectTypeOf` that Celsius is not assignable to Fahrenheit
- Air: `aqi: 4.0` coerces to `4`; `coord` tuple accepted
- Forecast: `cod: "200"` accepted; optional `rain["3h"]`

Type tests live next to unit tests (`*.test.ts`) using vitest `expectTypeOf`.

## Implementation notes

- HTTPS only. Default host `https://api.openweathermap.org`.
- `mode` is never sent.
- `type-fest` / `ts-extras` only if a helper is clearly shorter than a local type (likely `Exact` / `SetRequired` for `q` object). Do not add unused deps usage.
- No comments in production code unless asked.
- Follow existing project TypeScript / Prettier settings.
