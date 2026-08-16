import { expect, test } from "vitest"
import { isLiveRefresh } from "./refresh"

test("stale when a later place is active", () => {
  expect(
    isLiveRefresh(
      { placeId: "55.7558,37.6173", seq: 1 },
      { activeId: "59.9343,30.3351", seq: 2 }
    )
  ).toBe(false)
})

test("stale when the same place has a newer request", () => {
  expect(
    isLiveRefresh(
      { placeId: "55.7558,37.6173", seq: 1 },
      { activeId: "55.7558,37.6173", seq: 2 }
    )
  ).toBe(false)
})

test("live when place and seq still match", () => {
  expect(
    isLiveRefresh(
      { placeId: "55.7558,37.6173", seq: 2 },
      { activeId: "55.7558,37.6173", seq: 2 }
    )
  ).toBe(true)
})

test("stale when nothing is active", () => {
  expect(
    isLiveRefresh(
      { placeId: "55.7558,37.6173", seq: 1 },
      { activeId: null, seq: 1 }
    )
  ).toBe(false)
})
