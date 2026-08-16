import { getWeatherClient } from "@/lib/weather/server"
import { handleWeather } from "@/lib/weather/handlers"

export async function GET(request: Request) {
  const { status, body } = await handleWeather(new URL(request.url).searchParams, getWeatherClient())
  return Response.json(body, { status })
}
