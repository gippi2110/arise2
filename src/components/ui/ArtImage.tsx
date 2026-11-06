import { useState } from 'react'
import clsx from '../../lib/clsx'

interface Props { src: string; alt?: string; className?: string; imgClassName?: string; eager?: boolean }

export default function ArtImage({ src, alt = '', className, imgClassName, eager }: Props) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={clsx('relative overflow-hidden bg-gradient-to-br from-navy to-void', className)}>
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={clsx('h-full w-full object-cover transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0', imgClassName)}
      />
      {!loaded && <div className="absolute inset-0 animate-pulseGlow bg-gradient-to-br from-sys/10 via-transparent to-arcane/10" />}
    </div>
  )
}
