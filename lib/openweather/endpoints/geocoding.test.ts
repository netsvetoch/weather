import { describe, expect, test } from "vitest"
import { jsonResponse, mockFetch } from "../test/helpers"
import { geoDirect, geoReverse, geoZip } from "./geocoding"

const place = {
  name: "London",
  lat: 51.5085,
  lon: -0.1257,
  country: "GB",
}

const http = (fetchImpl: typeof globalThis.fetch) => ({
  apiKey: "k",
  baseUrl: "https://api.openweathermap.org",
  fetch: fetchImpl,
})

describe("geoDirect", () => {
  test("joins q object and sends limit", async () => {
    const fetchImpl = mockFetch(() => jsonResponse([place]))
    const result = await geoDirect(http(fetchImpl), {
      q: { city: "London", country: "GB" },
      limit: 5,
    })
    expect(result._unsafeUnwrap()[0]?.name).toBe("London")
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/geo/1.0/direct")
    expect(url.searchParams.get("q")).toBe("London,GB")
    expect(url.searchParams.get("limit")).toBe("5")
  })

  test("rejects empty q", async () => {
    const fetchImpl = mockFetch(() => jsonResponse([place]))
    const result = await geoDirect(http(fetchImpl), { q: "" })
    expect(result._unsafeUnwrapErr().type).toBe("validation")
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe("geoZip", () => {
  test("sends zip,country", async () => {
    const fetchImpl = mockFetch(() =>
      jsonResponse({
        zip: "90210",
        name: "Beverly Hills",
        lat: 34.0901,
        lon: -118.4065,
        country: "US",
      }),
    )
    const result = await geoZip(http(fetchImpl), { zip: "90210", country: "US" })
    expect(result._unsafeUnwrap().name).toBe("Beverly Hills")
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/geo/1.0/zip")
    expect(url.searchParams.get("zip")).toBe("90210,US")
  })
})

describe("geoReverse", () => {
  test("calls /geo/1.0/reverse", async () => {
    const fetchImpl = mockFetch(() => jsonResponse([place]))
    await geoReverse(http(fetchImpl), { lat: 51.5098, lon: -0.118, limit: 5 })
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]))
    expect(url.pathname).toBe("/geo/1.0/reverse")
    expect(url.searchParams.get("lat")).toBe("51.5098")
  })
})
