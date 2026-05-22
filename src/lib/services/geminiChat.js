
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Chat history state
let chatSession = null;

/**
 * Initialize a new chat session with a specific system instruction.
 */
export async function startNewChat(modelName = 'gemini-2.5-flash', customInstruction = null) {
    const defaultInstruction = "You are a friendly and helpful English conversation partner. Your goal is to help the user practice English. Speak naturally, correct their mistakes kindly, and keep the conversation engaging. Use simple to intermediate English unless the user's level is higher.";
    
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: customInstruction || defaultInstruction
    });

    chatSession = model.startChat({
        history: [],
        generationConfig: {
            maxOutputTokens: 1000,
        },
    });

    return chatSession;
}

/**
 * Send a message to the existing chat session and return text and usage metadata.
 */
export async function sendMessage(text) {
    if (!chatSession) {
        await startNewChat();
    }

    try {
        const result = await chatSession.sendMessage(text);
        const response = await result.response;
        return {
            text: response.text(),
            usage: response.usageMetadata
        };
    } catch (error) {
        console.error('❌ [GeminiChat] Error sending message:', error);
        throw error;
    }
}
