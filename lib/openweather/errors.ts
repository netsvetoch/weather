import type { z } from "zod"

export type OpenWeatherError =
  | { type: "validation"; issues: z.core.$ZodIssue[] }
  | { type: "network"; cause: unknown }
  | { type: "http"; status: number; cod?: string | number; message: string }
  | { type: "parse"; issues: z.core.$ZodIssue[] }
