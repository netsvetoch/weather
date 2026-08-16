import { describe, expect, expectTypeOf, test } from "vitest"
import type { CurrentWeather } from "../schemas/current"
import { jsonResponse, mockFetch } from "../test/helpers"
import { getCurrent } from "./current"

const fixture = {
  coord: { lon: 10.99, lat: 44.34 },
  weather: [
    { id: 501, main: "Rain", description: "moderate rain", icon: "10d" },
  ],
  base: "stations",
  main: {
    temp: 8.48,
    feels_like: 4.9,
    temp_min: 8.18,
    temp_max: 9.26,
    pressure: 1016,
    humidity: 79,
    sea_level: 1016,
    grnd_level: 1016,
  },
  visibility: 10000,
  wind: { speed: 7.3, deg: 189, gust: 13.48 },
  clouds: { all: 100 },
  dt: 1647347424,
  sys: {
    type: 2,
    id: 2031790,
    country: "GB",
    sunrise: 1647325488,
    sunset: 1647367827,
  },
  timezone: 0,
  id: 2641549,
  name: "Newtonhill",
  cod: 200,
}

function deps(fetchImpl: typeof globalThis.fetch) {
  return {
    apiKey: "k",
    baseUrl: "https://api.openweathermap.org",
    fetch: fetchImpl,
    units: "metric" as const,
    lang: "ru" as const,
  }
}

describe("getCurrent", () => {
  test("validates lat before fetch", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getCurrent(deps(fetchImpl), { lat: 100, lon: 10 })
    expect(result._unsafeUnwrapErr().type).toBe("validation")
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  test("calls /data/2.5/weather with client units and brands metric", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getCurrent(deps(fetchImpl), { lat: 57, lon: -2.15 })
    const value = result._unsafeUnwrap()
    expect(value.name).toBe("Newtonhill")
    expectTypeOf(value).toEqualTypeOf<CurrentWeather<"metric">>()
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/data/2.5/weather")
    expect(url.searchParams.get("units")).toBe("metric")
    expect(url.searchParams.get("lang")).toBe("ru")
    expect(url.searchParams.has("mode")).toBe(false)
  })

  test("per-request imperial override changes units query", async () => {
    const fetchImpl = mockFetch(() =>
      jsonResponse({
        ...fixture,
        main: { ...fixture.main, temp: 47.26, feels_like: 40.82, temp_min: 46.72, temp_max: 48.67 },
        wind: { speed: 16.33, deg: 189, gust: 30.15 },
      }),
    )
    const result = await getCurrent(deps(fetchImpl), {
      lat: 57,
      lon: -2.15,
      units: "imperial",
    })
    const value = result._unsafeUnwrap()
    expectTypeOf(value).toEqualTypeOf<CurrentWeather<"imperial">>()
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.searchParams.get("units")).toBe("imperial")
  })
})
