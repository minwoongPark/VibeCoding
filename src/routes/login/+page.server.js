import { fail, redirect } from '@sveltejs/kit';

export const actions = {
    default: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData();
        const email = formData.get('email');
        const password = formData.get('password');

        if (!email || !password) {
            return fail(400, { error: '이메일과 비밀번호를 모두 입력해주세요.' });
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return fail(401, { error: '로그인 정보가 올바르지 않습니다.' });
        }

        throw redirect(303, '/');
    }
};
