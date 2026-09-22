import { createCrudHooks } from '@/lib/crud'

// stats.useList / useOne / useCreate / useUpdate / useDelete / useReorder
export const stats = createCrudHooks('/stats')
