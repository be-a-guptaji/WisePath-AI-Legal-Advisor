import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL_NAME = "llama-3.3-70b-versatile"; // free, fast, high quality

const SYSTEM_PROMPT =
  "You are WisePath, an AI legal advisor. Provide general legal information clearly and concisely. Always include a disclaimer that your responses do not constitute formal legal advice and users should consult a licensed attorney for their specific situation.";

const callGroqWithRetry = async (messages, retries = 3, delayMs = 1000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: MODEL_NAME,
        messages,
      });
      return response.choices[0].message.content;
    } catch (error) {
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.toLowerCase().includes("rate limit");

      if (isRateLimit && attempt < retries - 1) {
        console.warn(
          `Rate limited. Retrying in ${delayMs * 2 ** attempt}ms...`
        );
        await new Promise((res) => setTimeout(res, delayMs * 2 ** attempt));
      } else {
        throw error;
      }
    }
  }
};

// ─── Text Message Controller ───────────────────────────────────────────────

export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.credits < 1) {
      return res.json({
        success: false,
        message: "You don't have enough credits to use this feature",
      });
    }

    const { chatId, prompt } = req.body;

    const chat = await Chat.findOne({ userId, _id: chatId });

    if (!chat) {
      return res.json({ success: false, message: "Chat not found" });
    }

    // Build conversation history — Groq uses OpenAI format natively
    const historyMessages = chat.messages
      .filter((m) => !m.isImage)
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...historyMessages,
      { role: "user", content: prompt },
    ];

    const replyText = await callGroqWithRetry(apiMessages);

    const userMessage = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
      isPublished: false,
    };

    const assistantReply = {
      role: "assistant",
      content: replyText,
      timestamp: Date.now(),
      isImage: false,
      isPublished: false,
    };

    chat.messages.push(userMessage);
    chat.messages.push(assistantReply);
    await chat.save();

    await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });
    const updatedUser = await User.findById(userId).select("credits");

    return res.json({
      success: true,
      reply: assistantReply,
      credits: updatedUser.credits,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ─── Image Generation Controller (disabled) ───────────────────────────────

export const imageMessageController = async (req, res) => {
  return res.json({
    success: false,
    message: "Image generation is currently disabled",
  });
};