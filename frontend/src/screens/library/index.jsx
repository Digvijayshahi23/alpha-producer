import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { http } from '@/api/http'
import { Badge, Button, ErrorNotice, Page, PageHeader, Panel } from '@/ui/kit'
import { DataTable } from '@/ui/table'
export function LibraryScreen() {
  const alphas = useQuery({
    queryKey: ['workbench', 'alphas'],
    queryFn: async () => await http.get('workbench/alphas'),
  })
  const columns = [
    {
      key: 'name',
      header: 'Name',
      width: 'minmax(120px, 1fr)',
      cell: (a) => <span className="font-medium text-ink">{a.name || 'Untitled'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      cell: (a) => <Badge tone={a.status === 'Simulated' ? 'profit' : 'neutral'}>{a.status}</Badge>,
    },
    {
      key: 'expression',
      header: 'Expression',
      width: 'minmax(200px, 2fr)',
      cell: (a) => (
        <div className="font-mono text-body-compact truncate max-w-[300px]">{a.expression}</div>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      width: 'minmax(150px, 1fr)',
      cell: (a) => (
        <div className="flex flex-wrap gap-1">
          {a.tags.map((t) => (
            <Badge key={t} tone="muted">
              {t}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      width: '150px',
      cell: (a) => (
        <span className="num text-body-compact text-ink-subtle">
          {new Date(a.updated_at).toLocaleDateString()}
        </span>
      ),
    },
  ]
  return (
    <Page>
      <PageHeader
        title="Alpha Library"
        description="Your personal repository of local alphas, ideas, and experiments."
        actions={<Button render={<Link to="/workbench" />}>+ New Alpha</Button>}
      />

      <Panel className="flex-1" bodyClassName="p-0">
        {alphas.isError ? (
          <ErrorNotice className="m-4" title="Could not load alphas" error={alphas.error} />
        ) : (
          <DataTable
            label="Alphas"
            rows={alphas.data ?? []}
            columns={columns}
            rowKey={(a) => a.id}
            loading={alphas.isLoading}
            empty="No alphas in your library. Create one in the Workbench."
          />
        )}
      </Panel>
    </Page>
  )
}
