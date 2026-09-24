/**
 * Alphas (spec §4.5): the local store of Alphas, their submission checks and correlations.
 * Request bodies are snake_case ONLY — camelCase keys are silently dropped — and nothing here
 * submits an alpha.
 */
import { http, qs } from '@/api/http'
export const BRAIN_ALPHA_URL = (alphaId) => `https://platform.worldquantbrain.com/alpha/${alphaId}`
export const pool = {
  overview: () => http.get('/api/vault'),
  /** Raw BRAIN counts by stage and status. One BRAIN read. */
  summary: () => http.get('/api/alphas/summary'),
  sync: () => http.post('/api/vault/sync'),
  query: (body) => http.post('/api/vault/alphas/query', body),
  detail: (alphaId) => http.get(`/api/vault/alphas/${encodeURIComponent(alphaId)}/detail`),
  submittable: (scope, limit = 200) =>
    http.get(
      `/api/vault/submittable${qs({ region: scope.region, delay: scope.delay, universe: scope.universe, instrument_type: scope.instrumentType, limit })}`,
    ),
  /** Re-runs the submission checks on BRAIN without submitting. */
  check: (alphaId) => http.get(`/api/alphas/${encodeURIComponent(alphaId)}/check`),
  /** A slow, rate-limited BRAIN job. */
  correlations: (alphaId, kind) =>
    http.get(`/api/alphas/${encodeURIComponent(alphaId)}/correlations/${kind}`),
}
