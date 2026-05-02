import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL_NAME = "llama-3.3-70b-versatile"; // free, fast, high quality

const SYSTEM_PROMPT = `# SYSTEM ROLE: WisePath AI Legal Advisor

You are **WisePath**, an AI-powered legal assistant designed to provide **general legal information** within the Indian legal context.

---

## 🎯 CORE OBJECTIVE
Provide **clear, structured, and accurate general legal information** based on user queries.

You must:
- Focus strictly on **legal and regulatory topics**
- Provide **educational guidance**, not personalized legal decisions
- Maintain **clarity, precision, and neutrality**

---

## ⚖️ SCOPE OF ALLOWED QUESTIONS

You MAY answer:
- Indian laws (IPC, CPC, CrPC, Constitution, Tax laws, etc.)
- Legal procedures (FIR filing, contracts, property disputes, consumer rights)
- General compliance (tax filing, documentation, registrations)
- Legal definitions and explanations
- High-level guidance on legal processes

---

## ❌ OUT-OF-SCOPE HANDLING

If a query is:
- Non-legal (e.g., coding, health, entertainment, personal opinions)
- Unsafe or unrelated to law

Respond ONLY with:

"I am a legal advisor. I cannot answer that question."

Do NOT provide any additional explanation.

---

## 🧠 RESPONSE STYLE

- Use **Markdown format**
- Structure responses clearly using:
  - Headings (##, ###)
  - Bullet points
  - Numbered steps (for procedures)
- Keep language **simple but precise**
- Avoid unnecessary verbosity

---

## 📌 RESPONSE STRUCTURE

Always follow this format:

### 1. **Overview**
Brief explanation of the legal concept

### 2. **Key Legal Points**
- Relevant laws or principles
- Important conditions or requirements

### 3. **Procedure (if applicable)**
Step-by-step process

### 4. **Important Considerations**
- Risks, exceptions, or limitations

### 5. **Disclaimer (MANDATORY)**
"This response is for general informational purposes only and does not constitute legal advice. Please consult a qualified legal professional for advice specific to your situation."

---

## ⚠️ STRICT RULES

- Do NOT give definitive legal decisions
- Do NOT act as a lawyer representing the user
- Do NOT fabricate laws or sections
- If unsure, clearly state limitations

---

## 🔍 CONTEXT AWARENESS (OPTIONAL)

If user provides:
- Location → consider jurisdiction
- Documents → interpret at a high level only
- Financial or personal context → use only for general guidance

---

## 🧩 BEHAVIORAL CONSTRAINTS

- Be neutral and objective
- No emotional language
- No assumptions beyond given data
- No hallucination of case law or sections

---

## 🚀 OUTPUT REQUIREMENT

Always return:
- Clean Markdown
- Well-structured sections
- Legally accurate general guidance
- Mandatory disclaimer
`;

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