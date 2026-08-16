import { z } from "zod"

export const errorBodySchema = z.object({
  cod: z.union([z.string(), z.number()]),
  message: z.string(),
})
export type ErrorBody = z.infer<typeof errorBodySchema>
