import { errAsync, okAsync } from "neverthrow"
import { describe, expect, test, vi } from "vitest"
import type { OpenWeatherClient } from "@/lib/openweather"
import { WEATHER_COPY } from "./errors"
import { airFixture, currentFixture, forecastFixture, geoFixture } from "./fixtures"
import { handleGeo, handleGeoReverse, handleWeather } from "./handlers"

const secret = "secret-appid-key"

function client(partial: Partial<OpenWeatherClient<"metric">>): OpenWeatherClient<"metric"> {
  return {
    current: { get: vi.fn() },
    forecast: { get: vi.fn() },
    geo: {
      direct: vi.fn(),
      zip: vi.fn(),
      reverse: vi.fn(),
    },
    airPollution: {
      current: vi.fn(),
      forecast: vi.fn(),
      history: vi.fn(),
    },
    ...partial,
  } as OpenWeatherClient<"metric">
}

test("geo without q is 400", async () => {
  const result = await handleGeo(new URLSearchParams(), client({}))
  expect(result.status).toBe(400)
  expect(result.body.ok).toBe(false)
})

test("geo success and empty", async () => {
  const found = client({
    geo: { direct: () => okAsync([geoFixture]), zip: vi.fn(), reverse: vi.fn() },
  })
  const ok = await handleGeo(new URLSearchParams("q=москва"), found)
  expect(ok).toEqual({ status: 200, body: { ok: true, data: [geoFixture] } })

  const none = client({
    geo: { direct: () => okAsync([]), zip: vi.fn(), reverse: vi.fn() },
  })
  const empty = await handleGeo(new URLSearchParams("q=zzz"), none)
  expect(empty.status).toBe(404)
  expect(empty.body).toEqual({
    ok: false,
    error: { type: "http", message: WEATHER_COPY.NOT_FOUND },
  })
})

test("reverse without lat is 400; first place on success", async () => {
  const bad = await handleGeoReverse(new URLSearchParams("lon=1"), client({}))
  expect(bad.status).toBe(400)

  const good = client({
    geo: {
      direct: vi.fn(),
      zip: vi.fn(),
      reverse: () => okAsync([geoFixture, { ...geoFixture, name: "Other" }]),
    },
  })
  const result = await handleGeoReverse(new URLSearchParams("lat=55.7558&lon=37.6173"), good)
  expect(result.body).toEqual({ ok: true, data: geoFixture })
})

test("weather missing lat is 400; any sdk err fails all", async () => {
  const missing = await handleWeather(new URLSearchParams("lon=1"), client({}))
  expect(missing.status).toBe(400)

  const failing = client({
    current: { get: () => okAsync(currentFixture as never) },
    forecast: { get: () => errAsync({ type: "network", cause: "x" }) },
    airPollution: { current: () => okAsync(airFixture as never), forecast: vi.fn(), history: vi.fn() },
  })
  const result = await handleWeather(new URLSearchParams("lat=1&lon=2"), failing)
  expect(result.body.ok).toBe(false)
  if (!result.body.ok) expect(result.body.error.message).toBe(WEATHER_COPY.OFFLINE)
})

test("weather success and body has no api key", async () => {
  const good = client({
    current: { get: () => okAsync(currentFixture as never) },
    forecast: { get: () => okAsync(forecastFixture as never) },
    airPollution: { current: () => okAsync(airFixture as never), forecast: vi.fn(), history: vi.fn() },
  })
  const result = await handleWeather(new URLSearchParams("lat=44.34&lon=10.99"), good)
  expect(result.status).toBe(200)
  expect(JSON.stringify(result.body)).not.toContain(secret)
  expect(result.body.ok).toBe(true)
})

test("null client is 503", async () => {
  const result = await handleGeo(new URLSearchParams("q=x"), null)
  expect(result.status).toBe(503)
  expect(result.body).toEqual({
    ok: false,
    error: { type: "http", message: WEATHER_COPY.UNAVAILABLE },
  })
})
