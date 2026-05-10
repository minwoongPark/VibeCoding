<script>
	// 음성 녹음 및 영어회화 컴포넌트를 import 합니다
	// $는 src/ 폴더를 가리키는 SvelteKit의 별칭입니다
	import VoiceRecorder from '$lib/components/VoiceRecorder.svelte';
	import EnglishConversation from '$lib/components/EnglishConversation.svelte';
	
	// 현재 활성화된 탭 상태
	let activeTab = $state('recorder');
</script>

<!-- 메인 페이지 콘텐츠 -->
<main>
	<!-- 페이지 제목 -->
	<div class="header">
		<h1>🎙️ 음성 녹음 및 영어회화</h1>
		<p>음성 녹음과 실시간 영어회화 연습을 할 수 있는 통합 플랫폼</p>
	</div>
	
	<!-- 탭 네비게이션 -->
	<div class="tab-navigation">
		<button 
			class="tab-btn"
			class:active={activeTab === 'recorder'}
			onclick={() => activeTab = 'recorder'}
		>
			🎙️ 음성 녹음기
		</button>
		<button 
			class="tab-btn"
			class:active={activeTab === 'conversation'}
			onclick={() => activeTab = 'conversation'}
		>
			🗣️ 영어회화 연습
		</button>
	</div>
	
	<!-- 탭 콘텐츠 -->
	<div class="content">
		{#if activeTab === 'recorder'}
			<VoiceRecorder />
		{:else if activeTab === 'conversation'}
			<EnglishConversation />
		{/if}
	</div>
	
	<!-- 사용 안내 -->
	<div class="guide">
		<h2>📖 사용 방법</h2>
		
		<div class="feature-sections">
			<!-- 음성 녹음기 섹션 -->
			<div class="feature-section">
				<h3>🎙️ 음성 녹음기</h3>
				<ol>
					<li><strong>녹음 시작</strong>: "녹음 시작" 버튼을 눌러 음성 녹음을 시작합니다</li>
					<li><strong>마이크 권한</strong>: 브라우저에서 마이크 사용 권한을 허용해주세요</li>
					<li><strong>녹음 중지</strong>: 말씀이 끝나면 "녹음 중지" 버튼을 누릅니다</li>
					<li><strong>재생 확인</strong>: "재생" 버튼으로 녹음된 음성을 들어볼 수 있습니다</li>
					<li><strong>다시 녹음</strong>: "삭제" 버튼으로 새로운 녹음을 시작할 수 있습니다</li>
				</ol>
			</div>
			
			<!-- 영어회화 섹션 -->
			<div class="feature-section">
				<h3>🗣️ 영어회화 연습</h3>
				<ol>
					<li><strong>API 키 설정</strong>: .env 파일에 Gemini API 키를 설정해주세요</li>
					<li><strong>회화 시작</strong>: "Start Speaking" 버튼을 누르고 영어로 말씀하세요</li>
					<li><strong>실시간 변환</strong>: 음성이 자동으로 텍스트로 변환됩니다</li>
					<li><strong>AI 응답</strong>: Gemini AI가 영어로 응답하고 음성으로 출력합니다</li>
					<li><strong>연습 반복</strong>: 자연스러운 대화를 통해 영어 실력을 향상시킵니다</li>
				</ol>
			</div>
		</div>
		
		<div class="features">
			<h3>✨ 통합 기능</h3>
			<ul>
				<li><strong>실시간 파형 시각화</strong>: 음성 파형을 실시간으로 표시</li>
				<li><strong>음성-텍스트 변환</strong>: Web Speech API를 사용한 음성 인식</li>
				<li><strong>AI 영어 튜터</strong>: Gemini API를 활용한 지능형 대화 시스템</li>
				<li><strong>텍스트-음성 변환</strong>: AI 응답을 자연스러운 음성으로 출력</li>
				<li><strong>탭 인터페이스</strong>: 녹음기와 회화 연습을 쉽게 전환</li>
				<li><strong>전문적인 디자인</strong>: 오디오 스튜디오 스타일의 어두운 테마</li>
			</ul>
		</div>
		
		<div class="tips">
			<h3>💡 사용 팁</h3>
			<ul>
				<li><strong>환경 설정</strong>: 조용한 환경에서 녹음하면 더 좋은 음질을 얻을 수 있습니다</li>
				<li><strong>마이크 거리</strong>: 마이크와 10-20cm 거리를 유지하세요</li>
				<li><strong>영어회화</strong>: 천천히 그리고 명확하게 발음하면 인식률이 높아집니다</li>
				<li><strong>API 설정</strong>: Gemini API 키는 Google AI Studio에서 무료로 발급받을 수 있습니다</li>
				<li><strong>브라우저 호환</strong>: 최신 브라우저(Chrome, Firefox, Safari)에서 가장 잘 작동합니다</li>
			</ul>
		</div>
		
		<div class="setup">
			<h3>⚙️ 초기 설정</h3>
			<ol>
				<li><strong>Gemini API 키 발급</strong>: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #667eea;">Google AI Studio</a> 방문</li>
				<li><strong>환경변수 설정</strong>: .env.example을 .env로 복사하고 API 키 입력</li>
				<li><strong>서버 재시작</strong>: 개발 서버를 재시작하여 변경사항 적용</li>
				<li><strong>권한 허용</strong>: 브라우저에서 마이크 권한 허용</li>
			</ol>
		</div>
	</div>
</main>

<style>
	/* 메인 컨테이너 스타일 - 전문적인 녹음기 스튜디오 테마 */
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #0a0a0a;
		min-height: 100vh;
	}

	/* 헤더 섹션 - 전문적인 녹음기 스튜디오 테마 */
	.header {
		text-align: center;
		margin-bottom: 3rem;
		color: #ffffff;
	}

	.header h1 {
		font-size: 3rem;
		margin-bottom: 0.5rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.header p {
		font-size: 1.2rem;
		margin: 0;
		opacity: 0.9;
	}

	/* 탭 네비게이션 */
	.tab-navigation {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		justify-content: center;
	}

	.tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		border: none;
		border-radius: 12px 12px 0 0;
		background: #2a2a2a;
		color: #cccccc;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		border: 1px solid #444;
		border-bottom: none;
	}

	.tab-btn:hover {
		background: #333;
		color: #ffffff;
	}

	.tab-btn.active {
		background: #1a1a1a;
		color: #ffffff;
		border-color: #667eea;
		position: relative;
	}

	.tab-btn.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background: #667eea;
	}

	/* 콘텐츠 영역 */
	.content {
		margin-bottom: 3rem;
		background: #1a1a1a;
		border-radius: 0 16px 16px 16px;
		padding: 2rem;
		border: 1px solid #667eea;
		border-top: none;
	}

	/* 사용 안내 섹션 - 전문적인 녹음기 스튜디오 테마 */
	.guide {
		background: #1a1a1a;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
		border: 1px solid #333;
	}

	.guide h2 {
		color: #ffffff;
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
		border-bottom: 2px solid #444;
		padding-bottom: 0.5rem;
	}

	.guide ol {
		margin: 0 0 2rem 0;
		padding-left: 1.5rem;
	}

	.guide li {
		margin-bottom: 0.75rem;
		color: #cccccc;
		line-height: 1.6;
	}

	.guide li strong {
		color: #ffffff;
	}

	/* 기능 안내 - 전문적인 녹음기 스튜디오 테마 */
	.features {
		background: #2a2a2a;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		border: 1px solid #444;
	}

	.features h3 {
		color: #00a86b;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.features ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.features li {
		margin-bottom: 0.5rem;
		color: #cccccc;
		line-height: 1.5;
	}

	/* 기능 섹션들 */
	.feature-sections {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.feature-section {
		background: #2a2a2a;
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid #444;
	}

	.feature-section h3 {
		color: #667eea;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.feature-section ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	.feature-section li {
		margin-bottom: 0.5rem;
		color: #cccccc;
		line-height: 1.5;
	}

	.feature-section li strong {
		color: #ffffff;
	}

	/* 사용 팁 - 전문적인 녹음기 스튜디오 테마 */
	.tips {
		background: #2a2a2a;
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid #444;
	}

	.tips h3 {
		color: #ff9800;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.tips ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.tips li {
		margin-bottom: 0.5rem;
		color: #cccccc;
		line-height: 1.5;
	}

	.tips li strong {
		color: #ffffff;
	}

	/* 초기 설정 섹션 */
	.setup {
		background: #2a2a2a;
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid #444;
	}

	.setup h3 {
		color: #00a86b;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.setup ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	.setup li {
		margin-bottom: 0.5rem;
		color: #cccccc;
		line-height: 1.5;
	}

	.setup li strong {
		color: #ffffff;
	}

	/* 모바일 반응형 디자인 */
	@media (max-width: 768px) {
		main {
			padding: 1rem;
		}
		
		.header h1 {
			font-size: 2rem;
		}
		
		.header p {
			font-size: 1rem;
		}
		
		.tab-navigation {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.tab-btn {
			border-radius: 8px;
			border: 1px solid #444;
		}
		
		.tab-btn.active::after {
			display: none;
		}
		
		.content {
			padding: 1rem;
			border-radius: 16px;
			border: 1px solid #667eea;
		}
		
		.feature-sections {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		
		.guide {
			padding: 1.5rem;
		}
		
		.features,
		.tips,
		.setup,
		.feature-section {
			padding: 1rem;
		}
	}
</style>
