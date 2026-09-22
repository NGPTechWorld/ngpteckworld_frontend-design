import { useQueryClient } from '@tanstack/react-query'
import { createCrudHooks, useCrudHooks } from '@/lib/crud'

// projects.useList / useOne / useCreate / useUpdate / useDelete / useReorder (numeric ids: the admin API is by id, not slug).
export const projects = createCrudHooks('/projects')

// Team members and links have at most a few dozen rows per project: one request always loads all of them, which is
// also what the reorder endpoint needs (it sets `order` = position of every id it gets).
export const NESTED_LIST = { per_page: 200, sort: 'order', dir: 'asc' }

/**
 * Data layer of one nested resource of a project (`team-members` | `links`): the list plus create / update / delete /
 * reorder mutations on `/projects/{id}/<segment>`. Every successful change also refreshes the parent project query,
 * so the counts on its tabs (and the list page) stay right. Call it once per tab component.
 */
export function useProjectChildren(projectId, segment) {
  const queryClient = useQueryClient()
  const hooks = useCrudHooks(`/projects/${projectId}/${segment}`)
  const refreshParent = () => queryClient.invalidateQueries({ queryKey: projects.keys.one(projectId) })

  return {
    list: hooks.useList(NESTED_LIST),
    create: hooks.useCreate({ onSuccess: refreshParent }),
    update: hooks.useUpdate({ onSuccess: refreshParent }),
    remove: hooks.useDelete({ onSuccess: refreshParent }),
    reorder: hooks.useReorder({ onSuccess: refreshParent }),
  }
}
