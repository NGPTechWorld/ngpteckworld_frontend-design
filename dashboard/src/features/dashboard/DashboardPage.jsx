import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock, FolderKanban, Handshake, HelpCircle, Inbox, Layers, Mailbox, MessageSquareQuote, PanelsTopLeft, Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '@/app/AuthProvider'
import { useCommon, useFormat, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Avatar, Button, Card, EmptyState, PageHeader, Skeleton, StatCard, StatusBadge, flipRtl } from '@/ui'
import { useDashboard } from './hooks'
import { RequestsChart } from './RequestsChart'
import strings from './strings'

// Every card links to the section it counts. The request cards deep-link into the inbox with the status filter applied.
const REQUEST_CARDS = [
  { key: 'requests_new', icon: Inbox, tone: 'gold', to: '/requests?status=new', highlight: true },
  { key: 'requests_in_progress', icon: Clock, tone: 'warning', to: '/requests?status=in_progress' },
  { key: 'requests_done', icon: CheckCircle2, tone: 'success', to: '/requests?status=done' },
  { key: 'requests_total', icon: Mailbox, tone: 'accent', to: '/requests' },
]
const CONTENT_CARDS = [
  { key: 'projects', icon: FolderKanban, to: '/projects' },
  { key: 'services', icon: Layers, to: '/services' },
  { key: 'testimonials', icon: MessageSquareQuote, to: '/testimonials' },
  { key: 'partners', icon: Handshake, to: '/partners' },
  { key: 'faqs', icon: HelpCircle, to: '/faqs' },
]
const QUICK_ACTIONS = [
  { key: 'project', to: '/projects/new', icon: Plus },
  { key: 'service', to: '/services/new', icon: Plus },
  { key: 'testimonial', to: '/testimonials/new', icon: Plus },
  { key: 'partner', to: '/partners/new', icon: Plus },
  { key: 'faq', to: '/faqs/new', icon: Plus },
  { key: 'content', to: '/page-content', icon: PanelsTopLeft },
]

const firstName = (name) => String(name ?? '').trim().split(/\s+/)[0]

function LoadingSkeleton({ label }) {
  return (
    <div aria-busy="true" className="space-y-8">
      <span role="status" className="sr-only">
        {label}
      </span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[116px] rounded-card" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-[116px] rounded-card" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-card lg:col-span-2" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const t = useStrings(strings)
  const c = useCommon()
  const f = useFormat()
  const { user } = useAuth()
  const query = useDashboard()
  const data = query.data
  const name = firstName(user?.name)

  const header = (
    <PageHeader
      title={name ? t.greeting(name) : t.title}
      description={t.description}
      actions={
        <Button variant="secondary" icon={RefreshCw} loading={query.isFetching} onClick={() => query.refetch()}>
          {t.refresh}
        </Button>
      }
    />
  )

  if (query.isLoading) {
    return (
      <>
        {header}
        <LoadingSkeleton label={c.loading} />
      </>
    )
  }

  if (!data) {
    return (
      <>
        {header}
        <Alert
          tone="danger"
          title={c.loadFailed}
          action={
            <Button size="sm" variant="secondary" onClick={() => query.refetch()}>
              {c.retry}
            </Button>
          }
        >
          {errorText(query.error, c)}
        </Alert>
      </>
    )
  }

  const { counts = {}, recent_requests: recent = [], requests_last_30_days: days = [] } = data

  return (
    <>
      {header}
      <div className="space-y-8">
        <section aria-labelledby="dash-requests">
          <h2 id="dash-requests" className="mb-3 text-sm font-bold text-muted">
            {t.requestsSection}
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {REQUEST_CARDS.map((card) => (
              <StatCard
                key={card.key}
                label={t.cards[card.key]}
                value={f.number(counts[card.key] ?? 0)}
                icon={card.icon}
                tone={card.tone}
                to={card.to}
                hint={card.highlight ? ((counts[card.key] ?? 0) > 0 ? t.newHint : t.newHintNone) : undefined}
                className={card.highlight ? 'ring-1 ring-gold/50' : undefined}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="dash-content">
          <h2 id="dash-content" className="mb-3 text-sm font-bold text-muted">
            {t.contentSection}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {CONTENT_CARDS.map((card) => (
              <StatCard key={card.key} label={t.cards[card.key]} value={f.number(counts[card.key] ?? 0)} icon={card.icon} to={card.to} />
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <RequestsChart days={days} busy={query.isFetching} />
          </div>

          <Card title={t.quickTitle} className="self-start">
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {QUICK_ACTIONS.map((action) => (
                <li key={action.key}>
                  <Button to={action.to} variant="secondary" icon={action.icon} className="w-full justify-start">
                    {t.quick[action.key]}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card
          title={t.recentTitle}
          padded={false}
          actions={
            <Button to="/requests" variant="ghost" size="sm" iconEnd={ArrowRight} iconClassName={flipRtl}>
              {t.recentAll}
            </Button>
          }
        >
          {recent.length === 0 ? (
            <EmptyState icon={Inbox} title={t.recentEmptyTitle} description={t.recentEmptyHint} />
          ) : (
            <ul className="divide-y divide-white/[.06]">
              {recent.map((request) => (
                <li key={request.id}>
                  <Link
                    to={`/requests/${request.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[.03] focus-visible:bg-white/[.05] focus-visible:outline-none"
                  >
                    <Avatar name={request.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      {/* user text: dir="auto" orders it by its own script; inline-block keeps the line aligned to the page direction */}
                      <p className="truncate text-sm font-semibold text-ink">
                        <span dir="auto" className="inline-block max-w-full truncate align-bottom">
                          {request.name}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted">
                        <span dir="auto" className="inline-block max-w-full truncate align-bottom">
                          {request.title}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={request.status} />
                      <time dateTime={request.created_at} title={f.dateTime(request.created_at)} className="text-xs text-faint">
                        {f.relative(request.created_at)}
                      </time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
