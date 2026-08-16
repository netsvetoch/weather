import { getWeatherClient } from "@/lib/weather/server"
import { handleGeo } from "@/lib/weather/handlers"

export async function GET(request: Request) {
  const { status, body } = await handleGeo(new URL(request.url).searchParams, getWeatherClient())
  return Response.json(body, { status })
}
