import clsx from '../../lib/clsx'

interface Props { size?: number; className?: string; tone?: 'sys' | 'arcane' | 'ember' | 'danger'; spin?: boolean }

const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'

export default function MagicCircle({ size = 320, className, tone = 'sys', spin = true }: Props) {
  const color = tone === 'arcane' ? 'rgb(var(--c-secondary))' : tone === 'ember' ? 'rgb(var(--c-accent))' : tone === 'danger' ? 'rgb(var(--c-danger))' : 'rgb(var(--c-primary))'
  const id = `mc-${tone}`
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" className={clsx('pointer-events-none', className)} style={{ filter: `drop-shadow(0 0 12px ${color})` }} aria-hidden>
      <defs>
        <path id={`${id}-ring`} d="M200,200 m-150,0 a150,150 0 1,1 300,0 a150,150 0 1,1 -300,0" />
      </defs>
      <g className={spin ? 'animate-spinSlow' : ''} style={{ transformOrigin: '200px 200px' }}>
        <circle cx="200" cy="200" r="190" fill="none" stroke={color} strokeWidth="1.2" opacity="0.7" />
        <circle cx="200" cy="200" r="178" fill="none" stroke={color} strokeWidth="0.6" strokeDasharray="4 10" opacity="0.6" />
        <text fill={color} fontSize="18" letterSpacing="6" opacity="0.85" fontFamily="serif">
          <textPath href={`#${id}-ring`}>{RUNES.repeat(2)}</textPath>
        </text>
      </g>
      <g className={spin ? 'animate-spinRev' : ''} style={{ transformOrigin: '200px 200px' }}>
        <circle cx="200" cy="200" r="120" fill="none" stroke={color} strokeWidth="1.5" opacity="0.8" />
        <polygon points="200,80 304,260 96,260" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
        <polygon points="200,320 96,140 304,140" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
        <circle cx="200" cy="200" r="60" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 6" opacity="0.8" />
      </g>
      <circle cx="200" cy="200" r="20" fill={color} opacity="0.18" className="animate-pulseGlow" />
    </svg>
  )
}
