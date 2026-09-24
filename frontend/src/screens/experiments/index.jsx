import { useQuery } from '@tanstack/react-query'
import { http } from '@/api/http'
import { Badge, Button, ErrorNotice, Page, PageHeader, Panel } from '@/ui/kit'
import { DataTable } from '@/ui/table'
export function ExperimentsScreen() {
  const expsQuery = useQuery({
    queryKey: ['workbench', 'experiments'],
    queryFn: async () => await http.get('workbench/experiments'),
  })
  const columns = [
    {
      key: 'name',
      header: 'Experiment',
      width: 'minmax(150px, 1.5fr)',
      cell: (e) => <span className="font-medium text-ink">{e.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      cell: (e) => (
        <Badge
          tone={e.status === 'Completed' ? 'profit' : e.status === 'Running' ? 'warn' : 'neutral'}
        >
          {e.status}
        </Badge>
      ),
    },
    {
      key: 'hypothesis',
      header: 'Hypothesis',
      width: 'minmax(200px, 2fr)',
      cell: (e) => <span className="text-body-compact truncate">{e.hypothesis || '-'}</span>,
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      width: '150px',
      cell: (e) => (
        <span className="num text-body-compact text-ink-subtle">
          {new Date(e.updated_at).toLocaleDateString()}
        </span>
      ),
    },
  ]
  return (
    <Page>
      <PageHeader
        title="Experiment Tracker"
        description="Plan and log variations of your alphas to find robust parameters."
        actions={<Button disabled>+ New Experiment (Coming Soon)</Button>}
      />

      <Panel className="flex-1" bodyClassName="p-0">
        {expsQuery.isError ? (
          <ErrorNotice className="m-4" title="Could not load experiments" error={expsQuery.error} />
        ) : (
          <DataTable
            label="Experiments"
            rows={expsQuery.data ?? []}
            columns={columns}
            rowKey={(e) => e.id}
            loading={expsQuery.isLoading}
            empty="No experiments logged yet."
          />
        )}
      </Panel>
    </Page>
  )
}
