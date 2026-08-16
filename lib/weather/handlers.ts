import type {
  AirPollution,
  CurrentWeather,
  Forecast,
  GeoPlace,
  OpenWeatherClient,
  OpenWeatherError,
} from "@/lib/openweather"
import {
  mapOpenWeatherError,
  unavailableError,
  WEATHER_COPY,
  type WeatherSurface,
} from "./errors"

export type ApiOk<T> = { ok: true; data: T }
export type ApiErr = { ok: false; error: { type: string; message: string } }
export type HandlerResult<T> = { status: number; body: ApiOk<T> | ApiErr }

function readCoord(params: URLSearchParams): { lat: number; lon: number } | null {
  const latRaw = params.get("lat")
  const lonRaw = params.get("lon")
  if (latRaw == null || lonRaw == null || latRaw.trim() === "" || lonRaw.trim() === "") return null
  const lat = Number(latRaw)
  const lon = Number(lonRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lon }
}

function fail(error: OpenWeatherError, surface: WeatherSurface): HandlerResult<never> {
  const mapped = mapOpenWeatherError(error, surface)
  return { status: mapped.status, body: { ok: false, error: { type: mapped.type, message: mapped.message } } }
}

function unavailable(): HandlerResult<never> {
  const mapped = unavailableError()
  return { status: mapped.status, body: { ok: false, error: { type: mapped.type, message: mapped.message } } }
}

function invalid(surface: WeatherSurface): HandlerResult<never> {
  return {
    status: 400,
    body: {
      ok: false,
      error: {
        type: "validation",
        message: surface === "geo" ? WEATHER_COPY.GEO_FAILED : WEATHER_COPY.CORRUPT,
      },
    },
  }
}

function notFound(): HandlerResult<never> {
  return {
    status: 404,
    body: { ok: false, error: { type: "http", message: WEATHER_COPY.NOT_FOUND } },
  }
}

export async function handleGeo(
  params: URLSearchParams,
  client: OpenWeatherClient<"metric"> | null,
): Promise<HandlerResult<GeoPlace[]>> {
  if (!client) return unavailable()
  const q = params.get("q")
  if (!q || q.trim() === "") return invalid("geo")
  const result = await client.geo.direct({ q: q.trim(), limit: 5 })
  if (result.isErr()) return fail(result.error, "geo")
  if (result.value.length === 0) return notFound()
  return { status: 200, body: { ok: true, data: result.value } }
}

export async function handleGeoReverse(
  params: URLSearchParams,
  client: OpenWeatherClient<"metric"> | null,
): Promise<HandlerResult<GeoPlace>> {
  if (!client) return unavailable()
  const coord = readCoord(params)
  if (!coord) return invalid("geo")
  const result = await client.geo.reverse({ lat: coord.lat, lon: coord.lon, limit: 1 })
  if (result.isErr()) return fail(result.error, "geo")
  const place = result.value[0]
  if (!place) return notFound()
  return { status: 200, body: { ok: true, data: place } }
}

export async function handleWeather(
  params: URLSearchParams,
  client: OpenWeatherClient<"metric"> | null,
): Promise<
  HandlerResult<{
    current: CurrentWeather<"metric">
    forecast: Forecast<"metric">
    air: AirPollution
  }>
> {
  if (!client) return unavailable()
  const coord = readCoord(params)
  if (!coord) return invalid("weather")
  const [current, forecast, air] = await Promise.all([
    client.current.get({ lat: coord.lat, lon: coord.lon }),
    client.forecast.get({ lat: coord.lat, lon: coord.lon }),
    client.airPollution.current({ lat: coord.lat, lon: coord.lon }),
  ])
  if (current.isErr()) return fail(current.error, "weather")
  if (forecast.isErr()) return fail(forecast.error, "weather")
  if (air.isErr()) return fail(air.error, "weather")
  return {
    status: 200,
    body: {
      ok: true,
      data: { current: current.value, forecast: forecast.value, air: air.value },
    },
  }
}
