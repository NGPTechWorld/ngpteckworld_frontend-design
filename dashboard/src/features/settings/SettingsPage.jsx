import { useCommon, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, PageHeader, PageSpinner } from '@/ui'
import { SettingsForm } from './SettingsForm'
import { useSaveSettings, useSettings } from './hooks'
import { toFormValues } from './schema'
import strings from './strings'

export default function SettingsPage() {
  const t = useStrings(strings)
  const c = useCommon()
  const query = useSettings()
  const save = useSaveSettings()

  return (
    <>
      <PageHeader title={t.title} description={t.description} />

      {query.isLoading ? (
        <PageSpinner />
      ) : !query.data ? (
        <Alert
          tone="danger"
          title={t.loadFailedTitle}
          action={
            <Button size="sm" variant="secondary" onClick={() => query.refetch()}>
              {c.retry}
            </Button>
          }
        >
          {errorText(query.error, c)}
        </Alert>
      ) : (
        // the form reads its defaults once; it resets itself to the saved values after every successful save
        <SettingsForm
          defaultValues={toFormValues(query.data)}
          /* Read-only, so it is a prop rather than a form field: how many visits are on record,
             which is the thing you want to see before deciding to publish the counter. */
          visitors={query.data?.visitors ?? 0}
          onSubmit={save.mutateAsync}
          saving={save.isPending}
        />
      )}
    </>
  )
}
