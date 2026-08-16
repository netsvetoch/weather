import type { Snapshot } from "@/lib/weather/types"

const POINTS = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"] as const

export function windPoint(deg: number) {
  const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return POINTS[index]!
}

export function formatCityClock(
  unixSeconds: number,
  timezoneOffsetSeconds: number
) {
  const shifted = new Date((unixSeconds + timezoneOffsetSeconds) * 1000)
  const hours = String(shifted.getUTCHours()).padStart(2, "0")
  const minutes = String(shifted.getUTCMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function FactsRow({ snapshot }: { snapshot: Snapshot }) {
  const { current } = snapshot
  const timezone = current.timezone

  return (
    <section className="grid grid-cols-2 gap-3 rounded-2xl bg-[var(--glass)] px-4 py-4">
      <Fact label="Влажность" value={`${current.main.humidity}%`} />
      <Fact
        label="Ветер"
        value={`${Math.round(current.wind.speed)} м/с ${windPoint(current.wind.deg)}`}
      />
      <Fact label="Давление" value={`${current.main.pressure} гПа`} />
      <Fact
        label="Восход / закат"
        value={`${formatCityClock(current.sys.sunrise, timezone)} / ${formatCityClock(current.sys.sunset, timezone)}`}
      />
    </section>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] tracking-[0.14em] text-[var(--fogline)] uppercase">
        {label}
      </p>
      <p className="text-sm text-[var(--mercury)]">{value}</p>
    </div>
  )
}
