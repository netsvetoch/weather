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
