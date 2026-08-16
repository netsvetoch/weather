import { describe, expect, test } from "vitest"
import { jsonResponse, mockFetch } from "../test/helpers"
import { getAirCurrent, getAirForecast, getAirHistory } from "./air-pollution"

const fixture = {
  coord: [50, 50],
  list: [
    {
      dt: 1605182400,
      main: { aqi: 1 },
      components: {
        co: 201.94,
        no: 0.01,
        no2: 0.77,
        o3: 68.66,
        so2: 0.64,
        pm2_5: 0.5,
        pm10: 0.54,
        nh3: 0.12,
      },
    },
  ],
}

const http = (fetchImpl: typeof globalThis.fetch) => ({
  apiKey: "k",
  baseUrl: "https://api.openweathermap.org",
  fetch: fetchImpl,
})

describe("air pollution endpoints", () => {
  test("current hits /data/2.5/air_pollution", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getAirCurrent(http(fetchImpl), { lat: 50, lon: 50 })
    expect(result._unsafeUnwrap().list[0]?.main.aqi).toBe(1)
    expect(new URL(String(fetchImpl.mock.calls[0]?.[0])).pathname).toBe(
      "/data/2.5/air_pollution",
    )
  })

  test("forecast hits /data/2.5/air_pollution/forecast", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    await getAirForecast(http(fetchImpl), { lat: 50, lon: 50 })
    expect(new URL(String(fetchImpl.mock.calls[0]?.[0])).pathname).toBe(
      "/data/2.5/air_pollution/forecast",
    )
  })

  test("history sends start and end", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    await getAirHistory(http(fetchImpl), {
      lat: 50,
      lon: 50,
      start: 1606488670,
      end: 1606747870,
    })
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/data/2.5/air_pollution/history")
    expect(url.searchParams.get("start")).toBe("1606488670")
    expect(url.searchParams.get("end")).toBe("1606747870")
  })

  test("history rejects start >= end", async () => {
    const fetchImpl = mockFetch(() => jsonResponse(fixture))
    const result = await getAirHistory(http(fetchImpl), {
      lat: 50,
      lon: 50,
      start: 2,
      end: 1,
    })
    expect(result._unsafeUnwrapErr().type).toBe("validation")
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
