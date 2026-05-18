import { env } from '$env/dynamic/private';

export const load = async ({ locals: { safeGetSession }, cookies }) => {
  const { session, user } = await safeGetSession();

  return {
    session,
    user,
    cookies: cookies.getAll(),
    supabaseConfig: {
      url: env.SUPABASE_DB_URL,
      anonKey: env.SUPABASE_DE_PULBIC_KEY,
    }
  };
};
