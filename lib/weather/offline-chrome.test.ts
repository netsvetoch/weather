import { expect, test } from "vitest"
import { shouldClearOfflineChrome } from "./offline-chrome"

test("unstar that drops activeId clears offline chrome", () => {
  expect(
    shouldClearOfflineChrome(
      { activeId: "55.7558,37.6173" },
      { activeId: null }
    )
  ).toBe(true)
})

test("unstar of a non-active place keeps offline chrome", () => {
  expect(
    shouldClearOfflineChrome(
      { activeId: "59.9343,30.3351" },
      { activeId: "59.9343,30.3351" }
    )
  ).toBe(false)
})

test("already empty search does not clear", () => {
  expect(shouldClearOfflineChrome({ activeId: null }, { activeId: null })).toBe(
    false
  )
})
