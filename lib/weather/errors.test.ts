import { describe, expect, test } from "vitest"
import {
  formatFetchedAt,
  mapOpenWeatherError,
  offlineBanner,
  unavailableError,
  WEATHER_COPY,
} from "./errors"

const issues = [
  {
    code: "custom" as const,
    path: [],
    message: "bad",
  },
]

describe("mapOpenWeatherError geo", () => {
  test("validation is 400 GEO_FAILED", () => {
    expect(mapOpenWeatherError({ type: "validation", issues }, "geo")).toEqual({
      status: 400,
      type: "validation",
      message: WEATHER_COPY.GEO_FAILED,
    })
  })

  test("network is 502 GEO_FAILED", () => {
    expect(mapOpenWeatherError({ type: "network", cause: "offline" }, "geo")).toEqual({
      status: 502,
      type: "network",
      message: WEATHER_COPY.GEO_FAILED,
    })
  })

  test("parse is 502 GEO_FAILED", () => {
    expect(mapOpenWeatherError({ type: "parse", issues }, "geo")).toEqual({
      status: 502,
      type: "parse",
      message: WEATHER_COPY.GEO_FAILED,
    })
  })

  test("http 401/403 is UNAVAILABLE", () => {
    expect(
      mapOpenWeatherError({ type: "http", status: 401, message: "x" }, "geo").message,
    ).toBe(WEATHER_COPY.UNAVAILABLE)
    expect(
      mapOpenWeatherError({ type: "http", status: 403, message: "x" }, "geo"),
    ).toMatchObject({ status: 403, type: "http" })
  })

  test("http 429 is RATE_LIMIT", () => {
    expect(mapOpenWeatherError({ type: "http", status: 429, message: "x" }, "geo")).toEqual({
      status: 429,
      type: "http",
      message: WEATHER_COPY.RATE_LIMIT,
    })
  })

  test("http other keeps status and GEO_FAILED", () => {
    expect(mapOpenWeatherError({ type: "http", status: 404, message: "x" }, "geo")).toEqual({
      status: 404,
      type: "http",
      message: WEATHER_COPY.GEO_FAILED,
    })
  })
})

describe("mapOpenWeatherError weather", () => {
  test("validation is 400 CORRUPT", () => {
    expect(mapOpenWeatherError({ type: "validation", issues }, "weather")).toEqual({
      status: 400,
      type: "validation",
      message: WEATHER_COPY.CORRUPT,
    })
  })

  test("parse is 502 CORRUPT", () => {
    expect(mapOpenWeatherError({ type: "parse", issues }, "weather").message).toBe(
      WEATHER_COPY.CORRUPT,
    )
  })

  test("network is 502 OFFLINE", () => {
    expect(mapOpenWeatherError({ type: "network", cause: null }, "weather")).toEqual({
      status: 502,
      type: "network",
      message: WEATHER_COPY.OFFLINE,
    })
  })

  test("http 401 and 429", () => {
    expect(
      mapOpenWeatherError({ type: "http", status: 401, message: "x" }, "weather").message,
    ).toBe(WEATHER_COPY.UNAVAILABLE)
    expect(
      mapOpenWeatherError({ type: "http", status: 429, message: "x" }, "weather").message,
    ).toBe(WEATHER_COPY.RATE_LIMIT)
  })
})

test("unavailableError is 503", () => {
  expect(unavailableError()).toEqual({
    status: 503,
    type: "http",
    message: WEATHER_COPY.UNAVAILABLE,
  })
})

test("offlineBanner uses HH:mm", () => {
  const ms = Date.UTC(2026, 0, 1, 9, 5, 0)
  const clock = formatFetchedAt(ms)
  expect(clock).toMatch(/^\d{2}:\d{2}$/)
  expect(offlineBanner(ms)).toBe(`Нет сети, показано за ${clock}`)
})
