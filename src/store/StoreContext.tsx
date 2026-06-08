import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { WorkSpaceStore } from './workspaceStore';

const StoreContext = createContext<WorkSpaceStore | null>(null);

export interface StoreProviderProps {
  store: WorkSpaceStore;
  children: ReactNode;
}

export function StoreProvider({ store, children }: StoreProviderProps) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): WorkSpaceStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used inside StoreProvider.');
  }

  return store;
}
