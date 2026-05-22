
<script>
    import { onMount } from 'svelte';
    import { historyService } from '$lib/services/historyService.js';
    import { fade } from 'svelte/transition';

    let { data } = $props();
    let { supabase, user } = $derived(data);

    let stats = $state({
        summary: { prompt: 0, response: 0, total: 0, cost: 0 },
        daily: [],
        conversations: []
    });
    let isLoading = $state(true);

    onMount(async () => {
        if (user) {
            try {
                const data = await historyService.getUsageStats(supabase, user.id);
                
                // 요약 계산
                const summary = data.summary.reduce((acc, curr) => ({
                    prompt: acc.prompt + curr.prompt_tokens,
                    response: acc.response + curr.candidate_tokens,
                    total: acc.total + curr.total_tokens,
                    cost: acc.cost + Number(curr.estimated_cost_usd)
                }), { prompt: 0, response: 0, total: 0, cost: 0 });

                stats = {
                    summary,
                    daily: data.daily,
                    conversations: data.conversations
                };
            } catch (e) {
                console.error("Failed to load usage stats:", e);
            }
        }
        isLoading = false;
    });

    function formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    function formatCost(cost) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 6
        }).format(cost);
    }
</script>

<div class="usage-container">
    <header>
        <h1>📊 사용량 및 요금 리포트</h1>
        <p>Gemini API 사용량과 예상 요금을 실시간으로 확인하세요.</p>
    </header>

    {#if isLoading}
        <div class="loading">데이터를 불러오는 중...</div>
    {:else}
        <!-- 1. 전체 요약 카드 -->
        <section class="summary-grid">
            <div class="stat-card">
                <h3>누적 입력 토큰</h3>
                <div class="value">{formatNumber(stats.summary.prompt)}</div>
                <div class="label">Tokens</div>
            </div>
            <div class="stat-card">
                <h3>누적 출력 토큰</h3>
                <div class="value">{formatNumber(stats.summary.response)}</div>
                <div class="label">Tokens</div>
            </div>
            <div class="stat-card">
                <h3>전체 토큰 사용량</h3>
                <div class="value">{formatNumber(stats.summary.total)}</div>
                <div class="label">Tokens</div>
            </div>
            <div class="stat-card highlight">
                <h3>예상 발생 비용</h3>
                <div class="value">{formatCost(stats.summary.cost)}</div>
                <div class="label">USD (Gemini 1.5 Flash)</div>
            </div>
        </section>

        <div class="details-layout">
            <!-- 2. 일별 사용량 -->
            <section class="detail-section">
                <h2>📅 일별 사용량</h2>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>날짜</th>
                                <th>입력</th>
                                <th>출력</th>
                                <th>예상 비용</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each stats.daily as day}
                                <tr>
                                    <td>{day.usage_date}</td>
                                    <td>{formatNumber(day.total_prompt_tokens)}</td>
                                    <td>{formatNumber(day.total_candidate_tokens)}</td>
                                    <td>{formatCost(day.total_cost_usd)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- 3. 대화별 사용량 -->
            <section class="detail-section">
                <h2>💬 대화별 사용량</h2>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>대화 제목</th>
                                <th>사용 토큰</th>
                                <th>예상 비용</th>
                                <th>일시</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each stats.conversations as item}
                                <tr>
                                    <td class="title-cell">{item.conversations?.title || 'English Conversation'}</td>
                                    <td>{formatNumber(item.total_tokens)}</td>
                                    <td>{formatCost(item.estimated_cost_usd)}</td>
                                    <td>{new Date(item.created_at).toLocaleString()}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    {/if}
</div>

<style>
    .usage-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        color: white;
    }

    header { text-align: center; margin-bottom: 3rem; }
    header h1 { font-size: 2.5rem; color: #00a86b; margin-bottom: 0.5rem; }
    header p { color: #888; }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
    }

    .stat-card {
        background: #1a1a1a;
        padding: 1.5rem;
        border-radius: 20px;
        border: 1px solid #333;
        text-align: center;
    }

    .stat-card h3 { font-size: 0.9rem; color: #888; margin-bottom: 1rem; }
    .stat-card .value { font-size: 1.8rem; font-weight: bold; color: #eee; margin-bottom: 0.25rem; }
    .stat-card .label { font-size: 0.75rem; color: #555; text-transform: uppercase; }

    .stat-card.highlight { border-color: #00a86b; background: rgba(0, 168, 107, 0.05); }
    .stat-card.highlight .value { color: #00a86b; }

    .details-layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 3rem;
    }

    .detail-section h2 { font-size: 1.3rem; margin-bottom: 1.5rem; color: #eee; }

    .table-wrapper {
        background: #1a1a1a;
        border-radius: 16px;
        border: 1px solid #333;
        overflow: hidden;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }

    th { background: #222; padding: 1rem; font-size: 0.85rem; color: #888; font-weight: 600; }
    td { padding: 1rem; border-top: 1px solid #2a2a2a; font-size: 0.9rem; color: #ccc; }

    .title-cell { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .loading { text-align: center; padding: 4rem; color: #666; }

    @media (max-width: 768px) {
        .usage-container { padding: 1rem; }
        .summary-grid { grid-template-columns: 1fr 1fr; }
    }
</style>
