/**
 * Picking seed Alphas on Alphas › Stored for Evolution Lab, then going back to it: while
 * `active`, Stored turns into a picker and Done leaves the choice in `result` for the lab to
 * take. Kept in sessionStorage, so a reload in the middle of a pick keeps it.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
/** A task breeds from at least two seeds and at most a hundred. */
export const MIN_SEEDS = 2
export const MAX_SEEDS = 100
export const useSeedPick = create()(
  persist(
    (set, get) => ({
      active: false,
      scope: null,
      ids: [],
      result: null,
      start: (scope, ids) => set({ active: true, scope, ids, result: null }),
      toggle: (ids, on) =>
        set((s) => ({
          ids: on ? [...new Set([...s.ids, ...ids])] : s.ids.filter((id) => !ids.includes(id)),
        })),
      finish: () => {
        const { scope, ids } = get()
        set({
          active: false,
          scope: null,
          ids: [],
          result: scope ? { scope, ids } : null,
        })
      },
      cancel: () => set({ active: false, scope: null, ids: [], result: null }),
      take: () => {
        const result = get().result
        if (result) set({ result: null })
        return result
      },
    }),
    {
      name: 'alpha-harness-seed-pick',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
