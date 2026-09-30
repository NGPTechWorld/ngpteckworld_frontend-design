import { createCrudHooks } from '@/lib/crud'

// books.useList / useOne / useCreate / useUpdate / useDelete / useReorder
export const books = createCrudHooks('/books')
