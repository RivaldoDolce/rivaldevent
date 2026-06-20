import { supabase } from '../lib/supabase';

export async function fetchTickets(userId: string) {
  const { data, error } = await supabase.from('tickets').select('*').eq('owner_id', userId);
  if (error) throw error;
  return data;
}
