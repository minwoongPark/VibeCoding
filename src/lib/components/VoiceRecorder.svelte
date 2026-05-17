<!-- src/lib/components/VoiceRecorder.svelte -->
<script>
	import { onDestroy, onMount } from 'svelte';
	
	// Svelte 5 반응형 변수들
	let isRecording = $state(false);		// 녹음 상태 (true: 녹음 중, false: 정지)
	let audioURL = $state('');			// 녹음된 오디오의 URL
	let mediaRecorder = null;			// MediaRecorder API 인스턴스
	let audioChunks = [];				// 녹음된 오디오 데이터 조각들
	let recordingTime = $state(0);		// 녹음 시간 (초)
	let recordingInterval = null;		// 타이머 ID
	let isPlaying = $state(false);		// 오디오 재생 상태
	let audioElement = null;			// HTML5 Audio 요소
	
	// 파형 시각화 관련 변수들
	let audioContext = null;			// Web Audio API 컨텍스트
	let analyser = null;				// 오디오 분석기
	let microphone = null;				// 마이크 입력
	let animationId = null;				// 애니메이션 프레임 ID
	let canvas = null;					// Canvas 요소
	let canvasContext = null;			// Canvas 컨텍스트

	// 컴포넌트 마운트 시 Canvas 초기화
	onMount(() => {
		// Canvas 요소와 컨텍스트 초기화
		canvas = document.querySelector('.waveform-canvas');
		if (canvas) {
			canvasContext = canvas.getContext('2d');
			// Canvas 크기 설정
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		}
	});

	// 컴포넌트가 파괴될 때 정리 작업
	onDestroy(() => {
		// 녹음 중이면 정지
		if (isRecording && mediaRecorder) {
			stopRecording();
		}
		// 타이머 정리
		if (recordingInterval) {
			clearInterval(recordingInterval);
		}
		// 파형 애니메이션 정리
		if (animationId) {
			cancelAnimationFrame(animationId);
		}
		// 오디오 컨텍스트 정리
		if (audioContext) {
			audioContext.close();
		}
		// 오디오 정리
		if (audioElement) {
			audioElement.pause();
			audioElement = null;
		}
		// URL 정리
		if (audioURL) {
			URL.revokeObjectURL(audioURL);
		}
	});

	// 파형 시각화 함수
	function drawWaveform() {
		if (!analyser || !canvasContext || !canvas) return;

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		analyser.getByteTimeDomainData(dataArray);

		// Canvas 초기화
		canvasContext.fillStyle = '#000000';
		canvasContext.fillRect(0, 0, canvas.width, canvas.height);

		// 파형 그리기
		canvasContext.lineWidth = 2;
		canvasContext.strokeStyle = '#00a86b';
		canvasContext.beginPath();

		const sliceWidth = canvas.width / bufferLength;
		let x = 0;

		for (let i = 0; i < bufferLength; i++) {
			const v = dataArray[i] / 128.0;
			const y = v * canvas.height / 2;

			if (i === 0) {
				canvasContext.moveTo(x, y);
			} else {
				canvasContext.lineTo(x, y);
			}

			x += sliceWidth;
		}

		canvasContext.lineTo(canvas.width, canvas.height / 2);
		canvasContext.stroke();

		// 다음 프레임 요청
		animationId = requestAnimationFrame(drawWaveform);
	}

	// 파형 시각화 시작 함수
	function startWaveformVisualization(stream) {
		try {
			// Web Audio API 컨텍스트 생성
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
			analyser = audioContext.createAnalyser();
			microphone = audioContext.createMediaStreamSource(stream);

			// 분석기 설정
			analyser.fftSize = 2048;
			microphone.connect(analyser);

			// 파형 그리기 시작
			drawWaveform();
		} catch (error) {
			console.error('파형 시각화 오류:', error);
		}
	}

	// 파형 시각화 중지 함수
	function stopWaveformVisualization() {
		if (animationId) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}
		if (microphone) {
			microphone.disconnect();
			microphone = null;
		}
		if (analyser) {
			analyser.disconnect();
			analyser = null;
		}
		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}
	}

	// 녹음 시작 함수
	async function startRecording() {
		try {
			// 마이크 접근 권한 요청
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			
			// 파형 시각화 시작
			startWaveformVisualization(stream);
			
			// MediaRecorder 인스턴스 생성
			mediaRecorder = new MediaRecorder(stream);
			audioChunks = [];
			
			// 데이터 수집 이벤트 핸들러
			mediaRecorder.ondataavailable = (event) => {
				// 녹음된 오디오 데이터 조각을 배열에 추가
				audioChunks.push(event.data);
			};
			
			// 녹음 종료 이벤트 핸들러
			mediaRecorder.onstop = () => {
				// 모든 오디오 데이터 조각을 하나의 Blob으로 합치기
				const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
				
				// Blob을 URL로 변환 (브라우저 메모리에 임시 저장)
				audioURL = URL.createObjectURL(audioBlob);
				
				// 이전 오디오 요소 정리
				if (audioElement) {
					audioElement.pause();
					audioElement = null;
				}
				
				// 모든 미디어 스트림 트랙(마이크) 정지
				stream.getTracks().forEach(track => track.stop());
			};
			
			// 녹음 시작
			mediaRecorder.start();
			isRecording = true;
			recordingTime = 0;
			
			// 녹음 시간 타이머 시작 (1초마다 시간 증가)
			recordingInterval = setInterval(() => {
				recordingTime++;
			}, 1000);
			
		} catch (error) {
			console.error('마이크 접근 오류:', error);
			alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
		}
	}

	// 녹음 중지 함수
	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			// MediaRecorder 중지
			mediaRecorder.stop();
			isRecording = false;
			
			// 파형 시각화 중지
			stopWaveformVisualization();
			
			// 타이머 정지
			if (recordingInterval) {
				clearInterval(recordingInterval);
				recordingInterval = null;
			}
		}
	}

	// 오디오 재생/일시정지 함수
	function togglePlayback() {
		if (!audioElement && audioURL) {
			// 오디오 요소가 없으면 새로 생성
			audioElement = new Audio(audioURL);
			
			// 재생이 끝났을 때의 이벤트 핸들러
			audioElement.addEventListener('ended', () => {
				isPlaying = false;
			});
		}
		
		if (audioElement) {
			if (isPlaying) {
				// 재생 중이면 일시정지
				audioElement.pause();
				isPlaying = false;
			} else {
				// 정지 상태이면 재생
				audioElement.play();
				isPlaying = true;
			}
		}
	}

	// 녹음된 오디오 삭제 함수
	function deleteRecording() {
		// 오디오 URL 정리 (메모리 해제)
		if (audioURL) {
			URL.revokeObjectURL(audioURL);
		}
		
		// 오디오 요소 정지 및 초기화
		if (audioElement) {
			audioElement.pause();
			audioElement = null;
		}
		
		// 변수들 초기화
		audioURL = '';
		isPlaying = false;
		recordingTime = 0;
	}

	// 시간을 MM:SS 형식으로 변환하는 함수
	function formatTime(seconds) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		// padStart는 문자열의 길이가 특정 길이가 될 때까지 앞에 문자를 채워넣는 함수
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
</script>

<div class="voice-recorder">
	<h2 class="text-2xl font-bold text-center mb-8 text-gray-800">🎙️ 음성 녹음기</h2>
	
	<div class="recording-container">
		{#if !audioURL}
			<!-- 녹음 전 상태 -->
			<div class="recording-section">
				<!-- 녹음 시간 표시 -->
				<div class="timer-display">
					{formatTime(recordingTime)}
				</div>
				
				<!-- 파형 시각화 윈도우 -->
				<div class="waveform-display">
					<canvas class="waveform-canvas"></canvas>
				</div>
				
				<!-- 녹음 버튼 -->
				<button 
					class="record-btn"
					class:recording={isRecording}
					onclick={isRecording ? stopRecording : startRecording}
				>
					{#if isRecording}
						<!-- 녹음 중일 때 정지 아이콘 -->
						<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
							<rect x="6" y="6" width="12" height="12" />
						</svg>
						<span>녹음 중지</span>
					{:else}
						<!-- 녹음 대기 중일 때 녹음 아이콘 -->
						<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
							<circle cx="12" cy="12" r="8" />
						</svg>
						<span>녹음 시작</span>
					{/if}
				</button>
				
				<!-- 상태 메시지 -->
				<p class="status-message">
					{isRecording ? '🔴 녹음 중입니다...' : '🎤 녹음을 시작하려면 버튼을 누르세요'}
				</p>
			</div>
		{:else}
			<!-- 녹음 완료 상태 -->
			<div class="playback-section">
				<!-- 완료 메시지 -->
				<div class="completion-message">
					<h3>✅ 녹음 완료!</h3>
					<p>녹음 시간: {formatTime(recordingTime)}</p>
				</div>
				
				<!-- 재생 컨트롤 -->
				<div class="playback-controls">
					<!-- 재생/일시정지 버튼 -->
					<button 
						class="play-btn"
						onclick={togglePlayback}
					>
						{#if isPlaying}
							<!-- 일시정지 아이콘 -->
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
								<rect x="6" y="4" width="4" height="16" />
								<rect x="14" y="4" width="4" height="16" />
							</svg>
							<span>일시정지</span>
						{:else}
							<!-- 재생 아이콘 -->
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
								<path d="M8 5v14l11-7z" />
							</svg>
							<span>재생</span>
						{/if}
					</button>
					
					<!-- 삭제 버튼 -->
					<button 
						class="delete-btn"
						onclick={deleteRecording}
					>
						<!-- 삭제 아이콘 -->
						<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
							<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
						</svg>
						<span>삭제</span>
					</button>
				</div>
				
				<!-- HTML5 오디오 플레이어 -->
				<div class="audio-player-container">
					<audio 
						controls 
						src={audioURL} 
						class="audio-player"
					></audio>
				</div>
				
				<!-- 오디오 웨이브 시각화 (단순한 장식) -->
				<div class="waveform">
					<div class="wave-bar"></div>
					<div class="wave-bar"></div>
					<div class="wave-bar"></div>
					<div class="wave-bar"></div>
					<div class="wave-bar"></div>
					<div class="wave-bar"></div>
					<div class="wave-bar"></div>
					<div class="wave-bar"></div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* 메인 컨테이너 - 전문적인 녹음기 스타일 */
	.voice-recorder {
		max-width: 500px;
		margin: 0 auto;
		padding: 2rem;
		background: #1a1a1a;
		border-radius: 16px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		border: 1px solid #333;
	}

	.recording-container {
		text-align: center;
	}

	/* 타이머 표시 - 전문적인 녹음기 스타일 */
	.timer-display {
		font-size: 4rem;
		font-weight: bold;
		color: #ffffff;
		margin-bottom: 1.5rem;
		text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.1em;
		background: #2a2a2a;
		padding: 1rem;
		border-radius: 12px;
		border: 2px solid #444;
	}

	/* 파형 시각화 윈도우 - 전문적인 녹음기 스타일 */
	.waveform-display {
		width: 100%;
		height: 120px;
		background: #000000;
		border: 2px solid #444;
		border-radius: 8px;
		margin-bottom: 2rem;
		position: relative;
		overflow: hidden;
	}

	.waveform-canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	/* 녹음 버튼 - 전문적인 녹음기 스타일 */
	.record-btn {
		display: inline-flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 3rem;
		border: none;
		border-radius: 60px;
		font-size: 1.3rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s ease;
		background: #2a2a2a;
		color: #ffffff;
		margin-bottom: 1.5rem;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
		border: 2px solid #444;
	}

	.record-btn:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
	}

	/* 녹음 중 버튼 스타일 - 전문적인 레코딩 앱 스타일 */
	.record-btn.recording {
		background: #ff0000;
		color: #ffffff;
		border-color: #cc0000;
		animation: pulse 1.5s infinite;
		box-shadow: 0 8px 20px rgba(255, 0, 0, 0.4);
	}

	/* 녹음 중 펄스 애니메이션 - 전문적인 레코딩 앱 스타일 */
	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7);
		}
		70% {
			box-shadow: 0 0 0 20px rgba(255, 0, 0, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
		}
	}

	/* 상태 메시지 - 전문적인 녹음기 스타일 */
	.status-message {
		color: #cccccc;
		font-size: 1.1rem;
		margin: 0;
		font-weight: 500;
	}

	/* 재생 섹션 - 전문적인 녹음기 스타일 */
	.playback-section {
		color: #ffffff;
	}

	/* 완료 메시지 - 전문적인 녹음기 스타일 */
	.completion-message {
		background: #2a2a2a;
		border-radius: 15px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		border: 1px solid #444;
	}

	.completion-message h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
	}

	.completion-message p {
		margin: 0;
		font-size: 1.1rem;
		opacity: 0.9;
	}

	/* 재생 컨트롤 버튼들 */
	.playback-controls {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-bottom: 2rem;
	}

	/* 재생 버튼 - 전문적인 오디오 장비 스타일 */
	.play-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		border: none;
		border-radius: 12px;
		background: #00a86b;
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(0, 168, 107, 0.3);
		border: 1px solid #008c5a;
	}

	.play-btn:hover {
		background: #008c5a;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 168, 107, 0.4);
	}

	/* 삭제 버튼 - 전문적인 녹음기 스타일 */
	.delete-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		border: none;
		border-radius: 12px;
		background: #ff4444;
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
		border: 1px solid #cc3333;
	}

	.delete-btn:hover {
		background: #cc3333;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(255, 68, 68, 0.4);
	}

	/* 오디오 플레이어 컨테이너 - 전문적인 녹음기 스타일 */
	.audio-player-container {
		background: #2a2a2a;
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 2rem;
		border: 1px solid #444;
	}

	/* HTML5 오디오 플레이어 */
	.audio-player {
		width: 100%;
		border-radius: 8px;
	}

	/* 오디오 웨이브 시각화 - 전문적인 오디오 장비 스타일 */
	.waveform {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.3rem;
		height: 60px;
		padding: 1rem;
		background: #2a2a2a;
		border-radius: 12px;
		border: 1px solid #444;
	}

	.wave-bar {
		width: 4px;
		background: linear-gradient(to top, #00a86b, #00d4aa);
		border-radius: 2px;
		animation: wave 1.5s ease-in-out infinite;
	}

	.wave-bar:nth-child(1) { animation-delay: 0s; height: 20%; }
	.wave-bar:nth-child(2) { animation-delay: 0.1s; height: 40%; }
	.wave-bar:nth-child(3) { animation-delay: 0.2s; height: 60%; }
	.wave-bar:nth-child(4) { animation-delay: 0.3s; height: 80%; }
	.wave-bar:nth-child(5) { animation-delay: 0.4s; height: 100%; }
	.wave-bar:nth-child(6) { animation-delay: 0.5s; height: 80%; }
	.wave-bar:nth-child(7) { animation-delay: 0.6s; height: 60%; }
	.wave-bar:nth-child(8) { animation-delay: 0.7s; height: 40%; }

	@keyframes wave {
		0%, 100% {
			transform: scaleY(0.5);
			opacity: 0.5;
		}
		50% {
			transform: scaleY(1);
			opacity: 1;
		}
	}

	/* 모바일 반응형 디자인 */
	@media (max-width: 640px) {
		.voice-recorder {
			margin: 1rem;
			padding: 1.5rem;
		}
		
		.timer-display {
			font-size: 3rem;
		}
		
		.record-btn {
			padding: 1.2rem 2rem;
			font-size: 1.1rem;
		}
		
		.playback-controls {
			flex-direction: column;
			align-items: center;
		}
		
		.play-btn,
		.delete-btn {
			width: 100%;
			max-width: 200px;
		}
	}
</style>
