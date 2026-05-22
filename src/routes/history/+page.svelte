
<script>
    import { onMount } from 'svelte';
    import { historyService } from '$lib/services/historyService.js';
    import { fade, slide } from 'svelte/transition';

    let { data } = $props();
    let { supabase, user } = $derived(data);

    let conversations = $state([]);
    let selectedConversationId = $state(null);
    let messages = $state([]);
    let isLoading = $state(true);
    let isMessagesLoading = $state(false);

    onMount(async () => {
        if (user) {
            await loadConversations();
        }
        isLoading = false;
    });

    async function loadConversations() {
        try {
            conversations = await historyService.getConversations(supabase);
        } catch (e) {
            console.error("Failed to load conversations:", e);
        }
    }

    async function selectConversation(id) {
        selectedConversationId = id;
        isMessagesLoading = true;
        try {
            messages = await historyService.getMessages(supabase, id);
        } catch (e) {
            console.error("Failed to load messages:", e);
        } finally {
            isMessagesLoading = false;
        }
    }

    async function deleteConversation(id, e) {
        e.stopPropagation();
        if (!confirm("정말 이 대화 기록을 삭제하시겠습니까?")) return;

        try {
            await historyService.deleteConversation(supabase, id);
            conversations = conversations.filter(c => c.id !== id);
            if (selectedConversationId === id) {
                selectedConversationId = null;
                messages = [];
            }
        } catch (e) {
            console.error("Failed to delete conversation:", e);
        }
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
</script>

<div class="history-container">
    <header>
        <h1>📚 대화 기록</h1>
        <p>지금까지 나눈 영어 회화 기록을 확인해보세요.</p>
    </header>

    <div class="layout">
        <!-- 사이드바: 대화 목록 -->
        <aside class="sidebar">
            <h2>대화 목록</h2>
            {#if isLoading}
                <div class="loading">로딩 중...</div>
            {:else if conversations.length === 0}
                <div class="empty-state">저장된 대화가 없습니다.</div>
            {:else}
                <ul class="conversation-list">
                    {#each conversations as conv (conv.id)}
                        <li 
                            class:active={selectedConversationId === conv.id}
                            onclick={() => selectConversation(conv.id)}
                        >
                            <div class="conv-info">
                                <span class="conv-title">{conv.title || 'English Conversation'}</span>
                                <span class="conv-date">{formatDate(conv.updated_at)}</span>
                                <span class="conv-preview">{conv.last_message || '메시지 없음'}</span>
                            </div>
                            <button class="delete-btn" onclick={(e) => deleteConversation(conv.id, e)} title="삭제">
                                🗑️
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </aside>

        <!-- 메인: 메시지 내역 -->
        <main class="message-viewer">
            {#if !selectedConversationId}
                <div class="placeholder">
                    <div class="icon">💬</div>
                    <p>왼쪽 목록에서 대화를 선택하여 내용을 확인하세요.</p>
                </div>
            {:else if isMessagesLoading}
                <div class="loading">메시지 불러오는 중...</div>
            {:else}
                <div class="messages-header">
                    <h3>{conversations.find(c => c.id === selectedConversationId)?.title || '대화 내용'}</h3>
                </div>
                <div class="messages-list">
                    {#each messages as msg (msg.id)}
                        <div class="message-wrapper {msg.role}" in:fade>
                            <div class="message-bubble">
                                <div class="role-tag">{msg.role === 'user' ? '나' : 'AI'}</div>
                                <div class="text">{msg.content}</div>
                                <div class="time">{formatDate(msg.created_at)}</div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </main>
    </div>
</div>

<style>
    .history-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        color: white;
        font-family: inherit;
    }

    header {
        text-align: center;
        margin-bottom: 2rem;
    }

    header h1 {
        font-size: 2.5rem;
        background: linear-gradient(to right, #00a86b, #00d2ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }

    header p { color: #888; }

    .layout {
        display: grid;
        grid-template-columns: 350px 1fr;
        gap: 2rem;
        height: 700px;
        background: #1a1a1a;
        border-radius: 20px;
        border: 1px solid #333;
        overflow: hidden;
    }

    /* Sidebar Styles */
    .sidebar {
        background: #222;
        border-right: 1px solid #333;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .sidebar h2 {
        padding: 1.5rem;
        font-size: 1.2rem;
        border-bottom: 1px solid #333;
        margin: 0;
    }

    .conversation-list {
        list-style: none;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        flex: 1;
    }

    .conversation-list li {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #2a2a2a;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background 0.2s;
    }

    .conversation-list li:hover { background: #2a2a2a; }
    .conversation-list li.active { background: #333; border-left: 4px solid #00a86b; }

    .conv-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
        overflow: hidden;
    }

    .conv-title { font-weight: 600; font-size: 0.95rem; }
    .conv-date { font-size: 0.75rem; color: #666; }
    .conv-preview {
        font-size: 0.85rem;
        color: #888;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .delete-btn {
        background: none;
        border: none;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
        padding: 0.5rem;
        font-size: 1.1rem;
    }

    .conversation-list li:hover .delete-btn { opacity: 0.6; }
    .delete-btn:hover { opacity: 1 !important; }

    /* Message Viewer Styles */
    .message-viewer {
        display: flex;
        flex-direction: column;
        background: #121212;
        overflow: hidden;
    }

    .placeholder {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #555;
    }

    .placeholder .icon { font-size: 4rem; margin-bottom: 1rem; }

    .messages-header {
        padding: 1rem 2rem;
        background: #222;
        border-bottom: 1px solid #333;
    }

    .messages-list {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .message-wrapper { display: flex; flex-direction: column; }
    .message-wrapper.user { align-items: flex-end; }
    .message-wrapper.model, .message-wrapper.assistant { align-items: flex-start; }

    .message-bubble {
        max-width: 80%;
        padding: 1rem;
        border-radius: 16px;
        position: relative;
    }

    .user .message-bubble { background: #00a86b; color: white; border-bottom-right-radius: 4px; }
    .model .message-bubble, .assistant .message-bubble { 
        background: #2a2a2a; 
        color: #eee; 
        border-bottom-left-radius: 4px; 
        border: 1px solid #333; 
    }

    .role-tag { font-size: 0.7rem; font-weight: bold; margin-bottom: 0.25rem; opacity: 0.8; }
    .text { line-height: 1.5; font-size: 0.95rem; }
    .time { font-size: 0.65rem; margin-top: 0.5rem; opacity: 0.6; text-align: right; }

    .loading, .empty-state { padding: 2rem; text-align: center; color: #666; }

    @media (max-width: 900px) {
        .layout { grid-template-columns: 1fr; height: auto; min-height: 600px; }
        .sidebar { height: 300px; }
    }
</style>
