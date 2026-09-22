import { Cloud, Code, Cpu, Database, Layers, PenTool, Smartphone, Wrench } from 'lucide-react'

// The keys the public site knows how to draw (ServiceController::ICON_KEYS) with the lucide icon that looks most
// like the site's own drawing, so the picker previews what visitors will see.
export const SERVICE_ICONS = {
  web: Code,
  mobile: Smartphone,
  design: PenTool,
  erp: Database,
  cloud: Cloud,
  ai: Cpu,
  support: Wrench,
}

export const SERVICE_ICON_KEYS = Object.keys(SERVICE_ICONS)

/** Icon of a service; an unknown key (legacy data) gets a neutral fallback instead of crashing the list. */
export function ServiceIcon({ name, size = 20, className }) {
  const Icon = SERVICE_ICONS[name] ?? Layers
  return <Icon size={size} aria-hidden="true" className={className} />
}
