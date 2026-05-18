import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';

export const load = async ({ data, fetch, depends }) => {
  /**
   * Declare a dependency so that the load function runs again upon invalidation
   */
  depends('supabase:auth');

  const supabase = isBrowser()
    ? createBrowserClient(data.supabaseConfig.url, data.supabaseConfig.anonKey, {
        global: {
          fetch,
        },
      })
    : createServerClient(data.supabaseConfig.url, data.supabaseConfig.anonKey, {
        global: {
          fetch,
        },
        cookies: {
          getAll() {
            return data.cookies;
          },
        },
      });

  /**
   * It's fine to use `getSession` here, because on the client, `getSession` is
   * protected by a lot of safeguards.
   */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, session, user };
};
