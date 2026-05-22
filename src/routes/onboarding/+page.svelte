
<script>
    import { goto } from '$app/navigation';
    import { historyService } from '$lib/services/historyService.js';

    let { data } = $props();
    let { supabase, user, policies } = $derived(data);

    let nickname = $state('');
    let phone = $state('');
    let consents = $state({}); // { policy_id: boolean }
    let isSubmitting = $state(false);
    let error = $state('');

    // 필수 약관 동의 여부 확인
    const isAllRequiredAgreed = $derived(
        policies.length > 0 && policies
            .filter(p => p.is_required)
            .every(p => consents[p.id])
    );

    const canSubmit = $derived(
        nickname.trim().length >= 2 && 
        phone.trim().length >= 10 && 
        isAllRequiredAgreed
    );

    async function handleSubmit() {
        if (!canSubmit) {
            console.log("Submit blocked: canSubmit is false", { nickname, phone, isAllRequiredAgreed });
            return;
        }
        
        isSubmitting = true;
        error = '';
        console.log("Starting onboarding submission for user:", user.id);

        try {
            // 1. 프로필 업데이트
            console.log("Updating profile...");
            await historyService.completeOnboarding(supabase, user.id, {
                nickname,
                phone_number: phone
            });

            // 2. 동의 이력 기록
            const agreedPolicyIds = Object.keys(consents)
                .filter(id => consents[id])
                .map(Number);
            
            if (agreedPolicyIds.length > 0) {
                console.log("Recording consents for policies:", agreedPolicyIds);
                await historyService.recordConsents(supabase, user.id, agreedPolicyIds);
            }

            console.log("Onboarding successful, redirecting to home...");
            // 3. 메인 페이지로 이동 (데이터 갱신을 위해 invalidateAll 사용)
            await goto('/', { invalidateAll: true });
        } catch (e) {
            console.error("Onboarding failed with error:", e);
            error = e.message || "정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.";
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="onboarding-page">
    <div class="onboarding-card">
        <header>
            <h1>👋 환영합니다!</h1>
            <p>서비스 이용을 위해 추가 정보 입력과 약관 동의가 필요합니다.</p>
        </header>

        {#if error}
            <div class="error-msg">{error}</div>
        {/if}

        <form onsubmit={e => { e.preventDefault(); handleSubmit(); }}>
            <section class="info-section">
                <h2>개인 정보 입력</h2>
                <div class="input-group">
                    <label for="nickname">닉네임</label>
                    <input 
                        type="text" 
                        id="nickname" 
                        bind:value={nickname} 
                        placeholder="2자 이상 입력"
                        required
                    />
                </div>
                <div class="input-group">
                    <label for="phone">전화번호</label>
                    <input 
                        type="tel" 
                        id="phone" 
                        bind:value={phone} 
                        placeholder="'-' 없이 입력 (예: 01012345678)"
                        required
                    />
                </div>
            </section>

            <section class="policy-section">
                <h2>약관 동의</h2>
                <div class="policy-list">
                    {#each policies as policy}
                        <div class="policy-item">
                            <label class="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    bind:checked={consents[policy.id]}
                                />
                                <span class="policy-name">
                                    [{policy.is_required ? '필수' : '선택'}] {policy.type === 'terms_of_service' ? '서비스 이용약관' : '개인정보 처리방침'}
                                </span>
                            </label>
                            <div class="policy-content">
                                {policy.content}
                            </div>
                        </div>
                    {/each}
                </div>
            </section>

            <button 
                type="submit" 
                class="submit-btn" 
                disabled={!canSubmit || isSubmitting}
            >
                {isSubmitting ? '처리 중...' : '시작하기'}
            </button>
        </form>
    </div>
</div>

<style>
    .onboarding-page {
        min-height: 100vh;
        background: #0a0a0a;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: white;
    }

    .onboarding-card {
        background: #1a1a1a;
        width: 100%;
        max-width: 600px;
        padding: 3rem;
        border-radius: 24px;
        border: 1px solid #333;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }

    header { text-align: center; margin-bottom: 2.5rem; }
    header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; color: #00a86b; }
    header p { color: #888; }

    section { margin-bottom: 2rem; }
    h2 { font-size: 1.2rem; margin-bottom: 1.25rem; color: #eee; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }

    .input-group { margin-bottom: 1.25rem; }
    .input-group label { display: block; font-size: 0.9rem; color: #888; margin-bottom: 0.5rem; }
    .input-group input {
        width: 100%;
        background: #121212;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 0.8rem 1rem;
        color: white;
        transition: border-color 0.2s;
    }
    .input-group input:focus { border-color: #00a86b; outline: none; }

    .policy-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .policy-item { background: #121212; padding: 1rem; border-radius: 12px; border: 1px solid #333; }
    
    .checkbox-label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; margin-bottom: 0.75rem; }
    .policy-name { font-size: 0.95rem; font-weight: 500; }
    
    .policy-content {
        height: 100px;
        overflow-y: auto;
        font-size: 0.8rem;
        color: #666;
        background: #0a0a0a;
        padding: 0.75rem;
        border-radius: 8px;
        line-height: 1.5;
    }

    .submit-btn {
        width: 100%;
        background: #00a86b;
        color: white;
        border: none;
        padding: 1rem;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 1rem;
    }
    .submit-btn:hover:not(:disabled) { background: #008f5d; transform: translateY(-2px); }
    .submit-btn:disabled { background: #333; color: #555; cursor: not-allowed; }

    .error-msg {
        background: rgba(255, 0, 0, 0.1);
        color: #ff5555;
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        text-align: center;
        font-size: 0.9rem;
    }
</style>
