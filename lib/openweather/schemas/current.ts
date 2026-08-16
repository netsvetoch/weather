import { z } from "zod"
import {
  cloudsSchema,
  coordInputSchema,
  coordSchema,
  langSchema,
  rain1hSchema,
  snow1hSchema,
  unitsSchema,
  weatherItemSchema,
  windSchema,
  type Wind,
} from "./common"
import type { Temperature, Units } from "../types/units"
import { temperatureSchema } from "../types/units"

export const currentInputSchema = coordInputSchema.extend({
  units: unitsSchema.optional(),
  lang: langSchema.optional(),
})

export type CurrentWeather<U extends Units = "standard"> = {
  coord: { lon: number; lat: number }
  weather: Array<{
    id: number
    main: z.infer<typeof weatherItemSchema>["main"]
    description: string
    icon: string
  }>
  base: string
  main: {
    temp: Temperature<U>
    feels_like: Temperature<U>
    temp_min: Temperature<U>
    temp_max: Temperature<U>
    pressure: number
    humidity: number
    sea_level?: number
    grnd_level?: number
  }
  visibility?: number
  wind: Wind<U>
  rain?: { "1h": number }
  snow?: { "1h": number }
  clouds: { all: number }
  dt: number
  sys: {
    type?: number
    id?: number
    message?: number | string
    country: string
    sunrise: number
    sunset: number
  }
  timezone: number
  id: number
  name: string
  cod: number
}

export function currentWeatherSchema<U extends Units>(
  units: U,
): z.ZodType<CurrentWeather<U>> {
  return z.object({
    coord: coordSchema,
    weather: z.array(weatherItemSchema).min(1),
    base: z.string(),
    main: z.object({
      temp: temperatureSchema(units),
      feels_like: temperatureSchema(units),
      temp_min: temperatureSchema(units),
      temp_max: temperatureSchema(units),
      pressure: z.number(),
      humidity: z.number(),
      sea_level: z.number().optional(),
      grnd_level: z.number().optional(),
    }),
    visibility: z.number().optional(),
    wind: windSchema(units),
    rain: rain1hSchema.optional(),
    snow: snow1hSchema.optional(),
    clouds: cloudsSchema,
    dt: z.number(),
    sys: z.object({
      type: z.number().optional(),
      id: z.number().optional(),
      message: z.union([z.number(), z.string()]).optional(),
      country: z.string(),
      sunrise: z.number(),
      sunset: z.number(),
    }),
    timezone: z.number(),
    id: z.number(),
    name: z.string(),
    cod: z.number(),
  }) as unknown as z.ZodType<CurrentWeather<U>>
}
