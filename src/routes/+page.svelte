<script>
	import VoiceRecorder from '$lib/components/VoiceRecorder.svelte';
	import LiveConversation from '$lib/components/LiveConversation.svelte';

	let { data } = $props();
	let { session } = $derived(data);

	let activeTab = $state('recorder'); // 'recorder' or 'live'

	function setActiveTab(tab) {
		activeTab = tab;
	}
</script>

<main>
	{#if session}
		<div class="header">
			<h1>🎙️ My Speaking AI</h1>
			<p>AI와 함께하는 스마트한 영어 회화 및 음성 녹음 도구</p>
		</div>

		<div class="tabs">
			<button 
				class="tab-btn" 
				class:active={activeTab === 'recorder'} 
				onclick={() => setActiveTab('recorder')}
			>
				📟 음성 녹음기
			</button>
			<button 
				class="tab-btn" 
				class:active={activeTab === 'live'} 
				onclick={() => setActiveTab('live')}
			>
				🎙️ 실시간 영어회화
			</button>
		</div>
		
		<div class="content">
			{#if activeTab === 'recorder'}
				<div class="tab-content">
					<VoiceRecorder />
					
					<div class="guide">
						<h2>📟 음성 녹음기 사용 방법</h2>
						<ol>
							<li><strong>녹음 시작</strong>: "녹음 시작" 버튼을 눌러 음성 녹음을 시작합니다</li>
							<li><strong>마이크 권한</strong>: 브라우저에서 마이크 사용 권한을 허용해주세요</li>
							<li><strong>녹음 중지</strong>: 말씀이 끝나면 "녹음 중지" 버튼을 누릅니다</li>
							<li><strong>재생 확인</strong>: "재생" 버튼으로 녹음된 음성을 들어볼 수 있습니다</li>
						</ol>
					</div>
				</div>
			{:else if activeTab === 'live'}
				<div class="tab-content">
					<LiveConversation supabase={data.supabase} user={data.user} />

					<div class="guide live-guide">
						<h2>🎙️ 실시간 영어회화 사용 방법</h2>
						<ol>
							<li><strong>연결 시작</strong>: "Start Connection" 버튼을 눌러 AI와 연결합니다</li>
							<li><strong>마이크 활성화</strong>: "Start Mic" 버튼을 눌러 음성 대화를 시작하세요</li>
							<li><strong>자연스럽게 대화</strong>: 영어로 말씀하시면 AI가 실시간으로 듣고 답변합니다</li>
							<li><strong>텍스트 대화</strong>: 채팅창을 통해서도 메시지를 보낼 수 있습니다</li>
						</ol>
						
						<div class="tips">
							<h3>💡 대화 팁</h3>
							<ul>
								<li>"Can you practice a job interview with me?"라고 요청해보세요</li>
								<li>발음이나 문법 교정을 부탁하며 학습 효과를 높여보세요</li>
							</ul>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="welcome-screen">
			<h1>🎙️ My Speaking AI</h1>
			<p class="subtitle">AI와 함께하는 스마트한 영어 학습의 시작</p>
			
			<div class="features-grid">
				<div class="feature-card">
					<div class="icon">📟</div>
					<h3>음성 녹음기</h3>
					<p>자신의 발음을 녹음하고 다시 들어보며 교정할 수 있습니다.</p>
				</div>
				<div class="feature-card">
					<div class="icon">🎙️</div>
					<h3>실시간 대화</h3>
					<p>Gemini AI와 실시간으로 영어 대화를 나누며 실력을 쌓으세요.</p>
				</div>
			</div>

			<div class="auth-actions">
				<p>서비스를 이용하려면 로그인이 필요합니다.</p>
				<div class="btn-group">
					<a href="/login" class="btn btn-primary">로그인하기</a>
					<a href="/register" class="btn btn-secondary">회원가입하기</a>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #0a0a0a;
		min-height: 100vh;
		color: white;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 3rem;
		margin-bottom: 0.5rem;
		background: linear-gradient(to right, #00a86b, #00d2ff);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.tabs {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.tab-btn {
		background: #2a2a2a;
		color: #888;
		border: 1px solid #444;
		padding: 1rem 2rem;
		border-radius: 12px;
		cursor: pointer;
		font-size: 1.1rem;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.tab-btn.active {
		background: #00a86b;
		color: #fff;
		border-color: #00a86b;
		box-shadow: 0 0 15px rgba(0, 168, 107, 0.3);
	}

	.tab-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		animation: fadeIn 0.4s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.guide {
		background: #1a1a1a;
		border-radius: 16px;
		padding: 1.5rem;
		border: 1px solid #333;
		margin-top: 2rem;
	}

	.guide h2 {
		color: #00a86b;
		margin-bottom: 1rem;
		font-size: 1.3rem;
	}

	.guide ol {
		padding-left: 1.5rem;
		color: #ccc;
	}

	.guide li {
		margin-bottom: 0.5rem;
	}

	.tips {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #252525;
		border-radius: 8px;
	}

	.tips h3 {
		color: #ff9800;
		margin-bottom: 0.5rem;
	}

	.tips ul {
		padding-left: 1.5rem;
		color: #ccc;
	}

	/* Welcome Screen Styles */
	.welcome-screen {
		text-align: center;
		padding: 4rem 1rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.welcome-screen h1 {
		font-size: 3.5rem;
		margin-bottom: 1rem;
		background: linear-gradient(to right, #00a86b, #00d2ff);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		font-size: 1.25rem;
		color: #aaa;
		margin-bottom: 3rem;
	}

	.features-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 4rem;
	}

	.feature-card {
		background: #1a1a1a;
		padding: 2rem;
		border-radius: 20px;
		border: 1px solid #333;
		transition: transform 0.3s ease;
	}

	.feature-card:hover {
		transform: translateY(-5px);
		border-color: #00a86b;
	}

	.feature-card .icon {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.feature-card h3 {
		color: #00a86b;
		margin-bottom: 0.5rem;
	}

	.feature-card p {
		color: #999;
		line-height: 1.5;
	}

	.auth-actions {
		background: #1a1a1a;
		padding: 2rem;
		border-radius: 20px;
		border: 1px solid #333;
	}

	.auth-actions p {
		margin-bottom: 1.5rem;
		color: #ccc;
	}

	.btn-group {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.btn {
		padding: 0.75rem 2rem;
		border-radius: 10px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #00a86b;
		color: white;
	}

	.btn-primary:hover {
		background: #008f5d;
		box-shadow: 0 0 15px rgba(0, 168, 107, 0.4);
	}

	.btn-secondary {
		background: transparent;
		color: #00a86b;
		border: 1px solid #00a86b;
	}

	.btn-secondary:hover {
		background: rgba(0, 168, 107, 0.1);
	}

	@media (max-width: 768px) {
		.tabs, .features-grid {
			flex-direction: column;
			grid-template-columns: 1fr;
		}
		.header h1, .welcome-screen h1 {
			font-size: 2.5rem;
		}
		.btn-group {
			flex-direction: column;
		}
	}
</style>
