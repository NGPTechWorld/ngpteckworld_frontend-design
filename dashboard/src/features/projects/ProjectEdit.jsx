import { useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useCommon, useLanguage, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, EmptyState, PageHeader, PageSpinner } from '@/ui'
import { ProjectForm } from './ProjectForm'
import { projects } from './hooks'
import { toFormValues } from './schema'
import strings from './strings'

export default function ProjectEdit() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const { pickField } = useLanguage()
  const { data: project, isLoading, isError, error, refetch } = projects.useOne(id)
  const update = projects.useUpdate()

  if (isLoading) return <PageSpinner />

  // `!project`: a failed background refetch keeps the old data on screen (and the form mounted) instead of an error page
  if (!project && isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/projects">{t.title}</Button>} />
    ) : (
      <Alert tone="danger" title={c.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{c.retry}</Button>}>
        {errorText(error, c)}
      </Alert>
    )
  }
  if (!project) return null

  // resolves with the saved project so the form can re-base itself on it
  const onSubmit = (payload) => update.mutateAsync({ id: project.id, data: payload })

  return (
    <>
      <PageHeader
        title={pickField(project, 'name') || t.editTitle}
        description={
          <bdi dir="ltr" className="font-mono text-[13px]">
            {project.slug}
          </bdi>
        }
        backTo="/projects"
        backLabel={t.title}
      />
      <ProjectForm key={project.id} isEdit project={project} defaultValues={toFormValues(project)} onSubmit={onSubmit} saving={update.isPending} />
    </>
  )
}
