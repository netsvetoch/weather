"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export default function Card1({
  label,
  children,
  className,
}: {
  label: string
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-[var(--glass)] px-4 py-4",
        className
      )}
    >
      <p className="text-xs font-medium tracking-[0.18em] text-[var(--fogline)] uppercase">
        {label}
      </p>
      {children}
    </section>
  )
}
