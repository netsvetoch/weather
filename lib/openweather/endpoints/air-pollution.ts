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
