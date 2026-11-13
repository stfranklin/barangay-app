import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, x-supabase-api-version, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const response = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response({ error: 'Sign in as an administrator to continue.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceKey || !anonKey) return response({ error: 'The account service is not configured.' }, 500);

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !userData.user) return response({ error: 'Your session has expired. Sign in again.' }, 401);

  const { data: adminProfile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, active')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileError) return response({ error: 'Could not verify administrator access.' }, 500);
  if (adminProfile?.role !== 'admin' || adminProfile.active !== true) {
    return response({ error: 'Only active administrators can create resident accounts.' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return response({ error: 'Invalid request.' }, 400);
  }

  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const contact = typeof body.contact === 'string' ? body.contact.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!fullName || !address || !contact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response({ error: 'Enter a name, valid email, address, and contact number.' }, 400);
  }
  if (password.length < 8) return response({ error: 'The initial password must be at least 8 characters.' }, 400);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, address, contact },
    app_metadata: { provisioned_by_admin: true },
  });
  if (error) return response({ error: error.message }, 400);
  return response({ id: data.user.id, email: data.user.email });
});
