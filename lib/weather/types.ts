import type { AirPollution, CurrentWeather, Forecast } from "@/lib/openweather"

export type PlaceId = `${number},${number}`

export type Place = {
  id: PlaceId
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

export type Snapshot = {
  current: CurrentWeather<"metric">
  forecast: Forecast<"metric">
  air: AirPollution
  fetchedAt: number
}

export type WeatherStore = {
  places: Place[]
  activeId: PlaceId | null
  catalog: Record<PlaceId, Place>
  snapshots: Record<PlaceId, Snapshot>
}

export const STORAGE_KEY = "zalupy.weather.v1"
export const MAX_PLACES = 8
export const FRESH_MS = 10 * 60 * 1000
