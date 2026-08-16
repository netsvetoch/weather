"use client"

import type { Place } from "@/lib/weather/types"
import type { Snapshot } from "@/lib/weather/types"

export function CurrentHero({
  place,
  snapshot,
}: {
  place: Place
  snapshot: Snapshot
}) {
  const current = snapshot.current
  const description = current.weather[0]?.description ?? ""

  return (
    <header className="flex flex-col items-start pt-6">
      <p className="text-xs font-medium tracking-[0.18em] text-[var(--fogline)] uppercase">
        {place.name}
      </p>
      <div className="mt-4 flex items-stretch gap-4">
        <span
          aria-hidden
          className="mt-3 w-px self-stretch bg-[var(--flare)]"
        />
        <p className="font-display text-[7.5rem] leading-[0.85] tracking-tighter text-[var(--flare)]">
          {Math.round(current.main.temp)}°
        </p>
      </div>
      <p className="mt-4 text-sm text-[var(--mercury)] capitalize">
        {description}
      </p>
      <p className="mt-1 text-sm text-[var(--fogline)]">
        ощущается как {Math.round(current.main.feels_like)}°
      </p>
    </header>
  )
}
