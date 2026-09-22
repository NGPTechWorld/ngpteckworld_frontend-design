import { Component } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useCommon } from '@/i18n'
import { Button, EmptyState } from '@/ui'

function ErrorFallback({ error, onReset }) {
  const c = useCommon()
  return (
    <div role="alert" className="mx-auto max-w-lg py-10">
      <EmptyState
        icon={TriangleAlert}
        title={c.somethingWentWrong}
        description={c.errorBoundaryHint}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={onReset}>{c.retry}</Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              {c.reload}
            </Button>
          </div>
        }
      />
      {import.meta.env.DEV && error?.message ? <pre className="mt-4 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs text-danger" dir="ltr">{String(error.message)}</pre> : null}
    </div>
  )
}

/**
 * Catches render errors below it and shows a friendly fallback with "try again" / "reload".
 * `resetKey` (e.g. the pathname) clears the error automatically when it changes.
 */
export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  componentDidUpdate(previous) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) return <ErrorFallback error={this.state.error} onReset={this.reset} />
    return this.props.children
  }
}
