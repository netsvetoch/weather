"use client"

import { Fraunces } from "next/font/google"

import { CityScreen } from "@/components/weather/city-screen"
import { OfflineBanner } from "@/components/weather/offline-banner"
import { SearchEmpty } from "@/components/weather/search-empty"
import { WeatherBackdrop } from "@/components/weather/weather-backdrop"
import { useWeather } from "@/hooks/use-weather"
import { cn } from "@/lib/utils"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
})

export function WeatherApp() {
  const weather = useWeather()
  const main = weather.snapshot?.current.weather[0]?.main

  if (!weather.ready) {
    return <div className="min-h-dvh bg-[var(--ink)]" />
  }

  return (
    <div
      className={cn(
        fraunces.variable,
        "relative min-h-dvh overflow-hidden bg-[var(--ink)] text-[var(--mercury)]"
      )}
    >
      <WeatherBackdrop main={main} />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col px-4">
        {weather.banner ? (
          <div className="pt-4">
            <OfflineBanner text={weather.banner} />
          </div>
        ) : null}
        {weather.store.activeId ? (
          <CityScreen weather={weather} />
        ) : (
          <SearchEmpty weather={weather} />
        )}
      </div>
      {weather.toast ? (
        <p
          role="status"
          className="fixed bottom-4 left-1/2 z-20 w-[min(100%-2rem,32rem)] -translate-x-1/2 rounded-2xl bg-[var(--dusk)] px-4 py-3 text-center text-sm text-[var(--mercury)]"
        >
          {weather.toast}
        </p>
      ) : null}
    </div>
  )
}
