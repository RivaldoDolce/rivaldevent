import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/svix@1.24.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('CLERK_WEBHOOK_SECRET')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  };

  let evt: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(payload, headers) as typeof evt;
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const type = evt.type;
  const data = evt.data as {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    unsafe_metadata?: Record<string, unknown>;
    phone_numbers?: Array<{ phone_number: string }>;
  };

  const clerkId = data.id;
  const email = data.email_addresses?.[0]?.email_address ?? null;
  const fullName = ([data.first_name, data.last_name].filter(Boolean).join(' ') || (email ? email.split('@')[0] : null)) ?? null;
  const avatar = data.image_url ?? null;
  const phone = (data.unsafe_metadata?.phone as string | undefined) ?? data.phone_numbers?.[0]?.phone_number ?? null;
  const isSeller = (data.unsafe_metadata?.is_seller as boolean | undefined) ?? false;

  try {
    if (type === 'user.created') {
      const { error } = await supabase.from('profiles').upsert(
        {
          clerk_user_id: clerkId,
          full_name: fullName,
          avatar_url: avatar,
          phone: phone ? phone.replace('+237', '') : null,
          is_seller: isSeller,
          role: 'client',
        },
        { onConflict: 'clerk_user_id' }
      );
      if (error) throw error;
    } else if (type === 'user.updated') {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatar,
          phone: phone ? phone.replace('+237', '') : null,
          is_seller: isSeller,
        })
        .eq('clerk_user_id', clerkId);
      if (error) throw error;
    } else if (type === 'user.deleted') {
      await supabase.from('profiles').delete().eq('clerk_user_id', clerkId);
    }
  } catch (e) {
    console.error('clerk-webhook error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
