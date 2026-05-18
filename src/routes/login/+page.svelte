<script>
    import { enhance } from '$app/forms';
    export let form;
</script>

<div class="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md border border-gray-100">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">로그인</h2>
            <p class="mt-2 text-center text-sm text-gray-600">
                또는
                <a href="/register" class="font-medium text-blue-600 hover:text-blue-500">
                    아직 계정이 없다면 회원가입하기
                </a>
            </p>
        </div>
        
        <form class="mt-8 space-y-6" method="POST" use:enhance>
            <div class="rounded-md shadow-sm space-y-4">
                <div>
                    <label for="email-address" class="block text-sm font-medium text-gray-700 mb-1">이메일 주소</label>
                    <input id="email-address" name="email" type="email" autocomplete="email" required 
                        class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                        placeholder="you@example.com">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                    <input id="password" name="password" type="password" autocomplete="current-password" required 
                        class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                        placeholder="••••••••">
                </div>
            </div>

            {#if form?.error}
                <p class="text-red-500 text-sm mt-2">{form.error}</p>
            {/if}

            <div>
                <button type="submit" 
                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    로그인
                </button>
            </div>
        </form>
    </div>
</div>
