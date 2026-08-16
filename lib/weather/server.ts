import { createOpenWeatherClient, type OpenWeatherClient } from "@/lib/openweather"

export function getWeatherClient(): OpenWeatherClient<"metric"> | null {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY
  if (!apiKey) return null
  return createOpenWeatherClient({ apiKey, units: "metric", lang: "ru" })
}
