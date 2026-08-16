import { z } from "zod"

export const unitsSchema = z.enum(["standard", "metric", "imperial"])
export type Units = z.infer<typeof unitsSchema>

export type Temperature<U extends Units> = U extends "metric"
  ? number & z.$brand<"Celsius">
  : U extends "imperial"
    ? number & z.$brand<"Fahrenheit">
    : number & z.$brand<"Kelvin">

export type WindSpeed<U extends Units> = U extends "imperial"
  ? number & z.$brand<"mph">
  : number & z.$brand<"m/s">

export type ResolveUnits<ClientU extends Units, R> = R extends {
  units: infer RU extends Units
}
  ? RU
  : ClientU

export function temperatureSchema<U extends Units>(
  units: U,
): z.ZodType<Temperature<U>> {
  if (units === "metric") {
    return z.number().brand<"Celsius">() as unknown as z.ZodType<Temperature<U>>
  }
  if (units === "imperial") {
    return z.number().brand<"Fahrenheit">() as unknown as z.ZodType<Temperature<U>>
  }
  return z.number().brand<"Kelvin">() as unknown as z.ZodType<Temperature<U>>
}

export function windSpeedSchema<U extends Units>(
  units: U,
): z.ZodType<WindSpeed<U>> {
  if (units === "imperial") {
    return z.number().brand<"mph">() as unknown as z.ZodType<WindSpeed<U>>
  }
  return z.number().brand<"m/s">() as unknown as z.ZodType<WindSpeed<U>>
}
