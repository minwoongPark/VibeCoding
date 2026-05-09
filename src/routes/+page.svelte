<script>
	// 음성 녹음 컴포넌트를 import 합니다
	// $는 src/ 폴더를 가리키는 SvelteKit의 별칭입니다
	import VoiceRecorder from '$lib/components/VoiceRecorder.svelte';
</script>

<!-- 메인 페이지 콘텐츠 -->
<main>
	<!-- 페이지 제목 -->
	<div class="header">
		<h1>🎙️ 음성 녹음기</h1>
		<p>음성을 녹음하고 바로 들어볼 수 있는 간단한 인터페이스</p>
	</div>
	
	<!-- 음성 녹음 컴포넌트 -->
	<div class="content">
		<VoiceRecorder />
	</div>
	
	<!-- 사용 안내 -->
	<div class="guide">
		<h2>사용 방법</h2>
		<ol>
			<li><strong>녹음 시작</strong>: "녹음 시작" 버튼을 눌러 음성 녹음을 시작합니다</li>
			<li><strong>마이크 권한</strong>: 브라우저에서 마이크 사용 권한을 허용해주세요</li>
			<li><strong>녹음 중지</strong>: 말씀이 끝나면 "녹음 중지" 버튼을 누릅니다</li>
			<li><strong>재생 확인</strong>: "재생" 버튼으로 녹음된 음성을 들어볼 수 있습니다</li>
			<li><strong>다시 녹음</strong>: "삭제" 버튼으로 새로운 녹음을 시작할 수 있습니다</li>
		</ol>
		
		<div class="features">
			<h3>✨ 주요 기능</h3>
			<ul>
				<li><strong>실시간 녹음</strong>: 음성을 실시간으로 녹음하고 시간 표시</li>
				<li><strong>즉시 재생</strong>: 녹음된 음성을 바로 재생 가능</li>
				<li><strong>HTML5 플레이어</strong>: 기본 오디오 플레이어로 상세 제어</li>
				<li><strong>시각적 효과</strong>: 녹음 중 애니메이션과 오디오 웨이브 표시</li>
				<li><strong>반복 녹음</strong>: 여러 번 녹음하고 비교 가능</li>
			</ul>
		</div>
		
		<div class="tips">
			<h3>💡 사용 팁</h3>
			<ul>
				<li>조용한 환경에서 녹음하면 더 좋은 음질을 얻을 수 있습니다</li>
				<li>마이크와 적절한 거리(10-20cm)를 유지하세요</li>
				<li>녹음된 파일은 브라우저에 임시 저장되며, 새로고침 시 사라집니다</li>
				<li>최신 브라우저(Chrome, Firefox, Safari)에서 가장 잘 작동합니다</li>
			</ul>
		</div>
	</div>
</main>

<style>
	/* 메인 컨테이너 스타일 */
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
	}

	/* 헤더 섹션 */
	.header {
		text-align: center;
		margin-bottom: 3rem;
		color: white;
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

	/* 콘텐츠 영역 */
	.content {
		margin-bottom: 3rem;
	}

	/* 사용 안내 섹션 */
	.guide {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	}

	.guide h2 {
		color: #1f2937;
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
		border-bottom: 2px solid #e5e7eb;
		padding-bottom: 0.5rem;
	}

	.guide ol {
		margin: 0 0 2rem 0;
		padding-left: 1.5rem;
	}

	.guide li {
		margin-bottom: 0.75rem;
		color: #4b5563;
		line-height: 1.6;
	}

	.guide li strong {
		color: #1f2937;
	}

	/* 기능 안내 */
	.features {
		background: #f0fdf4;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		border: 1px solid #bbf7d0;
	}

	.features h3 {
		color: #166534;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.features ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.features li {
		margin-bottom: 0.5rem;
		color: #166534;
		line-height: 1.5;
	}

	/* 사용 팁 */
	.tips {
		background: #fef3c7;
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid #fde68a;
	}

	.tips h3 {
		color: #92400e;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.tips ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.tips li {
		margin-bottom: 0.5rem;
		color: #92400e;
		line-height: 1.5;
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
		
		.guide {
			padding: 1.5rem;
		}
		
		.features,
		.tips {
			padding: 1rem;
		}
	}
</style>
