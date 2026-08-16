import type { PlaceId } from "./types"

export function shouldClearOfflineChrome(
  before: { activeId: PlaceId | null },
  after: { activeId: PlaceId | null }
): boolean {
  return before.activeId !== null && after.activeId === null
}
