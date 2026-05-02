// import axios from "axios";
// import Chat from "../models/Chat.js";
// import User from "../models/User.js";
// import imagekit from "../configs/imageKit.js";
// import openai from "../configs/openai.js";

// // Text-based AI Chat Message Controller
// export const textMessageController = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     // Check credits
//     if (req.user.credits < 1) {
//       return res.json({
//         success: false,
//         message: "You don't have enough credits to use this feature",
//       });
//     }

//     const { chatId, prompt } = req.body;

//     const chat = await Chat.findOne({ userId, _id: chatId });
//     chat.messages.push({
//       role: "user",
//       content: prompt,
//       timestamp: Date.now(),
//       isImage: false,
//     });

//     const { choices } = await openai.chat.completions.create({
//       model: "gemini-2.0-flash",
//       messages: [
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//     });

//     const reply = {
//       ...choices[0].message,
//       timestamp: Date.now(),
//       isImage: false,
//     };
//     res.json({ success: true, reply });

//     chat.messages.push(reply);
//     await chat.save();
//     await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };

// // Image Generation Message Controller
// export const imageMessageController = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     // Check credits
//     if (req.user.credits < 2) {
//       return res.json({
//         success: false,
//         message: "You don't have enough credits to use this feature",
//       });
//     }
//     const { prompt, chatId, isPublished } = req.body;
//     // Find chat
//     const chat = await Chat.findOne({ userId, _id: chatId });

//     // Push user message
//     chat.messages.push({
//       role: "user",
//       content: prompt,
//       timestamp: Date.now(),
//       isImage: false,
//     });

//     // Encode the prompt
//     const encodedPrompt = encodeURIComponent(prompt);

//     // Construct ImageKit AI generation URL
//     const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;

//     // Trigger generation by fetching from ImageKit
//     const aiImageResponse = await axios.get(generatedImageUrl, {
//       responseType: "arraybuffer",
//     });

//     // Convert to Base64
//     const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString("base64")}`;

//     // Upload to ImageKit Media Library
//     const uploadResponse = await imagekit.upload({
//       file: base64Image,
//       fileName: `${Date.now()}.png`,
//       folder: "quickgpt",
//     });

//     const reply = {
//       role: "assistant",
//       content: uploadResponse.url,
//       timestamp: Date.now(),
//       isImage: true,
//       isPublished,
//     };

//     res.json({ success: true, reply });

//     chat.messages.push(reply);
//     await chat.save();

//     await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };

import Chat from "../models/Chat.js";
import User from "../models/User.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";

const SYSTEM_PROMPT =
  "You are WisePath, an AI legal advisor. Provide general legal information clearly and concisely. Always include a disclaimer that your responses do not constitute formal legal advice and users should consult a licensed attorney for their specific situation.";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Retry with exponential backoff on 429
const callGeminiWithRetry = async (
  history,
  userPrompt,
  retries = 3,
  delayMs = 1000
) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: SYSTEM_PROMPT,
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userPrompt);
      return result.response.text();
    } catch (error) {
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.toLowerCase().includes("quota");

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

// OpenAI role "assistant" → Gemini role "model"
// OpenAI content string → Gemini parts array
const toGeminiHistory = (messages) => {
  return messages
    .filter((m) => !m.isImage)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
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

    const history = toGeminiHistory(chat.messages);
    const replyText = await callGeminiWithRetry(history, prompt);

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