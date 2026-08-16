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
