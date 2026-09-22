import { Compass } from 'lucide-react'
import { useCommon } from '@/i18n'
import { Button, EmptyState, PageHeader } from '@/ui'

export function NotFoundPage() {
  const c = useCommon()
  return (
    <>
      <PageHeader title="404" />
      <EmptyState icon={Compass} title={c.notFoundTitle} description={c.notFoundHint} action={<Button to="/">{c.goHome}</Button>} />
    </>
  )
}
