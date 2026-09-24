/**
 * The assistant: providers, keys and their daily budgets, prompts, the context the model
 * is shown, and the chat. Bodies are snake_case only. Keys never come back — only `hint`.
 */
import { ApiError, http, qs } from '@/api/http'
import { fmt } from '@/lib/format'
export const llm = {
  providers: () => http.get('/api/llm/providers'),
  models: () => http.get('/api/llm/models'),
  keys: () => http.get('/api/llm/keys'),
  /** 400 llm_error for a duplicate key. */
  addKey: (body) => http.post('/api/llm/keys', body),
  setEnabled: (id, enabled, dailyLimit) =>
    // snake_case, like every other body here: the backend reads `daily_limit` and silently
    // ignores anything else, so a camelCase key would arrive as "no cap given".
    http.put(`/api/llm/keys/${id}`, {
      enabled,
      daily_limit: dailyLimit ?? undefined,
      clear_daily_limit: dailyLimit === null,
    }),
  removeKey: (id) => http.del(`/api/llm/keys/${id}`),
  checkKey: (id) => http.post(`/api/llm/keys/${id}/check`),
  checkAll: () => http.post('/api/llm/keys/check'),
  prompts: () => http.get('/api/llm/prompts'),
  context: (scope) =>
    http.get(
      `/api/llm/context${qs({ region: scope.region, delay: scope.delay, universe: scope.universe, instrument_type: scope.instrumentType, rendered: true })}`,
    ),
}
export const chat = {
  options: () => http.get('/api/chat/options'),
  threads: (limit = 30) => http.get(`/api/chat/threads${qs({ limit })}`),
  /** 404 no_such_thread. */
  thread: (id) => http.get(`/api/chat/threads/${id}`),
  deleteThread: (id) => http.del(`/api/chat/threads/${id}`),
  /** Spends one assistant request. An undownloaded scope fails with a plain 500. */
  say: (body) => http.post('/api/chat', body),
  downloadedScopes: () => http.get('/api/catalog/scopes'),
}
/** Today's day in the quota's timezone, as usage rows spell it. */
export const quotaDay = (timeZone) => new Date().toLocaleDateString('en-CA', { timeZone })
/** The extra facts a 429 llm_budget_exhausted carries: when to retry, and what is left. */
export function budgetDetail(error) {
  if (!(error instanceof ApiError) || error.code !== 'llm_budget_exhausted') return null
  const keys = error.body['keys'] ?? []
  const left = keys.reduce((sum, k) => sum + (k.dailyRemaining ?? 0), 0)
  return `Retry in ${fmt.duration(error.body.retryAfter)} · ${fmt.int(left)} requests left today across ${fmt.int(keys.length)} key budgets.`
}
