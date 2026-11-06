import MagicCircle from './MagicCircle'

export default function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden py-14 text-center">
      <MagicCircle size={220} className="absolute opacity-25" />
      <div className="relative font-display text-sm font-bold tracking-[0.3em] text-glow/90">{title}</div>
      <p className="relative mt-2 max-w-xs text-sm text-muted">{body}</p>
    </div>
  )
}
