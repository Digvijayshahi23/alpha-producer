/**
 * Picking datasets in the Data Explorer's Fields filters for a lab, then going back to its own
 * route, where Done leaves the choice in `result` for that lab alone to take. Kept in
 * sessionStorage, so a reload in the middle of a pick keeps it.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
export const useDatasetPick = create()(
  persist(
    (set, get) => ({
      active: false,
      scope: null,
      ids: [],
      from: '/labs/search',
      result: null,
      start: (scope, ids, from) => set({ active: true, scope, ids, from, result: null }),
      setIds: (ids) => set({ ids }),
      follow: (scope) => {
        const current = get().scope
        const moved = !current || current.region !== scope.region || current.delay !== scope.delay
        set({ scope, ids: moved ? [] : get().ids })
      },
      finish: () => {
        const { scope, ids, from } = get()
        set({
          active: false,
          scope: null,
          ids: [],
          result: scope ? { scope, ids, from } : null,
        })
      },
      cancel: () => set({ active: false, scope: null, ids: [], result: null }),
      take: (from) => {
        const result = get().result
        if (!result || (result.from ?? '/labs/search') !== from) return null
        set({ result: null })
        return result
      },
    }),
    {
      name: 'alpha-harness-dataset-pick',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
