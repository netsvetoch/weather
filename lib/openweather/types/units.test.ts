import { describe, expect, expectTypeOf, test } from "vitest"
import {
  temperatureSchema,
  type Temperature,
  type ResolveUnits,
  type Units,
} from "./units"

describe("temperatureSchema", () => {
  test("brands metric as Celsius", () => {
    const value = temperatureSchema("metric").parse(8.48)
    expect(value).toBe(8.48)
    expectTypeOf(value).toEqualTypeOf<Temperature<"metric">>()
  })

  test("brands imperial as Fahrenheit", () => {
    const value = temperatureSchema("imperial").parse(47.26)
    expectTypeOf(value).toEqualTypeOf<Temperature<"imperial">>()
  })

  test("brands standard as Kelvin", () => {
    const value = temperatureSchema("standard").parse(281.63)
    expectTypeOf(value).toEqualTypeOf<Temperature<"standard">>()
  })
})

describe("ResolveUnits", () => {
  test("keeps client units when request has none", () => {
    expectTypeOf<ResolveUnits<"metric", { lat: number }>>().toEqualTypeOf<"metric">()
  })

  test("request units override client units", () => {
    expectTypeOf<
      ResolveUnits<"metric", { units: "imperial" }>
    >().toEqualTypeOf<"imperial">()
  })
})

test("Celsius is not assignable to Fahrenheit", () => {
  expectTypeOf<Temperature<"metric">>().not.toMatchTypeOf<Temperature<"imperial">>()
  expectTypeOf<Units>().toEqualTypeOf<"standard" | "metric" | "imperial">()
})
