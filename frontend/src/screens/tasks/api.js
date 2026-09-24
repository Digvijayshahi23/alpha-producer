/** Tasks: what the labs added. Only the Tasks tab runs them. */
import { http, qs } from '@/api/http'

const B = '/api/lab-tasks'
export const labTasks = {
  list: () => http.get(B),
  /** Spends simulation quota. */
  runAll: () => http.post(`${B}/run-all`),
  /** Spends simulation quota. Also resumes a paused task. */
  run: (id) => http.post(`${B}/${id}/run`),
  pause: (id) => http.post(`${B}/${id}/pause`),
  stop: (id) => http.post(`${B}/${id}/stop`),
  change: (id, body) => http.patch(`${B}/${id}`, body),
  remove: (id) => http.del(`${B}/${id}`),
  top: (id, limit = 50) => http.get(`${B}/${id}/top${qs({ limit })}`),
  /** Every Alpha from every task that nothing refuses: each check PASS, WARNING or PENDING. */
  submittable: () => http.get(`${B}/submittable`),
}
