import { z } from "zod"
import {
  coordInputSchema,
  countrySchema,
  limitSchema,
} from "./common"

export type GeoQueryObject = {
  city: string
  state?: string
  country?: string
}

export function joinGeoQuery(q: string | GeoQueryObject): string {
  if (typeof q === "string") return q
  if (q.state && q.country) return `${q.city},${q.state},${q.country}`
  if (q.country) return `${q.city},${q.country}`
  return q.city
}

const geoQueryObjectSchema = z
  .object({
    city: z.string().min(1),
    state: z.string().min(1).optional(),
    country: countrySchema.optional(),
  })
  .refine((value) => !value.state || value.country, {
    message: "state requires country",
    path: ["state"],
  })

export const geoDirectInputSchema = z.object({
  q: z.union([z.string().min(1), geoQueryObjectSchema]),
  limit: limitSchema.optional(),
})

export const geoZipInputSchema = z.object({
  zip: z.string().min(1),
  country: countrySchema,
})

export const geoReverseInputSchema = coordInputSchema.extend({
  limit: limitSchema.optional(),
})

export const geoPlaceSchema = z.object({
  name: z.string(),
  local_names: z.record(z.string(), z.string()).optional(),
  lat: z.number(),
  lon: z.number(),
  country: z.string(),
  state: z.string().optional(),
})
export type GeoPlace = z.infer<typeof geoPlaceSchema>

export const geoZipSchema = z.object({
  zip: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  country: z.string(),
})
export type GeoZip = z.infer<typeof geoZipSchema>
