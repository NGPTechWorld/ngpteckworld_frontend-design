import { createCrudHooks } from '@/lib/crud'

// team.useList / useOne / useCreate / useUpdate / useDelete / useReorder
export const team = createCrudHooks('/team')
