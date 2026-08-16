"use client"

import EmptyState1 from "@/components/blocks/empty-state-1"
import { Button } from "@/components/ui/button"
import { PlaceChips } from "@/components/weather/place-chips"
import { placeFromGeo } from "@/lib/weather/place"
import type { WeatherController } from "@/hooks/use-weather"

export function SearchEmpty({ weather }: { weather: WeatherController }) {
  return (
    <div className="flex flex-col gap-6 pt-8">
      {weather.store.places.length > 0 ? (
        <PlaceChips
          places={weather.store.places}
          activeId={weather.store.activeId}
          onSelect={weather.choosePlace}
        />
      ) : null}
      <EmptyState1 title="Куда смотрим">
        <label className="sr-only" htmlFor="city-search">
          Город
        </label>
        <input
          id="city-search"
          type="search"
          value={weather.query}
          onChange={(event) => weather.setQuery(event.target.value)}
          placeholder="Город"
          autoComplete="off"
          className="h-11 w-full rounded-2xl border border-[color-mix(in_oklab,var(--fogline)_28%,transparent)] bg-[var(--glass)] px-4 text-sm text-[var(--mercury)] placeholder:text-[var(--fogline)] focus-visible:ring-2 focus-visible:ring-[var(--fogline)] focus-visible:outline-none"
        />
        {weather.searchError ? (
          <p className="text-sm text-[var(--mercury)]">{weather.searchError}</p>
        ) : null}
        {weather.results.length > 0 ? (
          <ul className="overflow-hidden rounded-2xl bg-[var(--glass)]">
            {weather.results.map((place) => (
              <li key={`${place.lat},${place.lon}`}>
                <button
                  type="button"
                  onClick={() => weather.choosePlace(placeFromGeo(place))}
                  className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-[color-mix(in_oklab,var(--dusk)_55%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--fogline)] focus-visible:outline-none focus-visible:ring-inset"
                >
                  <span className="text-sm text-[var(--mercury)]">
                    {place.name}
                  </span>
                  <span className="text-xs text-[var(--fogline)]">
                    {[place.state, place.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <Button type="button" variant="secondary" onClick={weather.nearby}>
          Рядом
        </Button>
      </EmptyState1>
    </div>
  )
}
