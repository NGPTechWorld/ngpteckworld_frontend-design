import { useLang } from '../i18n/LanguageContext'

export default function FilterPills({ active, onSelect }) {
  const { t } = useLang()
  return (
    <div className="mb-[34px] flex flex-wrap justify-center gap-2.5">
      {t.cats.map((c) => {
        const on = active === c.v
        return (
          <span key={c.v} onClick={() => onSelect(c.v)}
            className={`pill cursor-pointer rounded-full border px-5 py-2.5 text-[14px] ${on ? 'pill-on' : 'border-white/15 bg-white/[.03] text-soft'}`}>
            {c.l}
          </span>
        )
      })}
    </div>
  )
}
