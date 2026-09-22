import { Check, Eye, Lightbulb, Star } from 'lucide-react'

// The same four glyphs the public site draws for its values (ngpteckworld_frontend-design/src/lib/visuals.js).
const ICONS = { quality: Star, innovation: Lightbulb, commit: Check, transparency: Eye }

/** Icon of a `values` item. An unknown or missing key falls back to "quality", exactly like the public site does. */
export function ValueIcon({ iconKey, size = 18, className }) {
  const Icon = ICONS[iconKey] ?? ICONS.quality
  return <Icon size={size} aria-hidden="true" className={className} />
}
