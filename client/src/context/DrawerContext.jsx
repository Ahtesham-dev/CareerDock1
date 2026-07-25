import { createContext, useContext } from 'react';

export const DrawerContext = createContext(null);

export const useDrawer = () => {
  const ctx = useContext(DrawerContext);
  if (!ctx) return { open: false, toggle: () => {}, close: () => {} };
  return ctx;
};
