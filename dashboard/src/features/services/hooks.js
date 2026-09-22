import { createCrudHooks } from '@/lib/crud'

// services.useList / useOne / useCreate / useUpdate / useDelete / useReorder
export const services = createCrudHooks('/services')
