import { expect, test } from "vitest"
import { placeFromGeo, toPlaceId } from "./place"

test("same coordinates produce one PlaceId", () => {
  expect(toPlaceId(55.7558, 37.6173)).toBe("55.7558,37.6173")
  expect(toPlaceId(55.7558, 37.6173)).toBe(toPlaceId(55.7558, 37.6173))
})

test("different names at same coords are one place", () => {
  const a = placeFromGeo({ name: "Москва", lat: 55.7558, lon: 37.6173, country: "RU" })
  const b = placeFromGeo({ name: "Moscow", lat: 55.7558, lon: 37.6173, country: "RU" })
  expect(a.id).toBe(b.id)
  expect(a.id).toBe("55.7558,37.6173")
  expect(a.name).toBe("Москва")
  expect(b.name).toBe("Moscow")
})

test("copies state when present", () => {
  const place = placeFromGeo({
    name: "Austin",
    lat: 30.2672,
    lon: -97.7431,
    country: "US",
    state: "Texas",
  })
  expect(place.state).toBe("Texas")
})
