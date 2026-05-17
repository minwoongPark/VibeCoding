<!-- src/lib/components/EnglishConversation.svelte -->
<script>
	import { onDestroy, onMount } from 'svelte';
	
	// Svelte 5 반응형 변수들
	let isRecording = $state(false);			// 녹음 상태
	let isProcessing = $state(false);			// 음성 처리 중
	let isSpeaking = $state(false);			// AI 음성 출력 중
	let conversationHistory = $state([]);		// 대화 기록
	let currentTranscript = $state('');		// 현재 음성 인식 결과
	
	// 오디오 관련 변수들
	let mediaRecorder = null;					// MediaRecorder 인스턴스
	let audioChunks = [];						// 오디오 데이터 조각들
	let audioContext = null;					// Web Audio API 컨텍스트
	let analyser = null;						// 오디오 분석기
	let microphone = null;						// 마이크 입력
	let animationId = null;						// 애니메이션 프레임 ID
	let canvas = null;							// Canvas 요소
	let canvasContext = null;					// Canvas 컨텍스트
	
	// 컴포넌트 마운트 시 초기화
	onMount(() => {
		// Canvas 초기화
		canvas = document.querySelector('.conversation-waveform');
		if (canvas) {
			canvasContext = canvas.getContext('2d');
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		}
		
		// 초기 대화 메시지 추가
		conversationHistory = [{
			role: 'assistant',
			content: 'Hello! I\'m your English conversation tutor. Let\'s practice speaking English together! How are you today?',
			timestamp: new Date()
		}];
	});
	
	// 컴포넌트 파괴 시 정리 작업
	onDestroy(() => {
		stopRecording();
		stopSpeaking();
		if (animationId) {
			cancelAnimationFrame(animationId);
		}
		if (audioContext) {
			audioContext.close();
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
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
			analyser = audioContext.createAnalyser();
			microphone = audioContext.createMediaStreamSource(stream);

			analyser.fftSize = 2048;
			microphone.connect(analyser);

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
	
	// 음성-텍스트 변환 (Web Speech API)
	function startSpeechRecognition() {
		if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
			alert('음성 인식을 지원하지 않는 브라우저입니다.');
			return;
		}
		
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		const recognition = new SpeechRecognition();
		
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = 'en-US'; // 영어 인식
		
		recognition.onresult = (event) => {
			let transcript = '';
			for (let i = event.resultIndex; i < event.results.length; i++) {
				transcript += event.results[i][0].transcript;
			}
			currentTranscript = transcript;
		};
		
		recognition.onerror = (event) => {
			console.error('음성 인식 오류:', event.error);
			if (event.error === 'no-speech') {
				// 음성이 없는 경우는 무시
			} else {
				alert('음성 인식 중 오류가 발생했습니다: ' + event.error);
			}
		};
		
		recognition.onend = () => {
			if (isRecording) {
				// 녹음 중이면 다시 시작
				recognition.start();
			}
		};
		
		recognition.start();
		return recognition;
	}
	
	// 텍스트-음성 변환 (Web Speech API)
	function speakText(text) {
		if (!('speechSynthesis' in window)) {
			console.error('음성 합성을 지원하지 않는 브라우저입니다.');
			return;
		}
		
		// 이전 음성 정지
		stopSpeaking();
		
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'en-US';
		utterance.rate = 0.9;
		utterance.pitch = 1;
		
		utterance.onstart = () => {
			isSpeaking = true;
		};
		
		utterance.onend = () => {
			isSpeaking = false;
		};
		
		utterance.onerror = (event) => {
			console.error('음성 합성 오류:', event.error);
			isSpeaking = false;
		};
		
		speechSynthesis.speak(utterance);
	}
	
	// 음성 정지 함수
	function stopSpeaking() {
		if ('speechSynthesis' in window) {
			speechSynthesis.cancel();
			isSpeaking = false;
		}
	}
	
	// Gemini API 호출 함수
	async function callGeminiAPI(message) {
		try {
			const response = await fetch('/api/gemini', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: message,
					conversationHistory: conversationHistory
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'API 호출 실패');
			}
			
			const data = await response.json();
			return data.response;
		} catch (error) {
			console.error('Gemini API 오류:', error);
			throw error;
		}
	}
	
	// 녹음 시작 함수
	async function startRecording() {
		try {
			// 마이크 접근 권한 요청
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			
			// 파형 시각화 시작
			startWaveformVisualization(stream);
			
			// MediaRecorder 설정
			mediaRecorder = new MediaRecorder(stream);
			audioChunks = [];
			
			mediaRecorder.ondataavailable = (event) => {
				audioChunks.push(event.data);
			};
			
			mediaRecorder.onstop = async () => {
				// 오디오 파일이 필요한 경우 여기서 처리
				// const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
				
				// 스트림 정리
				stream.getTracks().forEach(track => track.stop());
			};
			
			// 음성 인식 시작
			startSpeechRecognition();
			
			// 녹음 시작
			mediaRecorder.start();
			isRecording = true;
			currentTranscript = '';
			
		} catch (error) {
			console.error('녹음 시작 오류:', error);
			alert('마이크 접근 권한이 필요합니다.');
		}
	}
	
	// 녹음 중지 및 메시지 전송
	async function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
		
		stopWaveformVisualization();
		isRecording = false;
		
		// 음성 인식 결과 처리
		if (currentTranscript.trim()) {
			await sendMessage(currentTranscript.trim());
		}
		
		currentTranscript = '';
	}
	
	// 메시지 전송 함수
	async function sendMessage(message) {
		if (!message.trim()) return;
		
		// 사용자 메시지 추가
		conversationHistory = [
			...conversationHistory,
			{
				role: 'user',
				content: message,
				timestamp: new Date()
			}
		];
		
		isProcessing = true;
		
		try {
			// Gemini API 호출
			const response = await callGeminiAPI(message);
			
			// AI 응답 추가
			conversationHistory = [
				...conversationHistory,
				{
					role: 'assistant',
					content: response,
					timestamp: new Date()
				}
			];
			
			// 음성으로 응답 출력
			speakText(response);
			
		} catch (error) {
			console.error('메시지 전송 오류:', error);
			
			// 오류 응답 추가
			conversationHistory = [
				...conversationHistory,
				{
					role: 'assistant',
					content: 'Sorry, an error occurred. Please try again.',
					timestamp: new Date()
				}
			];
		} finally {
			isProcessing = false;
		}
	}
	
	// 대화 초기화 함수
	function resetConversation() {
		conversationHistory = [{
			role: 'assistant',
			content: 'Hello! Let\'s start our English conversation again. How are you today?',
			timestamp: new Date()
		}];
		currentTranscript = '';
		stopSpeaking();
	}
	
	// 시간 포맷 함수
	function formatTime(date) {
		return date.toLocaleTimeString('en-US', { 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	}
</script>

<div class="english-conversation">
	<h2 class="text-2xl font-bold text-center mb-6 text-white">🗣️ English Conversation Practice</h2>
	
	<!-- 대화 기록 영역 -->
	<div class="chat-container">
		<div class="messages">
			{#each conversationHistory as message, index}
				<div class="message" class:user={message.role === 'user'} class:assistant={message.role === 'assistant'} key={index}>
					<div class="message-avatar">
						{#if message.role === 'user'}
							👤
						{:else}
							🤖
						{/if}
					</div>
					<div class="message-content">
						<div class="message-text">{message.content}</div>
						<div class="message-time">{formatTime(message.timestamp)}</div>
					</div>
				</div>
			{/each}
			
			<!-- 현재 음성 인식 결과 -->
			{#if currentTranscript}
				<div class="message user current">
					<div class="message-avatar">👤</div>
					<div class="message-content">
						<div class="message-text">{currentTranscript}</div>
						<div class="message-time">Speaking...</div>
					</div>
				</div>
			{/if}
			
			<!-- AI 응답 처리 중 -->
			{#if isProcessing}
				<div class="message assistant processing">
					<div class="message-avatar">🤖</div>
					<div class="message-content">
						<div class="typing-indicator">
							<span></span>
							<span></span>
							<span></span>
						</div>
						<div class="message-time">Thinking...</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- 파형 시각화 -->
	<div class="waveform-section">
		{#if isRecording}
			<div class="conversation-waveform"></div>
		{:else}
			<div class="waveform-placeholder">
				<p>🎤 Click to start speaking</p>
			</div>
		{/if}
	</div>
	
	<!-- 제어 버튼 -->
	<div class="controls">
		<button 
			class="record-btn"
			class:recording={isRecording}
			class:processing={isProcessing}
			onclick={isRecording ? stopRecording : startRecording}
			disabled={isProcessing}
		>
			{#if isRecording}
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
					<rect x="6" y="6" width="12" height="12" />
				</svg>
				<span>Stop Recording</span>
			{:else if isProcessing}
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
					<circle cx="12" cy="12" r="10" opacity="0.3"/>
				</svg>
				<span>Processing...</span>
			{:else}
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
					<circle cx="12" cy="12" r="8" />
				</svg>
				<span>Start Speaking</span>
			{/if}
		</button>
		
		<button 
			class="reset-btn"
			onclick={resetConversation}
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
				<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
			</svg>
			<span>New Conversation</span>
		</button>
		
		{#if isSpeaking}
			<button 
				class="stop-speech-btn"
				onclick={stopSpeaking}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<rect x="6" y="4" width="4" height="16" />
					<rect x="14" y="4" width="4" height="16" />
				</svg>
				<span>Stop Speaking</span>
			</button>
		{/if}
	</div>
	
	<!-- 안내 메시지 -->
	<div class="guide">
		<h3>💡 How to Use</h3>
		<ul>
			<li><strong>Start Speaking</strong>: Click the button and speak in English</li>
			<li><strong>AI Response</strong>: Listen to the tutor's response and suggestions</li>
			<li><strong>Practice</strong>: Continue the conversation naturally</li>
			<li><strong>New Topic</strong>: Click "New Conversation" to start fresh</li>
		</ul>
	</div>
</div>

<style>
	.english-conversation {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		background: #1a1a1a;
		border-radius: 16px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
		border: 1px solid #333;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	/* 채팅 컨테이너 */
	.chat-container {
		background: #2a2a2a;
		border-radius: 12px;
		padding: 1.5rem;
		height: 400px;
		overflow-y: auto;
		margin-bottom: 2rem;
		border: 1px solid #444;
	}
	
	.messages {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	/* 메시지 스타일 */
	.message {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		animation: fadeIn 0.3s ease-in;
	}
	
	.message.user {
		flex-direction: row-reverse;
	}
	
	.message.user .message-content {
		background: #00a86b;
		color: white;
	}
	
	.message.assistant .message-content {
		background: #444;
		color: white;
	}
	
	.message.current {
		opacity: 0.8;
	}
	
	.message.processing {
		opacity: 0.7;
	}
	
	.message-avatar {
		font-size: 1.5rem;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #333;
		border-radius: 50%;
	}
	
	.message-content {
		max-width: 70%;
		padding: 1rem;
		border-radius: 12px;
	}
	
	.message-text {
		line-height: 1.5;
		margin-bottom: 0.5rem;
	}
	
	.message-time {
		font-size: 0.8rem;
		opacity: 0.7;
	}
	
	/* 타이핑 인디케이터 */
	.typing-indicator {
		display: flex;
		gap: 0.3rem;
		padding: 0.5rem 0;
	}
	
	.typing-indicator span {
		width: 8px;
		height: 8px;
		background: currentColor;
		border-radius: 50%;
		animation: typing 1.4s infinite;
	}
	
	.typing-indicator span:nth-child(2) {
		animation-delay: 0.2s;
	}
	
	.typing-indicator span:nth-child(3) {
		animation-delay: 0.4s;
	}
	
	@keyframes typing {
		0%, 60%, 100% {
			transform: translateY(0);
		}
		30% {
			transform: translateY(-10px);
		}
	}
	
	/* 파형 섹션 */
	.waveform-section {
		margin-bottom: 2rem;
	}
	
	.conversation-waveform {
		width: 100%;
		height: 100px;
		background: #000000;
		border: 2px solid #444;
		border-radius: 8px;
	}
	
	.waveform-placeholder {
		width: 100%;
		height: 100px;
		background: #2a2a2a;
		border: 2px solid #444;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		font-size: 1.1rem;
	}
	
	/* 제어 버튼 */
	.controls {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}
	
	.record-btn {
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
	
	.record-btn:hover:not(:disabled) {
		background: #008c5a;
		transform: translateY(-2px);
	}
	
	.record-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
	
	.record-btn.recording {
		background: #ff0000;
		border-color: #cc0000;
		animation: pulse 1.5s infinite;
	}
	
	.record-btn.processing {
		background: #ff9800;
		border-color: #cc7a00;
	}
	
	.reset-btn, .stop-speech-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border: none;
		border-radius: 12px;
		background: #444;
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		border: 1px solid #555;
	}
	
	.reset-btn:hover, .stop-speech-btn:hover {
		background: #555;
		transform: translateY(-2px);
	}
	
	.stop-speech-btn {
		background: #ff4444;
		border-color: #cc3333;
	}
	
	.stop-speech-btn:hover {
		background: #cc3333;
	}
	
	/* 안내 메시지 */
	.guide {
		background: #2a2a2a;
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid #444;
	}
	
	.guide h3 {
		color: #00a86b;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}
	
	.guide ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #cccccc;
	}
	
	.guide li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}
	
	.guide li strong {
		color: white;
	}
	
	/* 애니메이션 */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7);
		}
		70% {
			box-shadow: 0 0 0 15px rgba(255, 0, 0, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
		}
	}
	
	/* 모바일 반응형 */
	@media (max-width: 768px) {
		.english-conversation {
			margin: 1rem;
			padding: 1.5rem;
		}
		
		.chat-container {
			height: 300px;
		}
		
		.message-content {
			max-width: 85%;
		}
		
		.controls {
			flex-direction: column;
			align-items: stretch;
		}
		
		.record-btn, .reset-btn, .stop-speech-btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>
