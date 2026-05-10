// Gemini API 연동을 위한 서버 엔드포인트
import { GoogleGenerativeAI } from '@google/generative-ai';

// 환경변수에서 API 키 가져오기
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB82VaDvPIcwCszSpJw14Lao7RyMSczI5Y';

// Gemini API 클라이언트 초기화
let genAI = null;
if (GEMINI_API_KEY) {
	genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// 영어회화 튜터 시스템 프롬프트
const ENGLISH_TUTOR_PROMPT = `
당신은 친절하고 전문적인 영어회화 튜터입니다. 다음 지침을 따르세요:

1. **역할**: 영어회화 튜터로서 사용자의 영어 실력 향상을 도와주세요
2. **언어**: 항상 영어로 대화하세요 (한국어 사용은 최소화)
3. **레벨 조절**: 사용자의 영어 레벨에 맞춰 적절한 어휘와 문장을 사용하세요
4. **교정**: 사용자의 문법적 오류나 자연스럽지 않은 표현이 있으면 부드럽게 교정해주세요
5. **피드백**: 대화 후 간단한 피드백과 개선 제안을 제공하세요
6. **주제**: 일상생활, 여행, 취미, 직장 등 다양한 주제로 대화를 이끌어가세요

대화 형식:
- 사용자의 말을 경청하고 공감해주세요
- 질문을 통해 대화를 계속 이어가세요
- 때로는 새로운 표현이나 어휘를 가르쳐주세요
- 긍정적이고 격려하는 태도를 유지하세요

항상 친절하고 인내심을 갖고 대화에 임해주세요!
`;

// POST 요청 처리
export async function POST({ request }) {
	try {
		// API 키 확인
		if (!GEMINI_API_KEY || !genAI) {
			return new Response(
				JSON.stringify({ 
					error: 'Gemini API key가 설정되지 않았습니다. 서버 관리자에게 문의하세요.' 
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// 요청 바디 파싱
		const { message, conversationHistory = [] } = await request.json();

		// 메시지 유효성 검사
		if (!message || typeof message !== 'string') {
			return new Response(
				JSON.stringify({ 
					error: '메시지가 유효하지 않습니다.' 
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// Gemini 모델 초기화
		const model = genAI.getGenerativeModel({ 
			model: 'gemini-1.5-flash',
			systemInstruction: ENGLISH_TUTOR_PROMPT
		});

		// 대화 기록 구성
		const chatHistory = conversationHistory.map(msg => ({
			role: msg.role === 'user' ? 'user' : 'model',
			parts: [{ text: msg.content }]
		}));

		// 채팅 세션 시작
		const chat = model.startChat({ history: chatHistory });

		// 메시지 전송 및 응답 받기
		const result = await chat.sendMessage(message);
		const response = await result.response;
		const text = response.text();

		// 응답 반환
		return new Response(
			JSON.stringify({ 
				response: text,
				success: true
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		);

	} catch (error) {
		console.error('Gemini API 오류:', error);
		
		// 오류 응답
		return new Response(
			JSON.stringify({ 
				error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
				details: error.message
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}

// GET 요청 처리 (API 상태 확인)
export async function GET() {
	return new Response(
		JSON.stringify({ 
			status: 'Gemini API 엔드포인트가 활성화되었습니다.',
			configured: !!GEMINI_API_KEY
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		}
	);
}
