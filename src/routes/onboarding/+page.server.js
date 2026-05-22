
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { safeGetSession, supabase }, url }) => {
    const { session, user } = await safeGetSession();

    if (!session || !user) {
        throw redirect(303, '/login');
    }

    // 1. 프로필 확인
    const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

    // 이미 완료했다면 메인으로
    if (profile?.onboarding_completed) {
        throw redirect(303, '/');
    }

    // 2. 필요한 약관 목록 가져오기 (활성화된 것만)
    const { data: policies, error: policyError } = await supabase
        .from('policy_versions')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

    if (policyError) {
        console.error("Policy fetch error:", policyError);
    }

    return {
        user,
        policies: policies || []
    };
};
