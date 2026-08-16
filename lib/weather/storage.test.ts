import { describe, expect, test } from "vitest"
import { emptyStore, isFresh, putSnapshot, readStore, selectPlace, starActive, unstar, writeStore } from "./storage"
import { MAX_PLACES, STORAGE_KEY, type Place, type Snapshot } from "./types"

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key) {
      return map.get(key) ?? null
    },
    key(index) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key) {
      map.delete(key)
    },
    setItem(key, value) {
      map.set(key, String(value))
    },
  }
}

const moscow: Place = {
  id: "55.7558,37.6173",
  name: "Москва",
  country: "RU",
  lat: 55.7558,
  lon: 37.6173,
}

const spb: Place = {
  id: "59.9343,30.3351",
  name: "Санкт-Петербург",
  country: "RU",
  lat: 59.9343,
  lon: 30.3351,
}

const snapshot = { fetchedAt: 1_700_000_000_000 } as Snapshot

test("selectPlace sets activeId and catalog, not places", () => {
  const next = selectPlace(emptyStore(), moscow)
  expect(next.activeId).toBe(moscow.id)
  expect(next.catalog[moscow.id]).toEqual(moscow)
  expect(next.places).toEqual([])
})

test("starActive respects limit 8", () => {
  let store = emptyStore()
  for (let i = 0; i < MAX_PLACES; i += 1) {
    const place: Place = {
      id: `${i},${i}`,
      name: `C${i}`,
      country: "RU",
      lat: i,
      lon: i,
    }
    store = starActive(selectPlace(store, place)).store
  }
  const ninth: Place = { id: "9,9", name: "C9", country: "RU", lat: 9, lon: 9 }
  const result = starActive(selectPlace(store, ninth))
  expect(result.error).toBe("limit")
  expect(result.store.places).toHaveLength(8)
})

test("unstar active clears activeId and snapshot", () => {
  let store = putSnapshot(starActive(selectPlace(emptyStore(), moscow)).store, moscow.id, snapshot)
  store = unstar(store, moscow.id)
  expect(store.activeId).toBeNull()
  expect(store.places).toEqual([])
  expect(store.snapshots[moscow.id]).toBeUndefined()
})

test("unstar non-active keeps activeId", () => {
  let store = starActive(selectPlace(emptyStore(), moscow)).store
  store = starActive(selectPlace(store, spb)).store
  store = unstar(store, moscow.id)
  expect(store.activeId).toBe(spb.id)
  expect(store.places.map((p) => p.id)).toEqual([spb.id])
})

test("write and read roundtrip", () => {
  const storage = memoryStorage()
  const store = putSnapshot(selectPlace(emptyStore(), moscow), moscow.id, snapshot)
  writeStore(storage, store)
  expect(storage.getItem(STORAGE_KEY)).toBeTruthy()
  expect(readStore(storage)).toEqual(store)
})

test("readStore returns empty on garbage", () => {
  const storage = memoryStorage()
  storage.setItem(STORAGE_KEY, "{")
  expect(readStore(storage)).toEqual(emptyStore())
})

test("isFresh is 10 minutes", () => {
  expect(isFresh({ ...snapshot, fetchedAt: 1000 }, 1000 + 9 * 60 * 1000)).toBe(true)
  expect(isFresh({ ...snapshot, fetchedAt: 1000 }, 1000 + 10 * 60 * 1000 + 1)).toBe(false)
})
