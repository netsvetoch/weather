"use client"

import { useCallback, useEffect, useSyncExternalStore, useState } from "react"

import type { GeoPlace } from "@/lib/openweather"
import { WEATHER_COPY, offlineBanner } from "@/lib/weather/errors"
import { shouldClearOfflineChrome } from "@/lib/weather/offline-chrome"
import { placeFromGeo } from "@/lib/weather/place"
import { isLiveRefresh } from "@/lib/weather/refresh"
import {
  emptyStore,
  isFresh,
  putSnapshot,
  readStore,
  selectPlace,
  starActive,
  unstar,
  writeStore,
} from "@/lib/weather/storage"
import type {
  Place,
  PlaceId,
  Snapshot,
  WeatherStore,
} from "@/lib/weather/types"

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { type: string; message: string } }

type WeatherPayload = Omit<Snapshot, "fetchedAt">

type GeoApi = {
  getCurrentPosition: (
    success: (position: {
      coords: { latitude: number; longitude: number }
    }) => void,
    error: () => void,
    options: { timeout: number }
  ) => void
}

const listeners = new Set<() => void>()
let cache: WeatherStore | null = null
let refreshSeq = 0

function emit() {
  for (const listener of listeners) listener()
}

function getSnapshot() {
  cache ??= readStore(localStorage)
  return cache
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function commit(next: WeatherStore) {
  cache = next
  writeStore(localStorage, next)
  emit()
}

function isNetworkWeatherError(error: { type: string; message: string }) {
  return error.type === "network" || error.message === WEATHER_COPY.OFFLINE
}

export function useWeather() {
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const store = useSyncExternalStore(subscribe, getSnapshot, emptyStore)
  const [waiting, setWaiting] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GeoPlace[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const id = globalThis.setTimeout(() => setToast(null), 4000)
    return () => globalThis.clearTimeout(id)
  }, [toast])

  const refresh = useCallback(async (place: Place) => {
    const seq = ++refreshSeq
    const current = cache ?? emptyStore()
    const live = () =>
      isLiveRefresh(
        { placeId: place.id, seq },
        { activeId: (cache ?? current).activeId, seq: refreshSeq }
      )
    try {
      const response = await fetch(
        `/api/weather?lat=${place.lat}&lon=${place.lon}`
      )
      const body = (await response.json()) as ApiResult<WeatherPayload>
      if (!live()) return
      if (!body.ok) {
        const snapshot = (cache ?? current).snapshots[place.id]
        if (isNetworkWeatherError(body.error)) {
          if (snapshot) setBanner(offlineBanner(snapshot.fetchedAt))
          else setFatal(WEATHER_COPY.OFFLINE)
        } else {
          setFatal(body.error.message)
        }
        setWaiting(false)
        return
      }
      const snapshot: Snapshot = { ...body.data, fetchedAt: Date.now() }
      commit(putSnapshot(cache ?? current, place.id, snapshot))
      setBanner(null)
      setFatal(null)
      setWaiting(false)
    } catch {
      if (!live()) return
      const snapshot = (cache ?? current).snapshots[place.id]
      if (snapshot) setBanner(offlineBanner(snapshot.fetchedAt))
      else setFatal(WEATHER_COPY.OFFLINE)
      setWaiting(false)
    }
  }, [])

  const choosePlace = useCallback(
    (place: Place) => {
      const next = selectPlace(cache ?? emptyStore(), place)
      commit(next)
      const snapshot = next.snapshots[place.id]
      setWaiting(!(snapshot && isFresh(snapshot, Date.now())))
      setQuery("")
      setResults([])
      setSearchError(null)
      setBanner(null)
      setFatal(null)
      void refresh(place)
    },
    [refresh]
  )

  const star = useCallback(() => {
    const { store: next, error } = starActive(cache ?? emptyStore())
    if (error === "limit") {
      setToast(WEATHER_COPY.FAVORITE_LIMIT)
      return
    }
    commit(next)
  }, [])

  const unstarPlace = useCallback((id: PlaceId) => {
    const current = cache ?? emptyStore()
    const next = unstar(current, id)
    commit(next)
    if (shouldClearOfflineChrome(current, next)) {
      setBanner(null)
      setFatal(null)
    }
  }, [])

  const nearby = useCallback(() => {
    const geo = (globalThis.navigator as Navigator & { geolocation?: GeoApi })
      .geolocation
    if (!geo) {
      setToast(WEATHER_COPY.GEOLOCATION_FAILED)
      return
    }
    geo.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `/api/geo/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          )
          const body = (await response.json()) as ApiResult<GeoPlace>
          if (!body.ok) {
            setToast(body.error.message)
            return
          }
          choosePlace(placeFromGeo(body.data))
        } catch {
          setToast(WEATHER_COPY.GEOLOCATION_FAILED)
        }
      },
      () => {
        setToast(WEATHER_COPY.GEOLOCATION_FAILED)
      },
      { timeout: 10000 }
    )
  }, [choosePlace])

  const retry = useCallback(() => {
    const current = cache ?? emptyStore()
    if (!current.activeId) return
    const place = current.catalog[current.activeId]
    if (!place) return
    setWaiting(!current.snapshots[current.activeId])
    setFatal(null)
    void refresh(place)
  }, [refresh])

  useEffect(() => {
    if (!ready) return
    const current = getSnapshot()
    if (!current.activeId) return
    const place = current.catalog[current.activeId]
    if (!place) return
    const id = globalThis.setTimeout(() => {
      void refresh(place)
    }, 0)
    return () => globalThis.clearTimeout(id)
  }, [ready, refresh])

  useEffect(() => {
    const q = query.trim()
    const controller = new AbortController()
    const id = globalThis.setTimeout(
      async () => {
        if (q.length < 2) {
          setResults([])
          setSearchError(null)
          return
        }
        try {
          const response = await fetch(`/api/geo?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
          })
          const body = (await response.json()) as ApiResult<GeoPlace[]>
          if (!body.ok) {
            setResults([])
            setSearchError(body.error.message)
          } else {
            setResults(body.data.slice(0, 5))
            setSearchError(null)
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError")
            return
          setResults([])
          setSearchError(WEATHER_COPY.GEO_FAILED)
        }
      },
      q.length < 2 ? 0 : 300
    )
    return () => {
      controller.abort()
      globalThis.clearTimeout(id)
    }
  }, [query])

  const active = store.activeId ? (store.catalog[store.activeId] ?? null) : null
  const snapshot = store.activeId
    ? (store.snapshots[store.activeId] ?? null)
    : null
  const starred = Boolean(
    store.activeId && store.places.some((place) => place.id === store.activeId)
  )
  const loading = waiting || Boolean(store.activeId && !snapshot)

  return {
    store,
    ready,
    loading,
    banner,
    fatal,
    toast,
    query,
    setQuery,
    results,
    searchError,
    active,
    snapshot,
    starred,
    choosePlace,
    star,
    unstarPlace,
    nearby,
    retry,
    dismissToast: () => setToast(null),
  }
}

export type WeatherController = ReturnType<typeof useWeather>
