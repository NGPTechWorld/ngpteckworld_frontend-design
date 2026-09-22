import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { formatDate } from '@/lib/format'
import { mockApi, reply } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import DashboardPage from './DashboardPage'
import { makeDashboard, makeDays } from './testData'

const layla = { id: 2, name: 'Layla Hassan', email: 'layla@ngptechworld.com' }
const short = (date, lang = 'en') => formatDate(date, lang, { day: 'numeric', month: 'short' })

describe('DashboardPage', () => {
  it('greets the user by first name', async () => {
    mockApi({ 'GET /dashboard': () => makeDashboard() })
    renderWithProviders(<DashboardPage />, { route: '/', authUser: layla })

    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome back, Layla' })).toBeInTheDocument()
  })

  it('shows every count as a card that links to its section (new requests are highlighted)', async () => {
    mockApi({ 'GET /dashboard': () => makeDashboard() })
    renderWithProviders(<DashboardPage />, { route: '/' })
    await screen.findByRole('img') // the chart only exists once the data arrived

    const cards = {
      '^New requests': ['/requests?status=new', '4'],
      '^In progress': ['/requests?status=in_progress', '3'],
      '^Done': ['/requests?status=done', '41'],
      '^Total requests': ['/requests', '48'],
      '^Projects': ['/projects', '12'],
      '^Services': ['/services', '7'],
      '^Testimonials': ['/testimonials', '5'],
      '^Partners': ['/partners', '9'],
      '^FAQ': ['/faqs', '6'],
    }
    for (const [name, [href, value]] of Object.entries(cards)) {
      const link = screen.getByRole('link', { name: new RegExp(name) })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveTextContent(value)
    }
    const highlighted = screen.getByRole('link', { name: /^New requests/ })
    expect(highlighted).toHaveTextContent('Need your attention')
    expect(highlighted.className).toContain('ring-gold')
    expect(screen.getByRole('link', { name: /^In progress/ }).className).not.toContain('ring-gold')
  })

  it('says nothing is waiting when there are no new requests', async () => {
    const payload = makeDashboard()
    payload.data.counts = { ...payload.data.counts, requests_new: 0 }
    mockApi({ 'GET /dashboard': () => payload })
    renderWithProviders(<DashboardPage />, { route: '/' })

    expect(await screen.findByText('Nothing waiting')).toBeInTheDocument()
  })

  it('draws the 30-day chart with an accessible summary', async () => {
    const days = makeDays()
    const total = days.reduce((sum, day) => sum + day.count, 0)
    mockApi({ 'GET /dashboard': () => makeDashboard({ requests_last_30_days: days }) })
    renderWithProviders(<DashboardPage />, { route: '/' })

    const chart = await screen.findByRole('img', { name: new RegExp(`^Requests per day from ${short('2026-08-23')} to ${short('2026-09-21')}: ${total} in total`) })
    expect(chart).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Requests in the last 30 days' })).toBeInTheDocument()
  })

  it('lists the latest requests with status, relative time and a link to each one', async () => {
    mockApi({ 'GET /dashboard': () => makeDashboard() })
    renderWithProviders(<DashboardPage />, { route: '/' })

    const sara = await screen.findByRole('link', { name: /Sara Ahmad/ })
    expect(sara).toHaveAttribute('href', '/requests/5')
    expect(within(sara).getByText('Mobile app quote')).toBeInTheDocument()
    expect(within(sara).getByText('New')).toBeInTheDocument()
    expect(within(sara).getByText('5 minutes ago')).toBeInTheDocument()

    const omar = screen.getByRole('link', { name: /Omar Khaled/ })
    expect(omar).toHaveAttribute('href', '/requests/4')
    expect(within(omar).getByText('In progress')).toBeInTheDocument()
    expect(within(omar).getByText('3 hours ago')).toBeInTheDocument()
    expect(within(screen.getByRole('link', { name: /Layla Hassan/ })).getByText('Done')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View all requests' })).toHaveAttribute('href', '/requests')
  })

  it('explains an empty inbox', async () => {
    mockApi({ 'GET /dashboard': () => makeDashboard({ recent_requests: [] }) })
    renderWithProviders(<DashboardPage />, { route: '/' })

    expect(await screen.findByText('No requests yet')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Sara Ahmad/ })).not.toBeInTheDocument()
  })

  it('offers quick actions for creating content', async () => {
    mockApi({ 'GET /dashboard': () => makeDashboard() })
    renderWithProviders(<DashboardPage />, { route: '/' })
    await screen.findByRole('img') // the chart only exists once the data arrived

    const actions = { 'New project': '/projects/new', 'New service': '/services/new', 'New testimonial': '/testimonials/new', 'New partner': '/partners/new', 'New question': '/faqs/new', 'Page content': '/page-content' }
    for (const [name, href] of Object.entries(actions)) expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
  })

  it('shows a loading state first', () => {
    mockApi({ 'GET /dashboard': () => makeDashboard() })
    renderWithProviders(<DashboardPage />, { route: '/' })

    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows a retryable error when the numbers cannot be loaded', async () => {
    const server = mockApi({ 'GET /dashboard': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<DashboardPage />, { route: '/' })

    expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
    expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Projects/ })).not.toBeInTheDocument()

    server.on('GET /dashboard', () => makeDashboard())
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('link', { name: /^Projects/ })).toBeInTheDocument()
  })

  it('refreshes on demand', async () => {
    const server = mockApi({ 'GET /dashboard': () => makeDashboard() })
    const { user } = renderWithProviders(<DashboardPage />, { route: '/' })
    await screen.findByRole('img') // the chart only exists once the data arrived
    expect(server.calls('GET', '/dashboard')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() => expect(server.calls('GET', '/dashboard')).toHaveLength(2))
  })

  it('renders in Arabic (RTL) with Arabic labels', async () => {
    mockApi({ 'GET /dashboard': () => makeDashboard() })
    renderWithProviders(<DashboardPage />, { route: '/', lang: 'ar', authUser: { id: 1, name: 'Admin', email: 'admin@ngptechworld.com' } })

    expect(await screen.findByRole('img', { name: /^عدد الطلبات اليومية من/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'مرحبًا بعودتك، Admin' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^طلبات جديدة/ })).toHaveAttribute('href', '/requests?status=new')
    expect(screen.getByRole('heading', { level: 2, name: 'الطلبات خلال آخر 30 يومًا' })).toBeInTheDocument()
    expect(document.documentElement.dir).toBe('rtl')
  })
})
