import { useQueryClient } from '@tanstack/react-query'
import { createCrudHooks, useCrudHooks } from '@/lib/crud'

// team.useList / useOne / useCreate / useUpdate / useDelete / useReorder
export const team = createCrudHooks('/team')

const NESTED_LIST = { per_page: 200, sort: 'order', dir: 'asc' }

/** Portfolio items of one team profile (`/team/{teamId}/portfolio`). Works for any teamId the signed-in
 * admin is allowed to reach — the backend authorizes on `team` permission OR owning that profile. */
export function useTeamPortfolio(teamId) {
  const queryClient = useQueryClient()
  const hooks = useCrudHooks(`/team/${teamId}/portfolio`)
  const refreshParent = () => queryClient.invalidateQueries({ queryKey: team.keys.one(teamId) })

  return {
    list: hooks.useList(NESTED_LIST, { enabled: teamId != null }),
    create: hooks.useCreate({ onSuccess: refreshParent }),
    update: hooks.useUpdate({ onSuccess: refreshParent }),
    remove: hooks.useDelete({ onSuccess: refreshParent }),
    reorder: hooks.useReorder({ onSuccess: refreshParent }),
  }
}
