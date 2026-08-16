import {
  FRESH_MS,
  MAX_PLACES,
  STORAGE_KEY,
  type Place,
  type PlaceId,
  type Snapshot,
  type WeatherStore,
} from "./types"

export function emptyStore(): WeatherStore {
  return { places: [], activeId: null, catalog: {}, snapshots: {} }
}

export function readStore(storage: Storage): WeatherStore {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as WeatherStore
    if (!parsed || !Array.isArray(parsed.places) || typeof parsed.catalog !== "object") {
      return emptyStore()
    }
    return {
      places: parsed.places,
      activeId: parsed.activeId ?? null,
      catalog: parsed.catalog ?? {},
      snapshots: parsed.snapshots ?? {},
    }
  } catch {
    return emptyStore()
  }
}

export function writeStore(storage: Storage, store: WeatherStore): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function selectPlace(store: WeatherStore, place: Place): WeatherStore {
  return {
    ...store,
    activeId: place.id,
    catalog: { ...store.catalog, [place.id]: place },
  }
}

export function starActive(store: WeatherStore): { store: WeatherStore; error?: "limit" } {
  if (!store.activeId) return { store }
  if (store.places.some((place) => place.id === store.activeId)) return { store }
  if (store.places.length >= MAX_PLACES) return { store, error: "limit" }
  const place = store.catalog[store.activeId]
  if (!place) return { store }
  return { store: { ...store, places: [...store.places, place] } }
}

export function unstar(store: WeatherStore, id: PlaceId): WeatherStore {
  const { [id]: _removed, ...snapshots } = store.snapshots
  return {
    ...store,
    places: store.places.filter((place) => place.id !== id),
    activeId: store.activeId === id ? null : store.activeId,
    snapshots,
  }
}

export function putSnapshot(
  store: WeatherStore,
  id: PlaceId,
  snapshot: Snapshot,
): WeatherStore {
  return { ...store, snapshots: { ...store.snapshots, [id]: snapshot } }
}

export function isFresh(snapshot: Snapshot, now: number): boolean {
  return now - snapshot.fetchedAt < FRESH_MS
}
