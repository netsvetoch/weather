import type { ForecastItem } from "@/lib/openweather"

export type ForecastDay = {
  date: string
  min: number
  max: number
  icon: string
  description: string
  slots: ForecastItem<"metric">[]
}

function localDate(dt: number, timezoneOffsetSeconds: number): string {
  const shifted = new Date((dt + timezoneOffsetSeconds) * 1000)
  const year = shifted.getUTCFullYear()
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0")
  const day = String(shifted.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function localHour(dt: number, timezoneOffsetSeconds: number): number {
  return new Date((dt + timezoneOffsetSeconds) * 1000).getUTCHours()
}

export function groupForecastDays(
  list: ForecastItem<"metric">[],
  timezoneOffsetSeconds: number,
): ForecastDay[] {
  const byDate = new Map<string, ForecastItem<"metric">[]>()
  for (const slot of list) {
    const date = localDate(slot.dt, timezoneOffsetSeconds)
    const bucket = byDate.get(date)
    if (bucket) bucket.push(slot)
    else byDate.set(date, [slot])
  }

  return [...byDate.entries()].slice(0, 5).map(([date, slots]) => {
    const noon = slots.reduce((best, slot) => {
      const bestDist = Math.abs(localHour(best.dt, timezoneOffsetSeconds) - 12)
      const nextDist = Math.abs(localHour(slot.dt, timezoneOffsetSeconds) - 12)
      return nextDist < bestDist ? slot : best
    }, slots[0]!)
    return {
      date,
      min: Math.min(...slots.map((slot) => slot.main.temp_min)),
      max: Math.max(...slots.map((slot) => slot.main.temp_max)),
      icon: noon.weather[0]!.icon,
      description: noon.weather[0]!.description,
      slots,
    }
  })
}
