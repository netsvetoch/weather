import type { PlaceId } from "./types"

export type RefreshRequest = {
  placeId: PlaceId
  seq: number
}

export type RefreshLive = {
  activeId: PlaceId | null
  seq: number
}

export function isLiveRefresh(
  request: RefreshRequest,
  live: RefreshLive
): boolean {
  return request.placeId === live.activeId && request.seq === live.seq
}
