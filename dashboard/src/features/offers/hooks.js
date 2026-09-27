import { createCrudHooks } from '@/lib/crud'

// offers.useList / useOne / useCreate / useUpdate / useDelete / useReorder
export const offers = createCrudHooks('/offers')
