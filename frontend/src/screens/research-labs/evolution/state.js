/** The Evolution Lab's choices, kept between visits. */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SCOPE } from '@/lib/scope'
export const useEvolutionLab = create()(
  persist(
    (set) => ({
      region: DEFAULT_SCOPE.region,
      delay: DEFAULT_SCOPE.delay,
      universe: DEFAULT_SCOPE.universe,
      seedIds: [],
      cores: 4,
      simulations: null,
      population: null,
      neutralizations: [],
      mutationRate: 0.05,
      autoJobId: null,
      appliedJobId: null,
      set: (change) => set(change),
    }),
    { name: 'alpha-harness-evolution-lab' },
  ),
)
