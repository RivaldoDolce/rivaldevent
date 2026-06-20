import { useOfflineStore } from '../lib/offline-store';
import { supabase } from '../lib/supabase';

export async function flushQueue() {
  const { queue, clear } = useOfflineStore.getState();
  for (const item of queue) {
    // naive example: send to supabase
    await supabase.from(item.table).insert(item.payload);
  }
  clear();
}
