import { describe, expect, test } from "vitest"
import {
  geoDirectInputSchema,
  geoPlaceSchema,
  geoZipSchema,
  joinGeoQuery,
} from "./geocoding"

describe("joinGeoQuery", () => {
  test("joins city country state", () => {
    expect(joinGeoQuery("London")).toBe("London")
    expect(joinGeoQuery({ city: "London", country: "GB" })).toBe("London,GB")
    expect(joinGeoQuery({ city: "London", state: "OH", country: "US" })).toBe(
      "London,OH,US",
    )
  })
})

describe("geoDirectInputSchema", () => {
  test("rejects empty q", () => {
    expect(geoDirectInputSchema.safeParse({ q: "" }).success).toBe(false)
  })

  test("rejects state without country", () => {
    expect(
      geoDirectInputSchema.safeParse({ q: { city: "London", state: "OH" } })
        .success,
    ).toBe(false)
  })

  test("accepts limit 5", () => {
    expect(geoDirectInputSchema.parse({ q: "London", limit: 5 }).limit).toBe(5)
  })
})

test("parses geo place and zip fixtures", () => {
  const places = geoPlaceSchema.array().parse([
    {
      name: "London",
      local_names: { en: "London", ascii: "London", feature_name: "London" },
      lat: 51.5085,
      lon: -0.1257,
      country: "GB",
      state: "England",
    },
  ])
  expect(places[0]?.name).toBe("London")

  const zip = geoZipSchema.parse({
    zip: "90210",
    name: "Beverly Hills",
    lat: 34.0901,
    lon: -118.4065,
    country: "US",
  })
  expect(zip.name).toBe("Beverly Hills")
})
