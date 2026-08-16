"use client"

import { Button } from "@/components/ui/button"
import type { Place, PlaceId } from "@/lib/weather/types"
import { cn } from "@/lib/utils"

export function PlaceChips({
  places,
  activeId,
  onSelect,
}: {
  places: Place[]
  activeId: PlaceId | null
  onSelect: (place: Place) => void
}) {
  if (places.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {places.map((place) => {
        const active = place.id === activeId
        return (
          <li key={place.id}>
            <Button
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              aria-pressed={active}
              onClick={() => onSelect(place)}
              className={cn(
                "rounded-2xl",
                active && "bg-[var(--dusk)] text-[var(--mercury)]"
              )}
            >
              {place.name}
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
