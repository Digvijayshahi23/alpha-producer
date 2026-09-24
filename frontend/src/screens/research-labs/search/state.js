/** The Search Lab's choices, kept between visits. */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SCOPE } from '@/lib/scope'
export const useSearchLab = create()(
  persist(
    (set) => ({
      region: DEFAULT_SCOPE.region,
      delay: DEFAULT_SCOPE.delay,
      universe: DEFAULT_SCOPE.universe,
      datasetIds: [],
      cores: 4,
      simulations: null,
      decay: 0,
      vectorOperators: null,
      neutralizations: [],
      set: (change) => set(change),
    }),
    { name: 'alpha-harness-search-lab' },
  ),
)
