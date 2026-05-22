
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

DROP TRIGGER IF EXISTS set_updated_at ON public.conversations;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
