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
