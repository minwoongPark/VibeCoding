<script>
    export let data;
    export let form;

    let content = '';
</script>

<div class="p-8 max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Supabase 통신 테스트</h1>

    <div class="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
        <h2 class="text-xl font-semibold mb-4">메시지 추가</h2>
        <form method="POST" action="?/addMessage" class="flex flex-col gap-4">
            <textarea
                name="content"
                bind:value={content}
                placeholder="테스트 메시지를 입력하세요..."
                class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows="3"
            ></textarea>
            <button
                type="submit"
                class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
                DB에 저장하기
            </button>
        </form>

        {#if form?.error}
            <p class="text-red-500 mt-4">{form.error}</p>
        {/if}
        {#if form?.success}
            <p class="text-green-500 mt-4">성공적으로 저장되었습니다!</p>
        {/if}
    </div>

    <div class="bg-gray-50 shadow rounded-lg p-6 border border-gray-200">
        <h2 class="text-xl font-semibold mb-4">저장된 메시지 목록</h2>
        
        {#if data.error}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong class="font-bold">에러 발생:</strong>
                <span class="block sm:inline">{data.error}</span>
                <p class="mt-2 text-sm">참고: 아직 테이블을 생성하지 않았다면 SQL 쿼리를 먼저 실행해주세요.</p>
            </div>
        {:else if data.messages && data.messages.length > 0}
            <ul class="space-y-4">
                {#each data.messages as msg}
                    <li class="bg-white p-4 rounded border border-gray-200 shadow-sm">
                        <p class="text-gray-800">{msg.content}</p>
                        <div class="mt-2 text-xs text-gray-500 flex justify-between">
                            <span>작성자: {msg.author}</span>
                            <span>{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="text-gray-500 italic text-center py-8">메시지가 없습니다.</p>
        {/if}
    </div>

    <div class="mt-8">
        <a href="/" class="text-blue-600 hover:underline">← 홈으로 돌아가기</a>
    </div>
</div>
