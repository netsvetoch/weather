import { z } from "zod"
import { coordInputSchema, coordSchema, unixSecondsSchema } from "./common"

export const airInputSchema = coordInputSchema

export const airHistoryInputSchema = coordInputSchema
  .extend({
    start: unixSecondsSchema,
    end: unixSecondsSchema,
  })
  .refine((value) => value.start < value.end, {
    message: "start must be less than end",
    path: ["start"],
  })

export const airQualityIndexSchema = z
  .number()
  .transform((value) => Math.trunc(value))
  .pipe(
    z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),
  )
export type AirQualityIndex = z.infer<typeof airQualityIndexSchema>

const airCoordSchema = z.union([
  z.tuple([z.number(), z.number()]),
  coordSchema.transform((coord): [number, number] => [coord.lon, coord.lat]),
])

export const airPollutionSchema = z.object({
  coord: airCoordSchema,
  list: z.array(
    z.object({
      dt: z.number(),
      main: z.object({
        aqi: airQualityIndexSchema,
      }),
      components: z.object({
        co: z.number(),
        no: z.number(),
        no2: z.number(),
        o3: z.number(),
        so2: z.number(),
        pm2_5: z.number(),
        pm10: z.number(),
        nh3: z.number(),
      }),
    }),
  ),
})
export type AirPollution = z.infer<typeof airPollutionSchema>
