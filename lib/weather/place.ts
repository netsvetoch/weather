import type { GeoPlace } from "@/lib/openweather"
import type { Place, PlaceId } from "./types"

export function toPlaceId(lat: number, lon: number): PlaceId {
  return `${lat},${lon}`
}

export function placeFromGeo(place: GeoPlace): Place {
  return {
    id: toPlaceId(place.lat, place.lon),
    name: place.name,
    country: place.country,
    state: place.state,
    lat: place.lat,
    lon: place.lon,
  }
}
