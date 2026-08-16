import { describe, expect, expectTypeOf, test } from "vitest"
import { currentInputSchema, currentWeatherSchema } from "./current"
import type { CurrentWeather } from "./current"
import type { Temperature } from "../types/units"

const fixture = {
  coord: { lon: 10.99, lat: 44.34 },
  weather: [
    { id: 501, main: "Rain", description: "moderate rain", icon: "10d" },
  ],
  base: "stations",
  main: {
    temp: 298.48,
    feels_like: 298.74,
    temp_min: 297.56,
    temp_max: 300.05,
    pressure: 1015,
    humidity: 64,
    sea_level: 1015,
    grnd_level: 933,
  },
  visibility: 10000,
  wind: { speed: 0.62, deg: 349, gust: 1.18 },
  rain: { "1h": 3.16 },
  clouds: { all: 100 },
  dt: 1661870592,
  sys: {
    type: 2,
    id: 2075663,
    country: "IT",
    sunrise: 1661834187,
    sunset: 1661882248,
  },
  timezone: 7200,
  id: 3163858,
  name: "Zocca",
  cod: 200,
}

describe("currentWeatherSchema", () => {
  test("parses the docs fixture as Kelvin", () => {
    const parsed = currentWeatherSchema("standard").parse(fixture)
    expect(parsed.name).toBe("Zocca")
    expect(parsed.rain?.["1h"]).toBe(3.16)
    expectTypeOf(parsed.main.temp).toEqualTypeOf<Temperature<"standard">>()
    expectTypeOf(parsed).toEqualTypeOf<CurrentWeather<"standard">>()
  })

  test("allows missing rain and optional main pressures", () => {
    const { rain, main, ...rest } = fixture
    const slimMain = {
      temp: main.temp,
      feels_like: main.feels_like,
      temp_min: main.temp_min,
      temp_max: main.temp_max,
      pressure: main.pressure,
      humidity: main.humidity,
    }
    expect(currentWeatherSchema("metric").parse({ ...rest, main: slimMain }).rain).toBeUndefined()
  })

  test("rejects empty weather array", () => {
    expect(
      currentWeatherSchema("standard").safeParse({ ...fixture, weather: [] }).success,
    ).toBe(false)
  })
})

describe("currentInputSchema", () => {
  test("accepts lat lon", () => {
    expect(currentInputSchema.parse({ lat: 44.34, lon: 10.99 })).toEqual({
      lat: 44.34,
      lon: 10.99,
    })
  })

  test("rejects out of range lat", () => {
    expect(currentInputSchema.safeParse({ lat: 100, lon: 10 }).success).toBe(false)
  })
})
