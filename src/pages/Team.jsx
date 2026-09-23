import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import SectionHeader from '../components/SectionHeader'
import TeamProfileCard from '../components/TeamProfileCard'
import PageTitle from '../components/PageTitle'

export default function Team() {
  const { t } = useLang()
  const [team, setTeam] = useState([])
  const [failed, setFailed] = useState(false)
  useEffect(() => { api.getTeam().then(setTeam).catch(() => setFailed(true)) }, [])

  return (
    <div className="view-enter mx-auto max-w-site px-[26px] pb-[90px] pt-[70px]">
      <PageTitle title={t.teamTitle} description={t.teamSub} />
      <SectionHeader as="h1" kicker={t.teamKick} title={t.teamTitle} sub={t.teamSub} />
      {failed && <p role="status" className="py-10 text-center text-muted">{t.loadError}</p>}
      {!failed && team.length === 0 && <p className="py-10 text-center text-muted">{t.teamEmpty}</p>}
      <div data-grid3 className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {team.map((m) => <TeamProfileCard key={m.id} member={m} />)}
      </div>
    </div>
  )
}
