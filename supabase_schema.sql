
-- 대화 세션을 저장하는 테이블
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    last_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 대화 메시지를 저장하는 테이블
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 설정
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 대화(Conversations) 정책: 자신의 것만 관리 가능
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own conversations') THEN
        CREATE POLICY "Users can manage their own conversations" 
        ON public.conversations FOR ALL 
        TO authenticated 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 메시지(Messages) 정책: 자신이 소유한 대화의 메시지만 관리 가능
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage messages in their conversations') THEN
        CREATE POLICY "Users can manage messages in their conversations" 
        ON public.messages FOR ALL 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.conversations 
                WHERE id = public.messages.conversation_id 
                AND user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- updated_at 자동 업데이트를 위한 트리거
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 사용자 설정을 저장하는 테이블
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_personality TEXT DEFAULT 'friendly', -- 'friendly', 'strict', 'custom'
    custom_instruction TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 설정
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 사용자 설정 정책
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own settings') THEN
        CREATE POLICY "Users can manage their own settings" 
        ON public.user_settings FOR ALL 
        TO authenticated 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_settings ON public.user_settings;
CREATE TRIGGER set_updated_at_settings
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 기존 트리거들...

-- 1. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT,
    phone_number TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 약관 버전 관리 테이블
CREATE TABLE IF NOT EXISTS public.policy_versions (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'terms_of_service', 'privacy_policy'
    version TEXT NOT NULL,
    content TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 사용자 동의 이력 테이블
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    policy_version_id INTEGER NOT NULL REFERENCES public.policy_versions(id),
    agreed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- 프로필 정책
CREATE POLICY "Users can view and update own profile" 
ON public.profiles FOR ALL TO authenticated 
USING (auth.uid() = id);

-- 약관 버전 정책 (모두 조회 가능)
CREATE POLICY "Policy versions are viewable by everyone" 
ON public.policy_versions FOR SELECT TO public 
USING (is_active = TRUE);

-- 동의 이력 정책
CREATE POLICY "Users can manage own consents" 
ON public.user_consents FOR ALL TO authenticated 
USING (auth.uid() = user_id);

-- 프로필 자동 생성을 위한 트리거 및 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at 트리거 연결
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 초기 약관 데이터 삽입
INSERT INTO public.policy_versions (type, version, content) VALUES 
('terms_of_service', 'v1.0', '서비스 이용약관 내용...'),
('privacy_policy', 'v1.0', '개인정보 처리방침 내용...');

DROP TRIGGER IF EXISTS set_updated_at ON public.conversations;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
