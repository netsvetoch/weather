"use client"

import { useEffect, useState } from "react"

import FogSphere from "@/components/react-bits/fog-sphere"
import RisingParticles from "@/components/react-bits/rising-particles"
import SilkWaves from "@/components/react-bits/silk-waves"
import type { WeatherMain } from "@/lib/openweather/schemas/common"

const CLEAR_COLORS = [
  "#0B1220",
  "#10182A",
  "#1A2744",
  "#243656",
  "#3D4F5C",
  "#8BA3B5",
  "#C4D4C0",
  "#C4D4C0",
]

function StaticDusk() {
  return (
    <div
      className="absolute inset-0 h-full w-full"
      style={{
        background: "linear-gradient(180deg, var(--ink) 0%, var(--dusk) 100%)",
      }}
    />
  )
}

export function WeatherBackdrop({ main }: { main?: WeatherMain }) {
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    const media = globalThis.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduce(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  if (reduce || !main) {
    return (
      <div className="pointer-events-none absolute inset-0 h-full w-full">
        <StaticDusk />
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 h-full w-full opacity-35">
      {main === "Clear" ? (
        <SilkWaves
          className="absolute inset-0 h-full w-full"
          colors={CLEAR_COLORS}
          opacity={1}
          speed={0.6}
        />
      ) : null}
      {main === "Clouds" || main === "Atmosphere" ? (
        <FogSphere
          className="absolute inset-0"
          width="100%"
          height="100%"
          coreColor="#1A2744"
          glowColor="#C4D4C0"
          backgroundColor="#0B1220"
          opacity={1}
        />
      ) : null}
      {main === "Rain" ||
      main === "Drizzle" ||
      main === "Thunderstorm" ||
      main === "Snow" ? (
        <RisingParticles
          className="absolute inset-0 h-full w-full"
          color="#8BA3B5"
          farColor="#1A2744"
          backgroundColor="transparent"
          opacity={1}
          cursorInteraction={false}
        />
      ) : null}
    </div>
  )
}
