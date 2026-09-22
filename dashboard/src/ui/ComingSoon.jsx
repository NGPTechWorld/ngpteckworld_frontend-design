import { Construction } from 'lucide-react'
import { useCommon, useLanguage } from '@/i18n'
import { Card } from './Card'
import { EmptyState } from './EmptyState'
import { PageHeader } from './PageHeader'

/** Placeholder page for sections that are not built yet: <ComingSoon title={{ ar: 'المشاريع', en: 'Projects' }} icon={FolderKanban} /> */
export function ComingSoon({ title, icon }) {
  const c = useCommon()
  const { pick } = useLanguage()
  return (
    <>
      <PageHeader title={title ? pick(title) : c.comingSoonTitle} />
      <Card padded={false}>
        <EmptyState icon={icon ?? Construction} title={c.comingSoonTitle} description={c.comingSoonHint} />
      </Card>
    </>
  )
}
