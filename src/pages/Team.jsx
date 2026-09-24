import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import SectionHeader from '../components/SectionHeader'
import TeamProfileCard from '../components/TeamProfileCard'
import PageTitle from '../components/PageTitle'
import { Skeleton } from '../components/fx/Skeleton'

/** Matches TeamProfileCard: a square portrait, then a name and a role. */
function CardSkeleton() {
  return (
    <div className="ngp-card h-full" aria-hidden="true">
      <Skeleton className="!rounded-none" style={{ aspectRatio: '1 / 1' }} />
      <div className="p-[22px]">
        <Skeleton className="mx-auto mb-2.5 h-[17px] w-2/3" />
        <Skeleton className="mx-auto h-[12px] w-1/2" />
      </div>
    </div>
  )
}

export default function Team() {
  const { t } = useLang()
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api.getTeam()
      .then(setTeam)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="view-enter ngp-section pt-[clamp(48px,7vw,70px)]">
      <PageTitle title={t.teamTitle} description={t.teamSub} />
      <SectionHeader as="h1" kicker={t.teamKick} title={t.teamTitle} sub={t.teamSub} />

      {failed && <p role="status" className="py-10 text-center text-muted">{t.loadError}</p>}
      {!loading && !failed && team.length === 0 && (
        <p className="py-10 text-center text-muted">{t.teamEmpty}</p>
      )}

      {/* Tracks are capped at 300px and the row is centred, rather than stretched to fill.
          A plain 1fr grid turned a two-person team into two enormous cards pinned to one edge
          with the rest of the row empty; this keeps the card size constant however many people
          the dashboard holds, and centres whatever is there. */}
      <div
        data-stagger
        className="grid justify-center gap-[18px]"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 300px))' }}
      >
        {loading
          ? Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)
          : team.map((m) => (
            <div key={m.id} data-rise className="h-full">
              <TeamProfileCard member={m} />
            </div>
          ))}
      </div>
    </div>
  )
}
