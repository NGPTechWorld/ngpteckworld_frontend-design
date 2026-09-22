import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useStrings } from '@/i18n'
import { PageHeader } from '@/ui'
import { ProjectForm } from './ProjectForm'
import { projects } from './hooks'
import strings from './strings'

export default function ProjectCreate() {
  const t = useStrings(strings)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const create = projects.useCreate()

  const onSubmit = async (payload) => {
    const project = await create.mutateAsync(payload)
    // the response already has the full show() shape: seed the edit page so it opens without a loading flash
    queryClient.setQueryData(projects.keys.one(project.id), project)
    // team members and links can only be added to a saved project: continue there
    navigate(`/projects/${project.id}?tab=team`)
  }

  return (
    <>
      <PageHeader title={t.createTitle} backTo="/projects" backLabel={t.title} />
      <ProjectForm onSubmit={onSubmit} saving={create.isPending} />
    </>
  )
}
