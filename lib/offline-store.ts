// Minimal Zustand store placeholder for offline queue
import create from 'zustand';

type State = {
  queue: any[];
  push: (item: any) => void;
  clear: () => void;
};

export const useOfflineStore = create<State>(set => ({
  queue: [],
  push: item => set(state => ({ queue: [...state.queue, item] })),
  clear: () => set({ queue: [] }),
}));
