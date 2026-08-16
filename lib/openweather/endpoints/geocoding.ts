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
