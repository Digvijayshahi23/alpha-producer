/** Template Lab: the account's blocks, templates, previews and tasks. Request bodies are snake_case. */
import { http, qs } from '@/api/http'

const B = '/api/template-lab'
export const templateLab = {
  /** `refresh` syncs the account's operators from BRAIN first. */
  options: (refresh = false) => http.get(`${B}/options${qs({ refresh: refresh || undefined })}`),
  templates: () => http.get(`${B}/templates`),
  create: (body) => http.post(`${B}/templates`, body),
  update: (id, body) => http.put(`${B}/templates/${id}`, body),
  remove: (id) => http.del(`${B}/templates/${id}`),
  /** Free; queues nothing. */
  preview: (body) => http.post(`${B}/preview`, body),
  /** Adds the template's search to Tasks, not started. Spends nothing until it is run there. */
  addTask: (body) => http.post(`${B}/tasks`, body),
}
