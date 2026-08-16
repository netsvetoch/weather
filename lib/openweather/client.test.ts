import { describe, expect, expectTypeOf, test } from "vitest"
import { createOpenWeatherClient } from "./client"
import type { CurrentWeather } from "./schemas/current"
import { jsonResponse, mockFetch } from "./test/helpers"

const currentFixture = {
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
  },
  wind: { speed: 0.62, deg: 349 },
  clouds: { all: 100 },
  dt: 1661870592,
  sys: { country: "IT", sunrise: 1661834187, sunset: 1661882248 },
  timezone: 7200,
  id: 3163858,
  name: "Zocca",
  cod: 200,
}

describe("createOpenWeatherClient", () => {
  test("defaults to standard units and official host", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(currentFixture))
    const owm = createOpenWeatherClient({ apiKey: "k", fetch: fetchImpl })
    const result = await owm.current.get({ lat: 44.34, lon: 10.99 })
    const value = result._unsafeUnwrap()
    expectTypeOf(value).toEqualTypeOf<CurrentWeather<"standard">>()
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.origin).toBe("https://api.openweathermap.org")
    expect(url.searchParams.get("units")).toBe("standard")
    expect(url.searchParams.get("appid")).toBe("k")
  })

  test("metric client current.get is Celsius-branded", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(currentFixture))
    const owm = createOpenWeatherClient({
      apiKey: "k",
      units: "metric",
      fetch: fetchImpl,
    })
    const result = await owm.current.get({ lat: 1, lon: 2 })
    expectTypeOf(result._unsafeUnwrap()).toEqualTypeOf<CurrentWeather<"metric">>()
  })

  test("exposes geo and air namespaces", () => {
    const owm = createOpenWeatherClient({ apiKey: "k", fetch: mockFetch(() => jsonResponse({})) })
    expect(typeof owm.geo.direct).toBe("function")
    expect(typeof owm.geo.zip).toBe("function")
    expect(typeof owm.geo.reverse).toBe("function")
    expect(typeof owm.airPollution.current).toBe("function")
    expect(typeof owm.airPollution.forecast).toBe("function")
    expect(typeof owm.airPollution.history).toBe("function")
    expect(typeof owm.forecast.get).toBe("function")
  })
})
