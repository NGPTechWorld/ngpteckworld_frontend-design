import { createCrudHooks } from '@/lib/crud'

// One line gives the whole data layer: faqs.useList / useOne / useCreate / useUpdate / useDelete / useReorder.
export const faqs = createCrudHooks('/faqs')
