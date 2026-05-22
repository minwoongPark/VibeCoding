
/**
 * Supabase를 이용한 대화 기록 저장 서비스
 */
export const historyService = {
    /**
     * 새로운 대화 세션 생성
     */
    async createConversation(supabase, userId, title = 'New Conversation') {
        const { data, error } = await supabase
            .from('conversations')
            .insert({ user_id: userId, title })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * 메시지 저장
     */
    async saveMessage(supabase, conversationId, role, content) {
        const { error: messageError } = await supabase
            .from('messages')
            .insert({ conversation_id: conversationId, role, content });

        if (messageError) throw messageError;

        // 대화의 마지막 메시지 및 업데이트 시간 갱신
        const { error: convError } = await supabase
            .from('conversations')
            .update({ last_message: content, updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        if (convError) throw convError;
    },

    /**
     * 사용자의 모든 대화 목록 가져오기
     */
    async getConversations(supabase) {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * 특정 대화의 메시지들 가져오기
     */
    async getMessages(supabase, conversationId) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * 대화 삭제
     */
    async deleteConversation(supabase, conversationId) {
        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', conversationId);

        if (error) throw error;
    },

    /**
     * 사용자 설정 가져오기
     */
    async getUserSettings(supabase, userId) {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'no rows returned'
        return data;
    },

    /**
     * 사용자 설정 저장/업데이트
     */
    async updateUserSettings(supabase, userId, settings) {
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({ user_id: userId, ...settings })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * 프로필 정보 가져오기
     */
    async getProfile(supabase, userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * 온보딩 완료 처리 (프로필 업데이트)
     */
    async completeOnboarding(supabase, userId, profileData) {
        const { error } = await supabase
            .from('profiles')
            .update({ 
                ...profileData, 
                onboarding_completed: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        if (error) throw error;
    },

    /**
     * 활성 약관 목록 가져오기
     */
    async getActivePolicies(supabase) {
        const { data, error } = await supabase
            .from('policy_versions')
            .select('*')
            .eq('is_active', true);
        if (error) throw error;
        return data;
    },

    /**
     * 약관 동의 저장
     */
    async recordConsents(supabase, userId, policyIds) {
        const consents = policyIds.map(id => ({
            user_id: userId,
            policy_version_id: id
        }));
        const { error } = await supabase
            .from('user_consents')
            .insert(consents);
        if (error) throw error;
    }
};
