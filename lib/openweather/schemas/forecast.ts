import { z } from "zod"
import {
  cloudsSchema,
  cntSchema,
  coordInputSchema,
  coordSchema,
  langSchema,
  rain3hSchema,
  snow3hSchema,
  unitsSchema,
  weatherItemSchema,
  windSchema,
  type Wind,
} from "./common"
import type { Temperature, Units } from "../types/units"
import { temperatureSchema } from "../types/units"

export const forecastInputSchema = coordInputSchema.extend({
  cnt: cntSchema.optional(),
  units: unitsSchema.optional(),
  lang: langSchema.optional(),
})

export type ForecastItem<U extends Units = "standard"> = {
  dt: number
  main: {
    temp: Temperature<U>
    feels_like: Temperature<U>
    temp_min: Temperature<U>
    temp_max: Temperature<U>
    pressure: number
    sea_level?: number
    grnd_level?: number
    humidity: number
    temp_kf: Temperature<U>
  }
  weather: Array<{
    id: number
    main: z.infer<typeof weatherItemSchema>["main"]
    description: string
    icon: string
  }>
  clouds: { all: number }
  wind: Wind<U>
  visibility?: number
  pop: number
  rain?: { "3h": number }
  snow?: { "3h": number }
  sys: { pod: "d" | "n" }
  dt_txt: string
}

export type Forecast<U extends Units = "standard"> = {
  cod: string
  message: number | string
  cnt: number
  list: ForecastItem<U>[]
  city: {
    id: number
    name: string
    coord: { lat: number; lon: number }
    country: string
    population: number
    timezone: number
    sunrise: number
    sunset: number
  }
}

export function forecastSchema<U extends Units>(
  units: U,
): z.ZodType<Forecast<U>> {
  const main = z.object({
    temp: temperatureSchema(units),
    feels_like: temperatureSchema(units),
    temp_min: temperatureSchema(units),
    temp_max: temperatureSchema(units),
    pressure: z.number(),
    sea_level: z.number().optional(),
    grnd_level: z.number().optional(),
    humidity: z.number(),
    temp_kf: temperatureSchema(units),
  })

  return z.object({
    cod: z.string(),
    message: z.union([z.number(), z.string()]),
    cnt: z.number(),
    list: z.array(
      z.object({
        dt: z.number(),
        main,
        weather: z.array(weatherItemSchema).min(1),
        clouds: cloudsSchema,
        wind: windSchema(units),
        visibility: z.number().optional(),
        pop: z.number().gte(0).lte(1),
        rain: rain3hSchema.optional(),
        snow: snow3hSchema.optional(),
        sys: z.object({ pod: z.enum(["d", "n"]) }),
        dt_txt: z.string(),
      }),
    ),
    city: z.object({
      id: z.number(),
      name: z.string(),
      coord: coordSchema,
      country: z.string(),
      population: z.number(),
      timezone: z.number(),
      sunrise: z.number(),
      sunset: z.number(),
    }),
  }) as unknown as z.ZodType<Forecast<U>>
}
