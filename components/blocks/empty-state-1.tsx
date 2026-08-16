"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const GHOST_ROWS = [
  [72, 40, 28],
  [56, 52, 36],
  [64, 34, 44],
  [48, 46, 30],
]

export default function EmptyState1({
  title = "Куда смотрим",
  children,
}: {
  title?: string
  children?: ReactNode
}) {
  return (
    <div className="flex w-full flex-col">
      <div className="relative mb-8" aria-hidden>
        <div className="rounded-2xl border border-[color-mix(in_oklab,var(--fogline)_24%,transparent)] bg-[var(--glass)] p-1">
          <div className="space-y-1 rounded-2xl p-1">
            {GHOST_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ opacity: 1 - i * 0.22 }}
              >
                <span className="h-5 w-5 shrink-0 rounded-md bg-[color-mix(in_oklab,var(--fogline)_18%,transparent)]" />
                {row.map((width, j) => (
                  <span
                    key={j}
                    className="h-2 rounded-full bg-[color-mix(in_oklab,var(--fogline)_18%,transparent)]"
                    style={{ width: `${width}px` }}
                  />
                ))}
                <span className="ml-auto h-2 w-10 rounded-full bg-[color-mix(in_oklab,var(--fogline)_18%,transparent)]" />
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--ink)]" />
      </div>
      <h1 className="text-center text-xl font-medium tracking-[-0.02em] text-[var(--mercury)]">
        {title}
      </h1>
      <div className={cn("mt-5 flex flex-col gap-3")}>{children}</div>
    </div>
  )
}
