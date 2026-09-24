/** Settings Sampler: where one proven expression could also run, and queueing it there. */
import { http } from '@/api/http'

const B = '/api/tools/settings-sampler'
export const settingsSampler = {
  /** Free: reads the Alpha (if any) and the catalog, simulates nothing. */
  preview: (source) => http.post(`${B}/preview`, source),
  addTask: (body) => http.post(`${B}/tasks`, body),
}
export const marketKey = (m) => `${m.region}|${m.delay}|${m.universe}`
export const pairLabel = (p) =>
  p.maxTrade === 'OFF' && p.maxPosition === 'OFF'
    ? 'Neither'
    : p.maxTrade === 'ON'
      ? 'Max Trade'
      : 'Max Position'
