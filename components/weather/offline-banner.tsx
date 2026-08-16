export function OfflineBanner({ text }: { text: string }) {
  return (
    <p
      role="status"
      className="rounded-2xl bg-[var(--glass)] px-4 py-2.5 text-sm text-[var(--mercury)]"
    >
      {text}
    </p>
  )
}
