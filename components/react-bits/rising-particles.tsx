"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface RisingParticlesProps {
  /** How fast the motes climb */
  speed?: number;
  /** How many motes are in the air */
  count?: number;
  /** Diameter of the smallest mote, in screen heights */
  minSize?: number;
  /** Diameter of the largest mote, in screen heights */
  maxSize?: number;
  /** Horizontal reach of the field, 1 fills a square viewport */
  spread?: number;
  /** How far a mote drifts sideways as it rises */
  sway?: number;
  /** How quickly that drift oscillates */
  swayRate?: number;
  /** Difference in speed and scale between the nearest and farthest motes */
  depth?: number;
  /** Radius of the solid centre, as a fraction of the mote */
  coreSize?: number;
  /** Edge softness of that centre */
  coreSoftness?: number;
  /** Brightness of the halo around each mote */
  glow?: number;
  /** How steeply the halo falls off, higher is tighter */
  glowFalloff?: number;
  /** How far into the top and bottom edges a mote fades */
  fade?: number;
  /** Overall brightness before the highlight rolloff */
  gain?: number;
  /** How much the brightest cores wash out toward white */
  bloom?: number;
  /** Colour of the nearest motes */
  color?: string;
  /** Colour of the farthest motes */
  farColor?: string;
  /** Film grain strength, 0 to 1 */
  grain?: number;
  /** Grain refreshes per second */
  grainRate?: number;
  /** Corner darkening, 0 to 1 */
  vignette?: number;
  /** Panel backdrop, or "transparent" to show the page through */
  backgroundColor?: string;
  /** Master alpha */
  opacity?: number;
  /** Let the pointer push motes out of the way */
  cursorInteraction?: boolean;
  /** How far motes are pushed */
  cursorPush?: number;
  /** Reach of that push */
  cursorRadius?: number;
  /** Freeze the animation */
  paused?: boolean;
  /** Scale back resolution when the frame budget slips */
  adaptiveQuality?: boolean;
  /** Frame rate the quality meter aims to hold */
  targetFps?: number;
  /** Upper device pixel ratio bound */
  dpr?: number;
  className?: string;
  children?: ReactNode;
}

const motesVertex = `
varying vec2 vPlane;

void main() {
  vPlane = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
`;

const buildMotesFragment = (count: number) => `
precision highp float;

varying vec2 vPlane;

uniform vec2 uCanvas;
uniform float uClock;
uniform float uSpeed;
uniform float uMinSize;
uniform float uMaxSize;
uniform float uSpread;
uniform float uSway;
uniform float uSwayRate;
uniform float uDepth;
uniform float uCoreSize;
uniform float uCoreSoft;
uniform float uGlow;
uniform float uFalloff;
uniform float uFade;
uniform float uGain;
uniform float uBloom;
uniform float uGrain;
uniform float uGrainRate;
uniform float uVignette;
uniform vec3 uNear;
uniform vec3 uFar;
uniform vec3 uBackdrop;
uniform float uBackdropAlpha;
uniform float uOpacity;
uniform vec2 uPointer;
uniform float uPush;
uniform float uReach;

float spark(vec2 seed) {
  vec3 drift = fract(vec3(seed.xyx) * vec3(0.1031, 0.1030, 0.0973));
  drift += dot(drift, drift.yzx + 33.33);
  return fract((drift.x + drift.y) * drift.z);
}

float shuffle(float n) {
  n = fract(n * 0.1031);
  n *= n + 33.33;
  n *= n + n;
  return fract(n);
}

float softClip(float x) {
  float fall = exp(-2.0 * max(x, 0.0));
  return (1.0 - fall) / (1.0 + fall);
}

void main() {
  vec2 pixel = vPlane * uCanvas;
  vec2 field = (pixel * 2.0 - uCanvas) / max(uCanvas.y, 1.0);

  float t = uClock;
  float reach = max(uReach, 0.02);

  vec3 tally = vec3(0.0);
  float weight = 0.0;

  for (int i = 0; i < ${count}; i++) {
    float k = (float(i) + 0.5) / ${count}.0;

    float seedA = shuffle(k * 97.13 + 3.17);
    float seedB = shuffle(k * 148.77 + 19.41);
    float seedC = shuffle(k * 211.29 + 57.83);
    float seedD = shuffle(k * 263.51 + 91.07);

    float plane = mix(1.0 - uDepth, 1.0, seedA);

    float climb = fract(seedC + t * uSpeed * 0.125 * (0.4 + plane * 0.8));
    float y = climb * 2.0 - 1.0;

    float lane = (shuffle(k * 331.7 + 7.9) * 2.0 - 1.0) * uSpread * 2.0;

    float wobble =
      sin(y * (1.2 + seedD * 1.6) + t * uSwayRate + seedB * 6.2832) * 0.62 +
      sin(y * (2.7 + seedC * 2.0) - t * uSwayRate * 0.63 + seedC * 6.2832) *
        0.38;

    vec2 seat = vec2(lane + wobble * uSway * (0.4 + seedD * 0.8), y);

    vec2 away = seat - uPointer;
    float grip = exp(-dot(away, away) / (reach * reach));
    seat += away / max(length(away), 0.06) * grip * uPush;

    float scale = mix(uMinSize, uMaxSize, seedB) * plane;
    float radius = max(scale * 0.5, 1e-4);

    float d = length(field - seat);

    float rim = radius * max(uCoreSize, 0.02);
    float core = 1.0 - smoothstep(rim * (1.0 - uCoreSoft), rim, d);

    float halo = pow(radius / max(d, 1e-3), uFalloff) * uGlow;

    float edge = max(uFade, 1e-3);
    float alive = smoothstep(-1.0, -1.0 + edge, y) * smoothstep(1.0, 1.0 - edge, y);

    float lit = (core + halo) * alive * (0.35 + plane * 0.65);
    tally += mix(uFar, uNear, seedA) * lit;
    weight += lit;
  }

  float mass = softClip(weight * uGain);
  vec3 tint = tally / max(weight, 1e-4);
  tint = mix(tint, vec3(1.0), uBloom * smoothstep(0.35, 1.0, mass));

  float vig = smoothstep(1.35, 0.25, length(field));
  float shade = (1.0 - uVignette) + uVignette * vig;
  mass *= shade;

  float tick = floor(uClock * max(uGrainRate, 1.0));
  float speck = spark(pixel + tick * 17.0) - 0.5;
  mass = clamp(mass * (1.0 + speck * uGrain * mass * (1.0 - mass) * 8.0), 0.0, 1.0);

  vec3 col = tint * mass;
  float rest = uBackdropAlpha * (1.0 - mass);
  gl_FragColor = vec4(col + uBackdrop * rest, mass + rest) * uOpacity;
}
`;

const literal = (hex: string, fallback: string) => {
  const shade = new THREE.Color();
  try {
    shade.setStyle(hex, THREE.LinearSRGBColorSpace);
  } catch {
    shade.setStyle(fallback, THREE.LinearSRGBColorSpace);
  }
  return shade;
};

const repaint = (target: THREE.Color, hex: string) => {
  try {
    target.setStyle(hex, THREE.LinearSRGBColorSpace);
  } catch {
    return;
  }
};

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

const subscribeToScreen = (notify: () => void) => {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(min-resolution: 2dppx)");
  media.addEventListener("change", notify);
  window.addEventListener("resize", notify);
  return () => {
    media.removeEventListener("change", notify);
    window.removeEventListener("resize", notify);
  };
};

const readScreenDpr = () =>
  typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

const isClear = (paint: string) =>
  paint === "transparent" || paint === "none" || paint === "";

interface PointerState {
  x: number;
  y: number;
  inside: boolean;
}

interface MoteFieldProps {
  speed: number;
  count: number;
  minSize: number;
  maxSize: number;
  spread: number;
  sway: number;
  swayRate: number;
  depth: number;
  coreSize: number;
  coreSoftness: number;
  glow: number;
  glowFalloff: number;
  fade: number;
  gain: number;
  bloom: number;
  color: string;
  farColor: string;
  grain: number;
  grainRate: number;
  vignette: number;
  backgroundColor: string;
  opacity: number;
  cursorInteraction: boolean;
  cursorPush: number;
  cursorRadius: number;
  paused: boolean;
  adaptiveQuality: boolean;
  targetFps: number;
  ceiling: number;
  readPointer: () => PointerState;
}

const MoteField = ({
  speed,
  count,
  minSize,
  maxSize,
  spread,
  sway,
  swayRate,
  depth,
  coreSize,
  coreSoftness,
  glow,
  glowFalloff,
  fade,
  gain,
  bloom,
  color,
  farColor,
  grain,
  grainRate,
  vignette,
  backgroundColor,
  opacity,
  cursorInteraction,
  cursorPush,
  cursorRadius,
  paused,
  adaptiveQuality,
  targetFps,
  ceiling,
  readPointer,
}: MoteFieldProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const clock = useRef(0);
  const glide = useRef({ x: 0, y: 0, push: 0 });
  const budget = useRef({ frames: 0, span: 0, wins: 0, cap: 4 });
  const { gl, size } = useThree();

  const swarm = Math.round(clamp(count, 4, 260));

  const fragment = useMemo(() => buildMotesFragment(swarm), [swarm]);

  const uniforms = useMemo(
    () => ({
      uCanvas: { value: new THREE.Vector2(1, 1) },
      uClock: { value: 0 },
      uSpeed: { value: 1 },
      uMinSize: { value: 0.02 },
      uMaxSize: { value: 0.06 },
      uSpread: { value: 1 },
      uSway: { value: 0.05 },
      uSwayRate: { value: 0.6 },
      uDepth: { value: 0.65 },
      uCoreSize: { value: 0.35 },
      uCoreSoft: { value: 0.85 },
      uGlow: { value: 1 },
      uFalloff: { value: 2 },
      uFade: { value: 0.35 },
      uGain: { value: 0.9 },
      uBloom: { value: 0.35 },
      uGrain: { value: 0.04 },
      uGrainRate: { value: 24 },
      uVignette: { value: 0.25 },
      uNear: { value: literal("#b34dff", "#b34dff") },
      uFar: { value: literal("#5b2bd9", "#5b2bd9") },
      uBackdrop: { value: literal("#0a0a0a", "#0a0a0a") },
      uBackdropAlpha: { value: 1 },
      uOpacity: { value: 1 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPush: { value: 0 },
      uReach: { value: 0.35 },
    }),
    [],
  );

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    material.fragmentShader = fragment;
    material.needsUpdate = true;
  }, [fragment]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    repaint(material.uniforms.uNear.value, color);
    repaint(material.uniforms.uFar.value, farColor);
    const clear = isClear(backgroundColor);
    material.uniforms.uBackdropAlpha.value = clear ? 0 : 1;
    if (!clear) repaint(material.uniforms.uBackdrop.value, backgroundColor);
  }, [color, farColor, backgroundColor]);

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;

    const beat = Math.min(delta, 0.05);
    if (!paused) clock.current += beat;

    const ratio = gl.getPixelRatio();
    const set = material.uniforms;
    set.uCanvas.value.set(size.width * ratio, size.height * ratio);
    set.uClock.value = clock.current;
    set.uSpeed.value = speed;
    set.uMinSize.value = minSize;
    set.uMaxSize.value = Math.max(maxSize, minSize);
    set.uSpread.value = spread;
    set.uSway.value = sway;
    set.uSwayRate.value = swayRate;
    set.uDepth.value = clamp(depth, 0, 0.95);
    set.uCoreSize.value = coreSize;
    set.uCoreSoft.value = clamp(coreSoftness, 0.02, 0.99);
    set.uGlow.value = glow;
    set.uFalloff.value = glowFalloff;
    set.uFade.value = fade;
    set.uGain.value = gain;
    set.uBloom.value = clamp(bloom, 0, 1);
    set.uGrain.value = grain;
    set.uGrainRate.value = grainRate;
    set.uVignette.value = vignette;
    set.uOpacity.value = opacity;
    set.uReach.value = cursorRadius;

    const span = size.height || 1;
    const wide = (size.width || 1) / span;
    const pointer = readPointer();
    const ease = 1 - Math.exp(-beat * 6);
    const aimX = cursorInteraction ? (pointer.x * 2 - 1) * wide : 0;
    const aimY = cursorInteraction ? pointer.y * 2 - 1 : 0;
    const aimPush =
      cursorInteraction && pointer.inside ? Math.max(cursorPush, 0) : 0;
    glide.current.x += (aimX - glide.current.x) * ease;
    glide.current.y += (aimY - glide.current.y) * ease;
    glide.current.push += (aimPush - glide.current.push) * ease;
    set.uPointer.value.set(glide.current.x, glide.current.y);
    set.uPush.value = glide.current.push;

    if (!adaptiveQuality) return;
    const meter = budget.current;
    meter.frames += 1;
    meter.span += delta;
    if (meter.span < 0.75) return;
    const fps = meter.frames / meter.span;
    meter.frames = 0;
    meter.span = 0;
    const roof = Math.min(ceiling, meter.cap);
    if (fps < targetFps * 0.85 && ratio > 0.6) {
      meter.wins = 0;
      meter.cap = Math.max(0.6, ratio * 0.9);
      gl.setPixelRatio(Math.max(0.6, ratio * 0.75));
    } else if (fps > targetFps * 0.98 && ratio < roof - 0.01) {
      meter.wins += 1;
      if (meter.wins >= 3) {
        meter.wins = 0;
        gl.setPixelRatio(Math.min(roof, ratio * 1.25));
      }
    } else {
      meter.wins = 0;
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={motesVertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        premultipliedAlpha
      />
    </mesh>
  );
};

export const RisingParticles = ({
  speed = 1,
  count = 100,
  minSize = 0.02,
  maxSize = 0.06,
  spread = 1,
  sway = 0.05,
  swayRate = 0.6,
  depth = 0.65,
  coreSize = 0.35,
  coreSoftness = 0.85,
  glow = 1,
  glowFalloff = 2,
  fade = 0.35,
  gain = 0.9,
  bloom = 0.35,
  color = "#b34dff",
  farColor = "#5b2bd9",
  grain = 0.04,
  grainRate = 24,
  vignette = 0.25,
  backgroundColor = "#0a0a0a",
  opacity = 1,
  cursorInteraction = true,
  cursorPush = 0.12,
  cursorRadius = 0.35,
  paused = false,
  adaptiveQuality = true,
  targetFps = 60,
  dpr = 1.75,
  className,
  children,
}: RisingParticlesProps) => {
  const shell = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerState>({ x: 0.5, y: 0.5, inside: false });
  const [awake, setAwake] = useState(true);

  const screenDpr = useSyncExternalStore(
    subscribeToScreen,
    readScreenDpr,
    () => 1,
  );
  const ceiling = Math.min(screenDpr, Math.max(dpr, 0.5));

  const readPointer = useCallback(() => pointer.current, []);

  useEffect(() => {
    const node = shell.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const watcher = new IntersectionObserver(
      ([entry]) => setAwake(entry.isIntersecting),
      { threshold: 0 },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  useEffect(() => {
    const node = shell.current;
    if (!node || !cursorInteraction) return;

    const track = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height) return;
      pointer.current.x = clamp((event.clientX - box.left) / box.width, 0, 1);
      pointer.current.y = clamp(
        1 - (event.clientY - box.top) / box.height,
        0,
        1,
      );
      pointer.current.inside = true;
    };

    const reset = () => {
      pointer.current.inside = false;
    };

    node.addEventListener("pointermove", track);
    node.addEventListener("pointerleave", reset);
    return () => {
      node.removeEventListener("pointermove", track);
      node.removeEventListener("pointerleave", reset);
    };
  }, [cursorInteraction]);

  return (
    <div ref={shell} className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0">
        <Canvas
          orthographic
          dpr={ceiling}
          frameloop={awake ? "always" : "demand"}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <MoteField
            speed={speed}
            count={count}
            minSize={minSize}
            maxSize={maxSize}
            spread={spread}
            sway={sway}
            swayRate={swayRate}
            depth={depth}
            coreSize={coreSize}
            coreSoftness={coreSoftness}
            glow={glow}
            glowFalloff={glowFalloff}
            fade={fade}
            gain={gain}
            bloom={bloom}
            color={color}
            farColor={farColor}
            grain={grain}
            grainRate={grainRate}
            vignette={vignette}
            backgroundColor={backgroundColor}
            opacity={opacity}
            cursorInteraction={cursorInteraction}
            cursorPush={cursorPush}
            cursorRadius={cursorRadius}
            paused={paused}
            adaptiveQuality={adaptiveQuality}
            targetFps={targetFps}
            ceiling={ceiling}
            readPointer={readPointer}
          />
        </Canvas>
      </div>
      {children ? (
        <div className="relative z-10 h-full w-full">{children}</div>
      ) : null}
    </div>
  );
};

export default RisingParticles;
