/**
 * The Alpha page's contract. Correlations and the performance comparison spend BRAIN's
 * hourly budgets, so they run on a click and come back cached with `fetchedAt`; only
 * `refresh` asks BRAIN again. Nothing here submits an Alpha.
 */
import { http, qs } from '@/api/http'

const read = (mode) =>
  qs({ cached_only: mode === 'cached' || null, refresh: mode === 'refresh' || null })
const id = (alphaId) => encodeURIComponent(alphaId)
export const alpha = {
  page: (alphaId, refresh = false) =>
    http.get(`/api/alphas/${id(alphaId)}/page${qs({ refresh: refresh || null })}`),
  save: (alphaId, body) => http.patch(`/api/alphas/${id(alphaId)}`, body),
  correlation: (alphaId, kind, mode) =>
    http.get(`/api/alphas/${id(alphaId)}/correlations/${kind}${read(mode)}`),
  performance: (alphaId, mode) => http.get(`/api/alphas/${id(alphaId)}/performance${read(mode)}`),
  /** Gross and after-cost PnL, charging `costBps` against each day's own turnover. */
  afterCost: (alphaId, costBps) =>
    http.get(`/api/alphas/${id(alphaId)}/after-cost${qs({ costBps })}`),
}
