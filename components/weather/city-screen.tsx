"use client"

import { useState } from "react"
import { Search, Star } from "lucide-react"

import { AqiCard } from "@/components/weather/aqi-card"
import { CurrentHero } from "@/components/weather/current-hero"
import { FactsRow } from "@/components/weather/facts-row"
import { ForecastList } from "@/components/weather/forecast-list"
import { PlaceChips } from "@/components/weather/place-chips"
import { Button } from "@/components/ui/button"
import { placeFromGeo } from "@/lib/weather/place"
import { WEATHER_COPY } from "@/lib/weather/errors"
import type { WeatherController } from "@/hooks/use-weather"
import { cn } from "@/lib/utils"

export function CityScreen({ weather }: { weather: WeatherController }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const place = weather.active
  const snapshot = weather.snapshot

  if (!place) return null

  return (
    <div className="flex flex-col gap-5 pt-4 pb-16">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "min-w-0 flex-1",
            searchOpen ? "block" : "hidden md:block"
          )}
        >
          <label className="sr-only" htmlFor="city-search-header">
            Город
          </label>
          <input
            id="city-search-header"
            type="search"
            value={weather.query}
            onChange={(event) => weather.setQuery(event.target.value)}
            placeholder="Город"
            autoComplete="off"
            className="h-9 w-full rounded-2xl border border-[color-mix(in_oklab,var(--fogline)_28%,transparent)] bg-[var(--glass)] px-3 text-sm text-[var(--mercury)] placeholder:text-[var(--fogline)] focus-visible:ring-2 focus-visible:ring-[var(--fogline)] focus-visible:outline-none"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-expanded={searchOpen}
          aria-controls="city-search-header"
          onClick={() => setSearchOpen((open) => !open)}
        >
          <Search />
          <span className="sr-only">Поиск</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={weather.nearby}
        >
          Рядом
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-pressed={weather.starred}
          onClick={() => {
            if (weather.starred) weather.unstarPlace(place.id)
            else weather.star()
          }}
        >
          <Star
            className={cn(
              weather.starred && "fill-[var(--flare)] text-[var(--flare)]"
            )}
          />
          <span className="sr-only">
            {weather.starred ? "Убрать из избранного" : "В избранное"}
          </span>
        </Button>
      </div>
      {weather.results.length > 0 || weather.searchError ? (
        <div className="flex flex-col gap-2">
          {weather.searchError ? (
            <p className="text-sm text-[var(--mercury)]">
              {weather.searchError}
            </p>
          ) : null}
          {weather.results.length > 0 ? (
            <ul className="overflow-hidden rounded-2xl bg-[var(--glass)]">
              {weather.results.map((item) => (
                <li key={`${item.lat},${item.lon}`}>
                  <button
                    type="button"
                    onClick={() => weather.choosePlace(placeFromGeo(item))}
                    className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-[color-mix(in_oklab,var(--dusk)_55%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--fogline)] focus-visible:outline-none focus-visible:ring-inset"
                  >
                    <span className="text-sm text-[var(--mercury)]">
                      {item.name}
                    </span>
                    <span className="text-xs text-[var(--fogline)]">
                      {[item.state, item.country].filter(Boolean).join(", ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <PlaceChips
        places={weather.store.places}
        activeId={weather.store.activeId}
        onSelect={weather.choosePlace}
      />
      {snapshot ? (
        <div
          className={cn("flex flex-col gap-5", weather.loading && "opacity-70")}
        >
          <CurrentHero place={place} snapshot={snapshot} />
          <FactsRow snapshot={snapshot} />
          <AqiCard snapshot={snapshot} />
          <ForecastList snapshot={snapshot} />
        </div>
      ) : weather.fatal ? (
        <div className="flex flex-col items-start gap-3 pt-10">
          <p className="text-sm text-[var(--mercury)]">{weather.fatal}</p>
          {weather.fatal === WEATHER_COPY.OFFLINE ? (
            <Button type="button" onClick={weather.retry}>
              Повторить
            </Button>
          ) : null}
        </div>
      ) : weather.loading ? (
        <p className="pt-10 text-sm text-[var(--fogline)]">Загрузка</p>
      ) : null}
      {snapshot && weather.fatal && weather.fatal !== WEATHER_COPY.OFFLINE ? (
        <p className="text-sm text-[var(--mercury)]">{weather.fatal}</p>
      ) : null}
    </div>
  )
}
