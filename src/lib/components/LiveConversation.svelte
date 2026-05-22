<!-- src/lib/components/LiveConversation.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import { sendMessage, startNewChat } from '$lib/services/geminiChat.js';
    import { historyService } from '$lib/services/historyService.js';

    let { supabase, user } = $props();

    let isConnected = $state(false);
    let isThinking = $state(false);
    let messages = $state([]);
    let inputText = $state('');
    let error = $state('');
    let chatEnd;
    let conversationId = $state(null);

    onMount(async () => {
        try {
            await startNewChat('gemini-2.5-flash');
            isConnected = true;
            
            // 초기 환영 메시지
            const welcomeText = 'Hello! I am your English practice partner. How can I help you today?';
            addMessage('assistant', welcomeText);
        } catch (e) {
            error = "Failed to initialize chat. Check your API Key.";
            console.error(e);
        }
    });

    // Auto-scroll to bottom
    $effect(() => {
        if (messages.length && chatEnd) {
            chatEnd.scrollIntoView({ behavior: 'smooth' });
        }
    });

    async function ensureConversation() {
        if (!conversationId && user) {
            try {
                const conv = await historyService.createConversation(supabase, user.id, "English Conversation");
                conversationId = conv.id;
            } catch (e) {
                console.error("Failed to create conversation in DB:", e);
            }
        }
    }

    async function handleSendMessage() {
        if (!inputText.trim() || isThinking) return;

        const userText = inputText.trim();
        inputText = '';
        addMessage('user', userText);
        
        isThinking = true;
        error = '';

        try {
            // DB에 대화 저장 시작
            await ensureConversation();
            if (conversationId) {
                historyService.saveMessage(supabase, conversationId, 'user', userText);
            }

            const responseText = await sendMessage(userText);
            addMessage('assistant', responseText);

            // AI 응답 저장
            if (conversationId) {
                historyService.saveMessage(supabase, conversationId, 'model', responseText);
            }
        } catch (e) {
            error = "Error: Could not get response from AI.";
            console.error(e);
        } finally {
            isThinking = false;
        }
    }

    function addMessage(role, text) {
        messages = [...messages, { role, text, id: Date.now() }];
    }

    function handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }

    async function resetChat() {
        messages = [];
        error = '';
        conversationId = null; // 리셋 시 새로운 세션 생성 유도
        try {
            await startNewChat('gemini-2.5-flash');
            addMessage('assistant', 'Chat reset! What should we talk about now?');
        } catch (e) {
            error = "Failed to reset chat.";
        }
    }
</script>

<div class="chat-container">
    <div class="header">
        <div class="title-area">
            <h2>💬 English Practice Chat</h2>
            <p class="subtitle">Powered by Gemini 2.5 Flash</p>
        </div>
        <button class="reset-btn" onclick={resetChat}>Reset Chat</button>
    </div>

    {#if error}
        <div class="error-box">
            <span>⚠️</span> {error}
            <button onclick={() => error = ''}>✕</button>
        </div>
    {/if}

    <div class="chat-area">
        <div class="message-list">
            {#each messages as msg (msg.id)}
                <div class="message-wrapper {msg.role}">
                    <div class="message-bubble">
                        <div class="text-content">{msg.text}</div>
                    </div>
                </div>
            {/each}
            
            {#if isThinking}
                <div class="message-wrapper assistant">
                    <div class="message-bubble thinking">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                </div>
            {/if}
            <div bind:this={chatEnd}></div>
        </div>
    </div>

    <div class="input-panel">
        <div class="input-row">
            <textarea 
                bind:value={inputText} 
                onkeydown={handleKeydown}
                placeholder="Type your English message..."
                rows="1"
            ></textarea>
            <button 
                class="send-btn" 
                disabled={!inputText.trim() || isThinking} 
                onclick={handleSendMessage}
            >
                ➤
            </button>
        </div>
    </div>
</div>

<style>
    .chat-container {
        display: flex;
        flex-direction: column;
        height: 600px;
        background: #1a1a1a;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid #333;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }

    /* Header */
    .header {
        padding: 1rem 1.5rem;
        background: #222;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header h2 { margin: 0; font-size: 1.1rem; color: #fff; }
    .subtitle { margin: 0; font-size: 0.75rem; color: #888; }

    .reset-btn {
        background: none;
        border: 1px solid #444;
        color: #888;
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .reset-btn:hover { background: #333; color: #fff; }

    /* Error Box */
    .error-box {
        background: #4a1a1a;
        color: #ff8888;
        padding: 0.75rem 1rem;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .error-box button { background: none; border: none; color: #ff8888; cursor: pointer; margin-left: auto; }

    /* Chat Area */
    .chat-area {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
        background: #121212;
        display: flex;
        flex-direction: column;
    }

    .message-list { display: flex; flex-direction: column; gap: 1rem; }

    .message-wrapper { display: flex; width: 100%; }
    .message-wrapper.user { justify-content: flex-end; }
    .message-wrapper.assistant { justify-content: flex-start; }

    .message-bubble {
        max-width: 85%;
        padding: 0.75rem 1rem;
        border-radius: 18px;
        font-size: 0.95rem;
    }

    .user .message-bubble { background: #00a86b; color: white; border-bottom-right-radius: 4px; }
    .assistant .message-bubble { background: #2a2a2a; color: #eee; border-bottom-left-radius: 4px; border: 1px solid #333; }

    .text-content { line-height: 1.5; word-break: break-word; }

    /* Thinking Animation */
    .thinking { display: flex; gap: 4px; padding: 1rem; }
    .dot { width: 6px; height: 6px; background: #555; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out; }
    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1.0); }
    }

    /* Input Panel */
    .input-panel {
        padding: 1rem 1.25rem;
        background: #222;
        border-top: 1px solid #333;
    }

    .input-row {
        display: flex;
        gap: 0.75rem;
        background: #121212;
        padding: 0.5rem 0.75rem;
        border-radius: 15px;
        border: 1px solid #333;
        align-items: center;
    }

    textarea {
        flex: 1;
        background: none;
        border: none;
        color: white;
        padding: 0.5rem;
        resize: none;
        outline: none;
        font-family: inherit;
        font-size: 0.95rem;
        max-height: 120px;
    }

    .send-btn {
        background: #00a86b;
        color: white;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        transition: transform 0.2s;
    }
    .send-btn:active:not(:disabled) { transform: scale(0.9); }
    .send-btn:disabled { background: #333; color: #555; cursor: not-allowed; }
</style>
