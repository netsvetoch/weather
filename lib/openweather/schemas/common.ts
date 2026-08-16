import { z } from "zod"
import { langSchema } from "../types/lang"
import {
  type Units,
  type WindSpeed,
  unitsSchema,
  windSpeedSchema,
} from "../types/units"

export { langSchema, unitsSchema }

export const latSchema = z.number().gte(-90).lte(90)
export const lonSchema = z.number().gte(-180).lte(180)
export const coordInputSchema = z.object({
  lat: latSchema,
  lon: lonSchema,
})

export const coordSchema = z.object({
  lon: z.number(),
  lat: z.number(),
})

export const weatherMainSchema = z.enum([
  "Thunderstorm",
  "Drizzle",
  "Rain",
  "Snow",
  "Atmosphere",
  "Clear",
  "Clouds",
])
export type WeatherMain = z.infer<typeof weatherMainSchema>

export const weatherIconSchema = z.string().regex(/^\d{2}[dn]$/)

export const weatherItemSchema = z.object({
  id: z.number(),
  main: weatherMainSchema,
  description: z.string(),
  icon: weatherIconSchema,
})
export type WeatherItem = z.infer<typeof weatherItemSchema>

export const cloudsSchema = z.object({
  all: z.number().gte(0).lte(100),
})

export const rain1hSchema = z.object({ "1h": z.number() })
export const snow1hSchema = z.object({ "1h": z.number() })
export const rain3hSchema = z.object({ "3h": z.number() })
export const snow3hSchema = z.object({ "3h": z.number() })

export function windSchema<U extends Units>(units: U) {
  return z.object({
    speed: windSpeedSchema(units),
    deg: z.number(),
    gust: windSpeedSchema(units).optional(),
  })
}

export type Wind<U extends Units> = {
  speed: WindSpeed<U>
  deg: number
  gust?: WindSpeed<U>
}

export const limitSchema = z.number().int().gte(1).lte(5)
export const cntSchema = z.number().int().gte(1).lte(40)
export const countrySchema = z.string().regex(/^[A-Za-z]{2}$/)
export const unixSecondsSchema = z.number().finite()
