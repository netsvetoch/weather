import { describe, expect, test } from "vitest"
import { jsonResponse, mockFetch } from "../test/helpers"
import { getForecast } from "./forecast"

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
        humidity: 64,
        temp_kf: 0.23,
      },
      weather: [
        { id: 501, main: "Rain", description: "moderate rain", icon: "10d" },
      ],
      clouds: { all: 100 },
      wind: { speed: 0.62, deg: 349 },
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

describe("getForecast", () => {
  test("sends cnt and /data/2.5/forecast", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getForecast(
      {
        apiKey: "k",
        baseUrl: "https://api.openweathermap.org",
        fetch: fetchImpl,
        units: "standard",
      },
      { lat: 44.34, lon: 10.99, cnt: 8 },
    )
    expect(result._unsafeUnwrap().list[0]?.rain?.["3h"]).toBe(1.25)
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/data/2.5/forecast")
    expect(url.searchParams.get("cnt")).toBe("8")
  })

  test("rejects cnt 41 before fetch", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getForecast(
      {
        apiKey: "k",
        baseUrl: "https://api.openweathermap.org",
        fetch: fetchImpl,
        units: "standard",
      },
      { lat: 1, lon: 2, cnt: 41 },
    )
    expect(result._unsafeUnwrapErr().type).toBe("validation")
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
