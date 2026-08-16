import { expect, test } from "vitest"
import { errorBodySchema } from "./error"

test("parses string or numeric cod", () => {
  expect(errorBodySchema.parse({ cod: "401", message: "Invalid API key" })).toEqual({
    cod: "401",
    message: "Invalid API key",
  })
  expect(errorBodySchema.parse({ cod: 429, message: "blocked" }).cod).toBe(429)
})
