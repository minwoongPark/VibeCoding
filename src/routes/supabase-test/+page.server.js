import { supabase } from '$lib/services/supabaseClient';
import { fail } from '@sveltejs/kit';

export const load = async () => {
    try {
        const { data, error } = await supabase
            .from('test_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return { messages: [], error: error.message };
        }

        return { messages: data };
    } catch (e) {
        return { messages: [], error: e.message };
    }
};

export const actions = {
    addMessage: async ({ request }) => {
        const formData = await request.formData();
        const content = formData.get('content');

        if (!content) {
            return fail(400, { error: '내용을 입력해주세요.' });
        }

        const { data, error } = await supabase
            .from('test_messages')
            .insert([{ content, author: 'User' }])
            .select();

        if (error) {
            return fail(500, { error: error.message });
        }

        return { success: true, message: data[0] };
    }
};
