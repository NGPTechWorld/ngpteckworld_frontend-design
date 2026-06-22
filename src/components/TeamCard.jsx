import { useLang } from '../i18n/LanguageContext'
import { initials } from '../lib/visuals'

export default function TeamCard({ member }) {
  const { pick } = useLang()
  const tasks = pick(member, 'tasks') || []
  return (
    <div className="rounded-card border border-[var(--border)] bg-[var(--card-bg)] p-6">
      <div className="mb-4 flex items-center gap-3.5">
        {member.avatar
          ? <img src={member.avatar} alt={member.name} className="h-[54px] w-[54px] rounded-full object-cover" />
          : <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full font-poppins text-[18px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#6B4E8E,#9678BE)' }}>{initials(member.name)}</div>}
        <div>
          <div className="text-[17px] font-semibold">{member.name}</div>
          <div className="text-[13.5px] text-accent-light">{pick(member, 'role')}</div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((tk, i) => (
          <div key={i} className="flex items-start gap-2.5 text-[13.5px] text-soft">
            <span className="mt-2 h-[5px] w-[5px] flex-none rounded-full" style={{ background: '#9678BE' }} />
            {tk}
          </div>
        ))}
      </div>
    </div>
  )
}
