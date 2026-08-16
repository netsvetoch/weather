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
