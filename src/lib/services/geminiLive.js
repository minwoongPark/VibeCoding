
/**
 * Gemini Multimodal Live API Client (WebSocket)
 * Optimized for real-time voice and text interaction with enhanced logging.
 */
export class GeminiLiveClient {
    constructor(apiKey, model = 'gemini-2.0-flash') {
        this.apiKey = apiKey;
        this.model = model;
        this.ws = null;
        this.onMessage = null;
        this.onClose = null;
        this.onError = null;
        this.onConnected = null;
    }

    connect() {
        if (!this.apiKey) {
            const error = '❌ [GeminiLive] API Key is missing.';
            console.error(error);
            if (this.onError) this.onError(error);
            return;
        }

        const trimmedKey = this.apiKey.trim();
        
        // Using v1beta as it often provides better error messages for WebSocket failures
        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService/BidiGenerateContent?key=${trimmedKey}`;
        
        console.log(`📡 [GeminiLive] Handshake starting (Model: ${this.model})...`);
        console.log(`📡 Endpoint: v1beta`);
        
        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = (event) => {
                console.log('✅ [GeminiLive] Handshake SUCCESS. Connection state: OPEN');
                this.sendSetup();
                if (this.onConnected) this.onConnected();
            };

            this.ws.onmessage = async (event) => {
                try {
                    let data;
                    if (event.data instanceof Blob) {
                        data = JSON.parse(await event.data.text());
                    } else if (typeof event.data === 'string') {
                        data = JSON.parse(event.data);
                    }
                    
                    if (data.error) {
                        console.error('❌ [GeminiLive] API Error:', data.error.message);
                        if (this.onError) this.onError(data.error.message);
                    } else {
                        console.log('📥 [GeminiLive] Data received');
                        if (this.onMessage) this.onMessage(data);
                    }
                } catch (e) {
                    console.error('❌ [GeminiLive] Parse Error:', e);
                }
            };

            this.ws.onclose = (event) => {
                console.warn(`🔌 [GeminiLive] Connection CLOSED.`);
                console.warn(`🔹 Code: ${event.code}`);
                console.warn(`🔹 Reason: ${event.reason || 'No reason provided'}`);
                
                if (event.code === 1006) {
                    console.error('❌ [GeminiLive] 1006: Handshake rejected by server.');
                    console.error('👉 Possible causes:');
                    console.error('1. API Key restricted or not allowed for WebSockets.');
                    console.error('2. Network firewall/proxy blocking WSS connection.');
                    console.error('3. Temporary server-side issue at Google.');
                }
                
                if (this.onClose) this.onClose(event);
            };

            this.ws.onerror = (error) => {
                console.error('❌ [GeminiLive] WebSocket Error.');
            };
        } catch (e) {
            console.error('❌ [GeminiLive] Exception during WebSocket creation:', e);
            if (this.onError) this.onError(e.message);
        }
    }

    sendSetup() {
        const setupMsg = {
            setup: {
                model: `models/${this.model}`,
                generation_config: {
                    response_modalities: ["AUDIO", "TEXT"]
                }
            }
        };
        console.log('📤 [GeminiLive] Sending Setup:', setupMsg);
        this.send(setupMsg);
    }

    send(payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        } else {
            const state = this.ws ? this.ws.readyState : 'null';
            console.error(`❌ [GeminiLive] Cannot send. WebSocket state: ${state}`);
        }
    }

    sendAudioChunk(base64Data) {
        this.send({
            realtime_input: {
                media_chunks: [
                    {
                        mime_type: "audio/pcm;rate=16000",
                        data: base64Data
                    }
                ]
            }
        });
    }

    sendText(text) {
        const textMsg = {
            client_content: {
                turns: [
                    {
                        role: "user",
                        parts: [{ text }]
                    }
                ],
                turn_complete: true
            }
        };
        console.log('📤 [GeminiLive] Sending Text:', text);
        this.send(textMsg);
    }

    disconnect() {
        if (this.ws) {
            console.log('🔌 [GeminiLive] Manually disconnecting...');
            this.ws.close();
            this.ws = null;
        }
    }
}

/**
 * Audio Recorder for 16bit PCM 16kHz
 */
export class AudioRecorder {
    constructor(onAudioChunk) {
        this.onAudioChunk = onAudioChunk;
        this.audioContext = null;
        this.stream = null;
        this.processor = null;
    }

    async start() {
        try {
            console.log('🎤 [AudioRecorder] Requesting microphone access...');
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            const source = this.audioContext.createMediaStreamSource(this.stream);
            
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            
            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = this.floatTo16BitPCM(inputData);
                const base64 = this.arrayBufferToBase64(pcmData.buffer);
                this.onAudioChunk(base64);
            };
            console.log('✅ [AudioRecorder] Recording started');
        } catch (e) {
            console.error('❌ [AudioRecorder] Failed to start:', e);
            throw e;
        }
    }

    stop() {
        if (this.processor) this.processor.disconnect();
        if (this.audioContext) this.audioContext.close();
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
        console.log('🔇 [AudioRecorder] Recording stopped');
    }

    floatTo16BitPCM(input) {
        const buffer = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return buffer;
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}

/**
 * Audio Player for PCM 16bit 24kHz
 */
export class AudioPlayer {
    constructor() {
        this.audioContext = null;
        this.nextStartTime = 0;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        }
    }

    playChunk(base64Data) {
        try {
            this.init();
            const binary = atob(base64Data);
            const buffer = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                buffer[i] = binary.charCodeAt(i);
            }
            
            const pcm16 = new Int16Array(buffer.buffer);
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768;
            }

            const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
            audioBuffer.getChannelData(0).set(float32);

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            const currentTime = this.audioContext.currentTime;
            if (this.nextStartTime < currentTime) {
                this.nextStartTime = currentTime;
            }
            
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
        } catch (e) {
            console.error('❌ [AudioPlayer] Playback error:', e);
        }
    }

    stop() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
            this.nextStartTime = 0;
        }
    }
}
