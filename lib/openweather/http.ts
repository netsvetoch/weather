import { err, errAsync, ok, okAsync, Result, ResultAsync } from "neverthrow"
import type { z } from "zod"
import type { OpenWeatherError } from "./errors"
import { errorBodySchema } from "./schemas/error"

export type HttpDeps = {
  apiKey: string
  baseUrl: string
  fetch: typeof globalThis.fetch
}

export function buildUrl(
  baseUrl: string,
  path: string,
  query: Record<string, string | number | undefined>,
  apiKey: string,
): string {
  const base = baseUrl.replace(/\/$/, "")
  const url = new URL(`${base}${path}`)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  url.searchParams.set("appid", apiKey)
  return url.toString()
}

export function parseInput<T>(
  schema: z.ZodType<T>,
  data: unknown,
): Result<T, OpenWeatherError> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return err({ type: "validation", issues: parsed.error.issues })
  }
  return ok(parsed.data)
}

export function request<T>(
  deps: HttpDeps,
  args: {
    path: string
    query: Record<string, string | number | undefined>
    signal?: AbortSignal
    schema: z.ZodType<T>
  },
): ResultAsync<T, OpenWeatherError> {
  const url = buildUrl(deps.baseUrl, args.path, args.query, deps.apiKey)
  return ResultAsync.fromPromise(
    deps.fetch(url, { signal: args.signal }),
    (cause): OpenWeatherError => ({ type: "network", cause }),
  ).andThen((response) =>
    ResultAsync.fromPromise(
      response.text(),
      (cause): OpenWeatherError => ({ type: "network", cause }),
    ).andThen((text) => {
      if (!response.ok) {
        const body = errorBodySchema.safeParse(tryJson(text))
        if (body.success) {
          return errAsync<never, OpenWeatherError>({
            type: "http",
            status: response.status,
            cod: body.data.cod,
            message: body.data.message,
          })
        }
        return errAsync<never, OpenWeatherError>({
          type: "http",
          status: response.status,
          message: response.statusText,
        })
      }

      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        return errAsync<never, OpenWeatherError>({
          type: "parse",
          issues: [
            {
              code: "custom",
              path: [],
              message: "Invalid JSON",
              input: text,
            },
          ],
        })
      }

      const parsed = args.schema.safeParse(json)
      if (!parsed.success) {
        return errAsync<never, OpenWeatherError>({
          type: "parse",
          issues: parsed.error.issues,
        })
      }
      return okAsync(parsed.data)
    }),
  )
}

function tryJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
