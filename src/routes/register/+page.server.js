import { fail, redirect } from '@sveltejs/kit';

export const actions = {
    default: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData();
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (!email || !password) {
            return fail(400, { error: '이메일과 비밀번호를 모두 입력해주세요.' });
        }

        if (password !== confirmPassword) {
            return fail(400, { error: '비밀번호가 일치하지 않습니다.' });
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
            },
        });

        if (error) {
            return fail(500, { error: error.message });
        }

        return { success: true, message: '회원가입 확인 메일이 발송되었습니다. 이메일을 확인해주세요.' };
    }
};
