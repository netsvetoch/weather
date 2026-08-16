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
