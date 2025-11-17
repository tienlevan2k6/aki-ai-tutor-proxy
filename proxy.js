// Import thư viện của Google
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lấy API key từ Environment Variable (sẽ cài ở Vercel)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// Hàm handler chính của Vercel
export default async function handler(req, res) {
  // --- Cấu hình CORS (Rất quan trọng) ---
  // Cho phép blog của bạn (hoặc tất cả) được gọi API này
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Trả về OK nếu là request OPTIONS (trình duyệt kiểm tra)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Chỉ cho phép request POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  // --- Hết cấu hình CORS ---

  try {
    const { type, payload } = req.body;
    let result;

    if (type === 'generate') {
      // Dành cho các lệnh generate (Flashcard, Grammar, Quiz...)
      const prompt = payload.prompt;
      const genResult = await model.generateContent(prompt);
      result = genResult.response.text();

    } else if (type === 'chat') {
      // Dành cho Roleplay Chat
      const { history, message } = payload;
      const chatSession = model.startChat({ history });
      const chatResult = await chatSession.sendMessage(message);
      result = chatResult.response.text();
      
      // Với chat, ta trả về text thô
      return res.status(200).json({ text_response: result });

    } else {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    // Cố gắng parse JSON từ text trả về (cho các hàm generate)
    try {
      let text = result.replace(/```json|```/g, '').trim();
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
      }
      const jsonResult = JSON.parse(text);
      return res.status(200).json(jsonResult);
    } catch (e) {
      // Nếu không phải JSON, trả về lỗi
      console.error("Failed to parse JSON from AI response:", result);
      return res.status(500).json({ error: 'AI response was not valid JSON.' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
