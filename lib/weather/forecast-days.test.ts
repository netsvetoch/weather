import { expect, test } from "vitest"
import type { ForecastItem } from "@/lib/openweather"
import { groupForecastDays } from "./forecast-days"

function item(dt: number, tempMin: number, tempMax: number, icon: string): ForecastItem<"metric"> {
  return {
    dt,
    main: {
      temp: tempMax as ForecastItem<"metric">["main"]["temp"],
      feels_like: tempMax as ForecastItem<"metric">["main"]["feels_like"],
      temp_min: tempMin as ForecastItem<"metric">["main"]["temp_min"],
      temp_max: tempMax as ForecastItem<"metric">["main"]["temp_max"],
      pressure: 1015,
      humidity: 64,
      temp_kf: 0 as ForecastItem<"metric">["main"]["temp_kf"],
    },
    weather: [{ id: 800, main: "Clear", description: "ясно", icon }],
    clouds: { all: 0 },
    wind: { speed: 1 as ForecastItem<"metric">["wind"]["speed"], deg: 10 },
    pop: 0,
    sys: { pod: "d" },
    dt_txt: "2022-08-30 12:00:00",
  }
}

test("groups 3-hour slots into local calendar days", () => {
  const tz = 7200
  const day1noon = 1661853600
  const day1eve = 1661871600
  const day2noon = 1661940000
  const days = groupForecastDays(
    [
      item(day1noon, 10, 20, "01d"),
      item(day1eve, 8, 18, "02d"),
      item(day2noon, 12, 22, "10d"),
    ],
    tz,
  )
  expect(days).toHaveLength(2)
  expect(days[0]?.date).toBe("2022-08-30")
  expect(days[0]?.min).toBe(8)
  expect(days[0]?.max).toBe(20)
  expect(days[0]?.slots).toHaveLength(2)
  expect(days[0]?.icon).toBe("01d")
  expect(days[1]?.date).toBe("2022-08-31")
  expect(days[1]?.icon).toBe("10d")
})

test("caps at 5 days", () => {
  const tz = 0
  const start = 1_661_836_800
  const list = Array.from({ length: 16 }, (_, i) => item(start + i * 86400, 1, 2, "01d"))
  expect(groupForecastDays(list, tz)).toHaveLength(5)
})
