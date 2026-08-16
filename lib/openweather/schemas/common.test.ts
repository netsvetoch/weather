import { describe, expect, expectTypeOf, test } from "vitest"
import { windSchema, weatherItemSchema, weatherIconSchema, latSchema, lonSchema, cntSchema, limitSchema, cloudsSchema } from "./common"
import type { WindSpeed } from "../types/units"

describe("weatherItemSchema", () => {
  test("parses a rain item", () => {
    const item = weatherItemSchema.parse({
      id: 501,
      main: "Rain",
      description: "moderate rain",
      icon: "10d",
    })
    expect(item.main).toBe("Rain")
  })

  test("rejects bad icon", () => {
    expect(weatherIconSchema.safeParse("10").success).toBe(false)
  })
})

describe("windSchema", () => {
  test("brands metric speed as m/s", () => {
    const wind = windSchema("metric").parse({ speed: 7.3, deg: 189, gust: 13.48 })
    expectTypeOf(wind.speed).toEqualTypeOf<WindSpeed<"metric">>()
    expect(wind.gust).toBe(13.48)
  })

  test("allows missing gust", () => {
    const wind = windSchema("standard").parse({ speed: 4.1, deg: 80 })
    expect(wind.gust).toBeUndefined()
  })
})

describe("input bounds", () => {
  test("lat must be in [-90, 90]", () => {
    expect(latSchema.safeParse(91).success).toBe(false)
    expect(latSchema.parse(-90)).toBe(-90)
  })

  test("lon must be in [-180, 180]", () => {
    expect(lonSchema.safeParse(181).success).toBe(false)
    expect(lonSchema.parse(180)).toBe(180)
  })

  test("cnt is 1..40", () => {
    expect(cntSchema.safeParse(0).success).toBe(false)
    expect(cntSchema.safeParse(41).success).toBe(false)
    expect(cntSchema.parse(8)).toBe(8)
  })

  test("limit is 1..5", () => {
    expect(limitSchema.safeParse(0).success).toBe(false)
    expect(limitSchema.parse(5)).toBe(5)
  })

  test("clouds.all is 0..100", () => {
    expect(cloudsSchema.safeParse({ all: 101 }).success).toBe(false)
    expect(cloudsSchema.parse({ all: 83 })).toEqual({ all: 83 })
  })
})
