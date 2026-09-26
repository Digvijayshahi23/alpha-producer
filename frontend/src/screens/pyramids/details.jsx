import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { catalog } from '@/api/catalog'
import { Page, PageHeader, Panel, Skeleton, ErrorNotice, Empty, Button } from '@/ui/kit'
import { fmt } from '@/lib/format'

export function PyramidDetailsScreen() {
  const { region, delay, categoryId } = useParams({ strict: false })
  
  const query = useQuery({
    queryKey: ['catalog', 'pyramidDetails', region, delay, categoryId],
    queryFn: () => catalog.pyramidDetails(region, delay, categoryId),
  })
  
  const data = query.data

  return (
    <Page>
      <div className="flex items-center gap-4 mb-4">
        <Link to="/pyramids" className="flex items-center gap-2 text-ink-subtle hover:text-ink transition-colors">
          <ArrowLeftIcon className="size-4" />
          Back to Matrix
        </Link>
      </div>
      
      <PageHeader 
        title={data ? `${data.region} D${data.delay} — ${data.category_name || categoryId}` : 'Loading...'} 
        description="Pyramid Details" 
      />

      {query.isError ? (
        <ErrorNotice error={query.error} title="Could not load pyramid details" />
      ) : !data ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="flex flex-col gap-6">
          <Panel title="Pyramid Status">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
              <div className="p-4 bg-surface-2 rounded-md border border-hairline flex flex-col gap-1">
                <span className="text-body-compact text-ink-subtle">Submitted Alphas</span>
                <span className="text-xl font-medium">{fmt.int(data.brain_alphas.length)}</span>
              </div>
              <div className="p-4 bg-surface-2 rounded-md border border-hairline flex flex-col gap-1">
                <span className="text-body-compact text-ink-subtle">Local Alphas</span>
                <span className="text-xl font-medium">{fmt.int(data.local_alphas.length)}</span>
              </div>
              <div className="p-4 bg-surface-2 rounded-md border border-hairline flex flex-col gap-1">
                <span className="text-body-compact text-ink-subtle">Available Datasets</span>
                <span className="text-xl font-medium">{fmt.int(data.datasets.length)}</span>
              </div>
              <div className="p-4 bg-surface-2 rounded-md border border-hairline flex flex-col gap-1">
                <span className="text-body-compact text-ink-subtle">Available Fields</span>
                <span className="text-xl font-medium">{fmt.int(data.fields.length)}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Local Alphas in this Pyramid">
            {data.local_alphas.length === 0 ? (
              <Empty title="No Local Alphas">
                You have not created any alphas for this pyramid yet.
              </Empty>
            ) : (
              <table className="w-full text-left text-body">
                <thead>
                  <tr className="border-b border-hairline text-ink-subtle">
                    <th className="py-2 pl-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Expression</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {data.local_alphas.map(a => (
                    <tr key={a.id} className="hover:bg-surface-1 transition-colors">
                      <td className="py-3 pl-4 truncate max-w-[200px]">
                        <Link to={`/alpha/${a.id}`} className="text-primary hover:underline font-medium">
                          {a.name || 'Untitled'}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-ink-subtle font-mono text-sm truncate max-w-[500px]">
                        {a.expression}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Submitted BRAIN Alphas">
            {data.brain_alphas.length === 0 ? (
              <Empty title="No Submitted Alphas">
                No submitted alphas found for this pyramid.
              </Empty>
            ) : (
              <table className="w-full text-left text-body">
                <thead>
                  <tr className="border-b border-hairline text-ink-subtle">
                    <th className="py-2 pl-4 font-medium">Alpha ID</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {data.brain_alphas.map(a => (
                    <tr key={a.id} className="hover:bg-surface-1 transition-colors">
                      <td className="py-3 pl-4 text-ink font-medium">
                        {a.id}
                      </td>
                      <td className="py-3 pr-4 text-ink-subtle truncate">
                        {a.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      )}
    </Page>
  )
}
