/** The API's statuses, in workflow order. */
export const STATUSES = ['new', 'in_progress', 'done']

/** <Select options> with the localized status names (`c` = useCommon()). */
export const statusOptions = (c) => STATUSES.map((value) => ({ value, label: c.statusLabels[value] }))
