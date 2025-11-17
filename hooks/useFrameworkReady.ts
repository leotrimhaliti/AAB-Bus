import { useEffect } from 'react';

export function useFrameworkReady() {
  useEffect(() => {
    // Use globalThis guard so this is safe on native and web
    const gw: any = typeof globalThis !== 'undefined' ? globalThis : undefined;
    if (gw && typeof gw.frameworkReady === 'function') {
      try {
        gw.frameworkReady();
      } catch (e) {
        // swallow errors from external hook but log for debugging
        // eslint-disable-next-line no-console
        console.warn('frameworkReady threw:', e);
      }
    }
  }, []);
}
