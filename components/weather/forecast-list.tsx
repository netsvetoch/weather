"use client"

import { useState } from "react"

import { groupForecastDays } from "@/lib/weather/forecast-days"
import type { Snapshot } from "@/lib/weather/types"
import { formatCityClock } from "@/components/weather/facts-row"

export function ForecastList({ snapshot }: { snapshot: Snapshot }) {
  const timezone = snapshot.forecast.city.timezone
  const days = groupForecastDays(snapshot.forecast.list, timezone)
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section className="rounded-2xl bg-[var(--glass)] px-2 py-2">
      <ul className="flex flex-col">
        {days.map((day) => {
          const expanded = open === day.date
          return (
            <li key={day.date}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : day.date)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[var(--mercury)] hover:bg-[color-mix(in_oklab,var(--glass)_70%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--fogline)] focus-visible:outline-none"
              >
                <img
                  src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8"
                />
                <span className="flex-1 text-sm capitalize">
                  {formatDayLabel(day.date)}
                </span>
                <span className="font-mono text-sm text-[var(--fogline)]">
                  {Math.round(day.min)}° / {Math.round(day.max)}°
                </span>
              </button>
              {expanded ? (
                <ul className="grid grid-cols-2 gap-2 px-3 pb-3 sm:grid-cols-4">
                  {day.slots.map((slot) => (
                    <li
                      key={slot.dt}
                      className="flex flex-col items-center rounded-2xl bg-[color-mix(in_oklab,var(--ink)_35%,transparent)] px-2 py-2"
                    >
                      <span className="font-mono text-xs text-[var(--fogline)]">
                        {formatCityClock(slot.dt, timezone)}
                      </span>
                      <img
                        src={`https://openweathermap.org/img/wn/${slot.weather[0]!.icon}.png`}
                        alt={slot.weather[0]!.description}
                        width={32}
                        height={32}
                        className="size-8"
                      />
                      <span className="text-sm text-[var(--mercury)]">
                        {Math.round(slot.main.temp)}°
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function formatDayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  const value = new Date(Date.UTC(year!, month! - 1, day!))
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(value)
}
