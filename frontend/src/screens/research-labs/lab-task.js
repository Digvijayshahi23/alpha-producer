/** What Search Lab and Template Lab share around a task: its draft, market and datasets. */
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { catalog } from '@/api/catalog'
import { useScope } from '@/lib/scope'
import { useDatasetPick } from '@/screens/data/dataset-pick'
export const MAX_SIMULATIONS = 100_000
/** Matches `labs.search.MAX_CORES`: a task may hold every slot the engine has. */
export const CORES = [1, 2, 3, 4, 5, 6, 7, 8]
export function useLabMarket(draft, set, from) {
  const navigate = useNavigate()
  const [, setDataScope] = useScope('data')
  const scope = {
    instrumentType: 'EQUITY',
    region: draft.region,
    delay: draft.delay,
    universe: draft.universe,
  }
  const chosen = draft.datasetIds.length > 0
  // Back from the Data Explorer with a finished pick for this lab.
  useEffect(() => {
    const pick = useDatasetPick.getState().take(from)
    if (pick)
      set({
        region: pick.scope.region,
        delay: pick.scope.delay,
        universe: pick.scope.universe,
        datasetIds: pick.ids,
      })
  }, [from, set])
  const datasets = useQuery({
    queryKey: ['catalog', 'datasets', scope, ''],
    queryFn: () => catalog.datasets(scope),
    enabled: chosen,
  })
  const names = useMemo(
    () => new Map((datasets.data ?? []).map((d) => [d.dataset_id, d.name ?? d.dataset_id])),
    [datasets.data],
  )
  const choose = () => {
    useDatasetPick.getState().start(scope, draft.datasetIds, from)
    setDataScope(scope)
    void navigate({ to: '/data/$tab', params: { tab: 'fields' } })
  }
  return { chosen, names, choose }
}
/** `vec_avg` until the user chooses vector operators. */
export function vectorOperatorsOf(draft, available) {
  return draft.vectorOperators ?? (available?.includes('vec_avg') ? ['vec_avg'] : [])
}
/** The market and settings both labs send to preview a task. */
export function labBody(draft, vectorOperators) {
  return {
    region: draft.region,
    delay: draft.delay,
    universe: draft.universe,
    dataset_ids: draft.datasetIds,
    vector_operators: vectorOperators,
    neutralizations: draft.neutralizations,
    decay: draft.decay,
    cores: draft.cores,
  }
}
export function simulationsValid(draft, maxSimulations) {
  return draft.simulations !== null && draft.simulations >= 1 && draft.simulations <= maxSimulations
}
