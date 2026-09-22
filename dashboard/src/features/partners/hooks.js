import { createCrudHooks } from '@/lib/crud'

// partners.useList / useOne / useCreate / useUpdate / useDelete / useReorder
export const partners = createCrudHooks('/partners')
