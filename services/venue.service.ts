import { supabase } from '../lib/supabase';

export async function fetchVenues() {
  const { data, error } = await supabase.from('venues').select('*');
  if (error) throw error;
  return data;
}
