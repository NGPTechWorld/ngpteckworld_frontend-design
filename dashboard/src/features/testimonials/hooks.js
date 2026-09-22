import { createCrudHooks } from '@/lib/crud'

// testimonials.useList / useOne / useCreate / useUpdate / useDelete / useReorder
export const testimonials = createCrudHooks('/testimonials')
