import { describe, expect, test } from "vitest"
import { z } from "zod"
import { buildUrl, parseInput, request } from "./http"
import { jsonResponse, mockFetch } from "./test/helpers"

const deps = {
  apiKey: "test-key",
  baseUrl: "https://api.openweathermap.org/",
  fetch: globalThis.fetch,
}

describe("buildUrl", () => {
  test("strips trailing slash, adds appid, skips undefined", () => {
    const url = buildUrl(
      "https://api.openweathermap.org/",
      "/data/2.5/weather",
      { lat: 44.34, lon: 10.99, lang: undefined },
      "test-key",
    )
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe(
      "https://api.openweathermap.org/data/2.5/weather",
    )
    expect(parsed.searchParams.get("lat")).toBe("44.34")
    expect(parsed.searchParams.get("lon")).toBe("10.99")
    expect(parsed.searchParams.get("appid")).toBe("test-key")
    expect(parsed.searchParams.has("lang")).toBe(false)
  })
})

describe("parseInput", () => {
  test("maps zod failure to validation", () => {
    const result = parseInput(z.object({ lat: z.number() }), { lat: "x" })
    expect(result.isErr()).toBe(true)
    if (result.isErr()) expect(result.error.type).toBe("validation")
  })
})

describe("request", () => {
  test("returns parsed body on 200", async () => {
    const fetchImpl = mockFetch(() => jsonResponse({ ok: true }))
    const result = await request(
      { ...deps, fetch: fetchImpl },
      {
        path: "/data/2.5/weather",
        query: { lat: 1, lon: 2 },
        schema: z.object({ ok: z.literal(true) }),
      },
    )
    expect(result._unsafeUnwrap()).toEqual({ ok: true })
    const calledUrl = String(fetchImpl.mock.calls[0]?.[0])
    expect(calledUrl).toContain("appid=test-key")
  })

  test("maps 401 owm body to http error", async () => {
    const result = await request(
      {
        ...deps,
        fetch: mockFetch(() =>
          jsonResponse({ cod: 401, message: "Invalid API key" }, 401),
        ),
      },
      {
        path: "/data/2.5/weather",
        query: {},
        schema: z.object({}),
      },
    )
    const error = result._unsafeUnwrapErr()
    expect(error).toMatchObject({
      type: "http",
      status: 401,
      cod: 401,
      message: "Invalid API key",
    })
  })

  test("maps rejected fetch to network", async () => {
    const result = await request(
      {
        ...deps,
        fetch: mockFetch(() => {
          throw new Error("offline")
        }),
      },
      { path: "/x", query: {}, schema: z.object({}) },
    )
    expect(result._unsafeUnwrapErr().type).toBe("network")
  })

  test("maps invalid json on 200 to parse", async () => {
    const result = await request(
      {
        ...deps,
        fetch: mockFetch(() => new Response("not-json", { status: 200 })),
      },
      { path: "/x", query: {}, schema: z.object({ a: z.number() }) },
    )
    expect(result._unsafeUnwrapErr().type).toBe("parse")
  })

  test("maps schema miss on 200 to parse", async () => {
    const result = await request(
      {
        ...deps,
        fetch: mockFetch(() => jsonResponse({ a: "nope" })),
      },
      { path: "/x", query: {}, schema: z.object({ a: z.number() }) },
    )
    expect(result._unsafeUnwrapErr().type).toBe("parse")
  })

  test("passes signal to fetch and not to the query string", async () => {
    const controller = new AbortController()
    const fetchImpl = mockFetch((_url, init) => {
      expect(init?.signal).toBe(controller.signal)
      return jsonResponse({ ok: true })
    })
    await request(
      { ...deps, fetch: fetchImpl },
      {
        path: "/x",
        query: { lat: 1 },
        signal: controller.signal,
        schema: z.object({ ok: z.literal(true) }),
      },
    )
    const calledUrl = String(fetchImpl.mock.calls[0]?.[0])
    expect(calledUrl).not.toContain("signal")
  })
})
