import type { ApplicationUpdateStatus } from './application-update'

const messages: Record<
  Exclude<ApplicationUpdateStatus, 'current'>,
  { readonly title: string; readonly detail: string }
> = {
  downloading: {
    title: 'A new version is available',
    detail:
      'This copy is out of date. Downloading the latest version of Games…',
  },
  loading: {
    title: 'Update ready',
    detail: 'The latest version has downloaded. Loading the new copy…',
  },
  failed: {
    title: 'The update could not load',
    detail:
      'Check your connection, then reload the page to try again. You can keep using this copy for now.',
  },
}

export function ApplicationUpdateNotice({
  status,
}: {
  readonly status: ApplicationUpdateStatus
}) {
  if (status === 'current') {
    return null
  }

  const message = messages[status]

  return (
    <section
      class={`application-update application-update-${status}`}
      role={status === 'failed' ? 'alert' : 'status'}
      aria-atomic="true"
    >
      <div class="application-update-indicator" aria-hidden="true" />
      <div>
        <h2>{message.title}</h2>
        <p>{message.detail}</p>
      </div>
    </section>
  )
}
