import { getWeatherClient } from "@/lib/weather/server"
import { handleGeoReverse } from "@/lib/weather/handlers"

export async function GET(request: Request) {
  const { status, body } = await handleGeoReverse(new URL(request.url).searchParams, getWeatherClient())
  return Response.json(body, { status })
}
