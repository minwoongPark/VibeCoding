
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load = async ({ locals: { safeGetSession, supabase }, url, cookies }) => {
    const { session, user } = await safeGetSession();

    // 1. 리다이렉트 제외 경로 (인증, 온보딩 등)
    const excludedPaths = ['/onboarding', '/login', '/register', '/auth/callback', '/auth/logout'];
    if (excludedPaths.some(path => url.pathname.startsWith(path))) {
        return { 
            session, 
            user,
            cookies: cookies.getAll(),
            supabaseConfig: {
                url: env.SUPABASE_DB_URL,
                anonKey: env.SUPABASE_DE_PULBIC_KEY,
            }
        };
    }

    // 2. 로그인된 경우 온보딩 상태 체크
    if (session && user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

        // 프로필이 없거나 온보딩이 미완료된 경우 온보딩 페이지로 강제 이동
        if (!profile || !profile.onboarding_completed) {
            throw redirect(303, '/onboarding');
        }
    }

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
