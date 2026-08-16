import { describe, expect, expectTypeOf, test } from "vitest"
import { forecastInputSchema, forecastSchema } from "./forecast"
import type { Forecast } from "./forecast"
import type { Temperature } from "../types/units"

const fixture = {
  cod: "200",
  message: 0,
  cnt: 1,
  list: [
    {
      dt: 1661871600,
      main: {
        temp: 298.48,
        feels_like: 298.74,
        temp_min: 297.56,
        temp_max: 300.05,
        pressure: 1015,
        sea_level: 1015,
        grnd_level: 933,
        humidity: 64,
        temp_kf: 0.23,
      },
      weather: [
        { id: 501, main: "Rain", description: "moderate rain", icon: "10d" },
      ],
      clouds: { all: 100 },
      wind: { speed: 0.62, deg: 349, gust: 1.18 },
      visibility: 10000,
      pop: 0.32,
      rain: { "3h": 1.25 },
      sys: { pod: "d" },
      dt_txt: "2022-08-30 15:00:00",
    },
  ],
  city: {
    id: 3163858,
    name: "Zocca",
    coord: { lat: 44.34, lon: 10.99 },
    country: "IT",
    population: 4593,
    timezone: 7200,
    sunrise: 1661834187,
    sunset: 1661882248,
  },
}

describe("forecastSchema", () => {
  test("accepts string cod and rain 3h", () => {
    const parsed = forecastSchema("standard").parse(fixture)
    expect(parsed.cod).toBe("200")
    expect(parsed.list[0]?.rain?.["3h"]).toBe(1.25)
    expectTypeOf(parsed.list[0]!.main.temp).toEqualTypeOf<Temperature<"standard">>()
    expectTypeOf(parsed).toEqualTypeOf<Forecast<"standard">>()
  })

  test("allows missing rain", () => {
    const { rain: _rain, ...item } = fixture.list[0]!
    const parsed = forecastSchema("metric").parse({
      ...fixture,
      list: [item],
    })
    expect(parsed.list[0]?.rain).toBeUndefined()
  })

  test("rejects pop outside 0..1", () => {
    const bad = {
      ...fixture,
      list: [{ ...fixture.list[0]!, pop: 1.2 }],
    }
    expect(forecastSchema("standard").safeParse(bad).success).toBe(false)
  })
})

test("forecastInputSchema accepts cnt", () => {
  expect(forecastInputSchema.parse({ lat: 1, lon: 2, cnt: 8 })).toMatchObject({
    cnt: 8,
  })
  expect(forecastInputSchema.safeParse({ lat: 1, lon: 2, cnt: 41 }).success).toBe(
    false,
  )
})
