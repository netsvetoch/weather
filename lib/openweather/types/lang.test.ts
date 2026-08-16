import { expect, test } from "vitest"
import { langSchema } from "./lang"

test("accepts documented aliases", () => {
  expect(langSchema.parse("ru")).toBe("ru")
  expect(langSchema.parse("sp")).toBe("sp")
  expect(langSchema.parse("es")).toBe("es")
  expect(langSchema.parse("zh_cn")).toBe("zh_cn")
})

test("rejects unknown lang", () => {
  expect(langSchema.safeParse("xx").success).toBe(false)
})
