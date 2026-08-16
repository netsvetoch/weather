import { describe, expect, expectTypeOf, test } from "vitest"
import { airHistoryInputSchema, airPollutionSchema } from "./air-pollution"
import type { AirQualityIndex } from "./air-pollution"

const fixture = {
  coord: [50.0, 50.0],
  list: [
    {
      dt: 1606147200,
      main: { aqi: 4.0 },
      components: {
        co: 203.609,
        no: 0.0,
        no2: 0.396,
        o3: 75.102,
        so2: 0.648,
        pm2_5: 23.253,
        pm10: 92.214,
        nh3: 0.117,
      },
    },
  ],
}

describe("airPollutionSchema", () => {
  test("accepts coord tuple and coerces aqi 4.0 to 4", () => {
    const parsed = airPollutionSchema.parse(fixture)
    expect(parsed.coord).toEqual([50, 50])
    expect(parsed.list[0]?.main.aqi).toBe(4)
    expectTypeOf(parsed.list[0]!.main.aqi).toEqualTypeOf<AirQualityIndex>()
  })

  test("accepts live coord object { lon, lat }", () => {
    const parsed = airPollutionSchema.parse({
      ...fixture,
      coord: { lon: 58.9831, lat: 53.4242 },
    })
    expect(parsed.coord).toEqual([58.9831, 53.4242])
    expect(parsed.list[0]?.main.aqi).toBe(4)
  })
})

describe("airHistoryInputSchema", () => {
  test("requires start < end", () => {
    expect(
      airHistoryInputSchema.safeParse({
        lat: 50,
        lon: 50,
        start: 1606747870,
        end: 1606488670,
      }).success,
    ).toBe(false)
    expect(
      airHistoryInputSchema.parse({
        lat: 50,
        lon: 50,
        start: 1606488670,
        end: 1606747870,
      }).start,
    ).toBe(1606488670)
  })
})
