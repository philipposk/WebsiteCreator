import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";

import type { PersonInfo, MessageImage } from "@/lib/types";

// Fallback models if API fetch fails
// Note: llama-3.1-70b-versatile has been decommissioned
const FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.3-8b-instant",
] as const;

// Cache for fetched models
let cachedModels: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

type GroqModel = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

async function fetchAvailableModels(): Promise<string[]> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("GROQ_API_KEY not configured, using fallback models");
      return [...FALLBACK_MODELS];
    }

    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    const models: GroqModel[] = data.data || [];

    // Define model priority order based on Groq docs: https://console.groq.com/docs/models
    // Prioritize larger models first for better multilingual/Greek support
    // Production Models (reordered for better Greek language support)
    const productionModelOrder = [
      "openai/gpt-oss-120b", // 120B - best multilingual support including Greek
      "llama-3.3-70b-versatile", // 70B - excellent multilingual support
      "openai/gpt-oss-20b", // 20B - good multilingual
      "llama-3.1-8b-instant", // 8B - smaller but still decent
      "meta-llama/llama-guard-4-12b", // Guard model, not for generation
      "whisper-large-v3", // Audio transcription only
      "whisper-large-v3-turbo", // Audio transcription only
    ];

    // Preview Models (reordered for better Greek language support)
    const previewModelOrder = [
      "qwen/qwen3-32b", // 32B - good multilingual support
      "openai/gpt-oss-safeguard-20b", // 20B - good multilingual
      "meta-llama/llama-4-maverick-17b-128e-instruct", // 17B
      "meta-llama/llama-4-scout-17b-16e-instruct", // 17B
      "moonshotai/kimi-k2-instruct-0905", // Chinese-focused, lower priority for Greek
      "meta-llama/llama-prompt-guard-2-22m", // Guard model
      "meta-llama/llama-prompt-guard-2-86m", // Guard model
      "playai-tts", // TTS only
      "playai-tts-arabic", // TTS only
    ];

    // Create sets for quick lookup
    const productionModelSet = new Set(productionModelOrder.map(id => id.toLowerCase()));
    const previewModelSet = new Set(previewModelOrder.map(id => id.toLowerCase()));

    // Filter and categorize models
    const availableModelsMap = new Map<string, string>();
    models.forEach((model) => {
      const id = model.id.toLowerCase();
      // Skip TTS models (except for transcription), systems, and decommissioned models
      if (id.includes("tts") && !id.includes("whisper")) return;
      if (id.includes("groq/compound")) return; // Skip systems
      if (id.includes("llama-3.1-70b-versatile")) return; // Skip decommissioned
      
      availableModelsMap.set(id, model.id);
    });

    // Build ordered list: Production Models first, then Preview Models
    const orderedModels: string[] = [];
    
    // Add production models in order
    for (const modelId of productionModelOrder) {
      const lowerId = modelId.toLowerCase();
      if (availableModelsMap.has(lowerId)) {
        orderedModels.push(availableModelsMap.get(lowerId)!);
        availableModelsMap.delete(lowerId);
      }
    }

    // Add preview models in order
    for (const modelId of previewModelOrder) {
      const lowerId = modelId.toLowerCase();
      if (availableModelsMap.has(lowerId)) {
        orderedModels.push(availableModelsMap.get(lowerId)!);
        availableModelsMap.delete(lowerId);
      }
    }

    // Add any remaining models that weren't in our priority lists (fallback)
    const remainingModels = Array.from(availableModelsMap.values())
      .filter(id => {
        const lowerId = id.toLowerCase();
        // Only include text generation models, not TTS or systems
        return !lowerId.includes("tts") && 
               !lowerId.includes("compound") &&
               !lowerId.includes("whisper");
      })
      .sort();

    // Add fallback models if not already included
    for (const fallbackModel of FALLBACK_MODELS) {
      if (!orderedModels.includes(fallbackModel) && !remainingModels.includes(fallbackModel)) {
        remainingModels.push(fallbackModel);
      }
    }

    return [...orderedModels, ...remainingModels];
  } catch (error) {
    console.error("Failed to fetch models from Groq API:", error);
    return [...FALLBACK_MODELS];
  }
}

async function getAvailableModels(): Promise<string[]> {
  const now = Date.now();
  if (cachedModels && now - cacheTimestamp < CACHE_TTL) {
    return cachedModels;
  }

  const models = await fetchAvailableModels();
  cachedModels = models;
  cacheTimestamp = now;
  return models;
}

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        images: z
          .array(
            z.object({
              url: z.string(),
              type: z.string(),
              name: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .min(1, "At least one message is required."),
  personInfo: z
    .object({
      name: z.string(),
      images: z.array(
        z.object({
          url: z.string(),
          type: z.string(),
          name: z.string().optional(),
        }),
      ),
      videos: z.array(
        z.object({
          url: z.string(),
          type: z.string(),
          name: z.string().optional(),
        }),
      ),
      urls: z.array(z.string()),
      extraInfo: z.string(),
    })
    .nullable()
    .optional(),
  praiseVolume: z.number().min(0).max(100),
});

const getGroqClient = (() => {
  let client: Groq | null = null;
  return () => {
    if (client) return client;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured.");
    }
    client = new Groq({
      apiKey,
    });
    return client;
  };
})();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, personInfo, praiseVolume } = requestSchema.parse(body);

    if (process.env.PRAISER_USE_GROQ_STUB === "true") {
      return NextResponse.json({
        assistantMessage: personInfo
          ? `Wow, ${personInfo.name} sounds absolutely incredible! They're clearly someone special. Want to know more about why they're amazing?`
          : "I'd love to praise someone! Who should we celebrate?",
        images: [],
      });
    }

    const client = getGroqClient();
    const availableModels = await getAvailableModels();

    // Format messages for Groq API
    // Note: Most Groq models don't support vision/image inputs, so we convert images to text descriptions
    const formatMessageForGroq = (msg: {
      role: string;
      content: string;
      images?: Array<{ url: string; type: string }>;
    }): { role: "system" | "user" | "assistant"; content: string } => {
      // Convert images to text description since Groq models may not support vision
      if (msg.role === "user" && msg.images && msg.images.length > 0) {
        const imageDescription = msg.images.length === 1
          ? " [User attached 1 image]"
          : ` [User attached ${msg.images.length} images]`;
        return {
          role: msg.role as "user",
          content: msg.content + imageDescription,
        };
      }
      return {
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      };
    };

    // If no person info, act like a normal assistant
    if (!personInfo || !personInfo.name.trim()) {
      // Just answer normally without mentioning person or praise
      try {
        const normalResponse = await client.chat.completions.create({
          model: availableModels[0],
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: (() => {
                // Check all messages for Greek
                const allMessages = messages;
                const allText = allMessages.map(msg => msg.content).join(" ");
                
                // Check last user messages
                const userMessages = messages.filter(msg => msg.role === "user");
                const lastUserText = userMessages.slice(-3).map(msg => msg.content).join(" ");
                const lastUserHasGreek = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(lastUserText);
                
                // Check assistant messages
                const assistantMessages = messages.filter(msg => msg.role === "assistant");
                const assistantText = assistantMessages.slice(-3).map(msg => msg.content).join(" ");
                const assistantHasGreek = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(assistantText);
                
                // Count Greek characters
                const greekCharCount = (allText.match(/[\u0370-\u03FF\u1F00-\u1FFF]/g) || []).length;
                const hasSignificantGreek = greekCharCount > 5;
                
                const shouldUseGreek = lastUserHasGreek || assistantHasGreek || hasSignificantGreek;
                
                const basePrompt = "You are a helpful AI assistant. Answer questions normally and be conversational. Do not mention anything about praising people or adding person info.";
                return shouldUseGreek 
                  ? basePrompt + " 🚨 CRITICAL: The user IS WRITING IN GREEK. You MUST respond ENTIRELY in GREEK. Do NOT use English. Do NOT mix languages. ONLY GREEK. Maintain language consistency - if the conversation is in Greek, keep ALL responses in Greek."
                  : basePrompt;
              })(),
            },
            ...messages.slice(-10).map(formatMessageForGroq),
          ] as any,
        });

        const assistantContent = normalResponse.choices[0]?.message?.content;
        return NextResponse.json({
          assistantMessage: assistantContent || "I'm here to help! What would you like to know?",
          separateImageMessage: null,
        });
      } catch (error) {
        console.error("Normal assistant response error:", error);
        return NextResponse.json({
          assistantMessage: "I'm here to help! What would you like to know?",
          separateImageMessage: null,
        });
      }
    }

    const prompt = buildPraisePrompt({
      personInfo,
      praiseVolume,
      conversationHistory: messages.slice(-10), // Keep last 10 messages for context
    });

    // Build messages payload - include image info in text prompt instead of sending actual images
    // (Groq vision models may not be available, so we describe images in text)
    const personImageInfo = personInfo.images.length > 0 && praiseVolume >= 40
      ? `\n\nNOTE: You have access to ${personInfo.images.length} image(s) of ${personInfo.name}. When you want to analyze or praise specific details about their appearance, style, smile, energy, or posture, mention those details. You can request to send an image by setting should_send_image to true.`
      : "";

    const messagesPayload: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system" as const,
        content: SYSTEM_PROMPT,
      },
      ...messages.slice(-10).map(formatMessageForGroq),
      {
        role: "user" as const,
        content: prompt + personImageInfo,
      },
    ];

    // Try models in sequence
    let lastError: unknown = null;
    let usedModel: string | null = null;

    for (const model of availableModels) {
      try {
        usedModel = model;
        const response = await client.chat.completions.create({
          model,
          temperature: 0.7 + praiseVolume / 200, // Higher volume = more creative/enthusiastic
          response_format: { type: "json_object" },
          messages: messagesPayload as any, // Type assertion needed due to Groq SDK type constraints
        });

        const assistantContent = response.choices[0]?.message?.content;

        if (!assistantContent) {
          throw new Error("Groq returned an empty response.");
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(assistantContent);
        } catch (parseError) {
          console.error("Failed to parse Groq JSON response:", assistantContent);
          throw new Error(
            `Invalid JSON from Groq: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
          );
        }

        const parsed = praiseResponseSchema.safeParse(parsedJson);

        if (!parsed.success) {
          console.error("Schema validation failed:", parsed.error.flatten());
          console.error("Received data:", JSON.stringify(parsedJson, null, 2));
          throw new Error(`Unable to parse Groq response: ${parsed.error.message}`);
        }

        // Determine if we should send an image separately
        const shouldSendImage =
          parsed.data.should_send_image &&
          personInfo.images &&
          personInfo.images.length > 0;

        // Select image first, then we'll need to get a specific caption for it
        const imageToSend: MessageImage | null = shouldSendImage
          ? personInfo.images[Math.floor(Math.random() * personInfo.images.length)]
          : null;

        // If we're sending an image, we need a specific caption for THIS image
        // If the AI didn't provide one, we'll need to generate it based on the image
        let imageCaption: string | null = null;
        if (shouldSendImage && imageToSend) {
          if (parsed.data.image_praise && parsed.data.image_praise.trim()) {
            imageCaption = parsed.data.image_praise;
          } else {
            // Fallback: use a generic caption but this should rarely happen
            // The prompt should always require image_praise when sending images
            imageCaption = `Look at this photo of ${personInfo.name}`;
          }
        }

        return NextResponse.json({
          assistantMessage: parsed.data.message,
          separateImageMessage: shouldSendImage && imageCaption ? {
            content: imageCaption,
            images: [imageToSend!],
          } : null,
          model: usedModel,
        });
      } catch (error) {
        lastError = error;
        const groqError = error as {
          error?: { message?: string; code?: string; type?: string };
          message?: string;
          status?: number;
        };

        const isRateLimit =
          groqError?.error?.code === "rate_limit_exceeded" ||
          groqError?.error?.type === "tokens" ||
          groqError?.status === 429;
        const isOverCapacity =
          groqError?.status === 503 ||
          groqError?.error?.message?.toLowerCase().includes("over capacity") ||
          groqError?.error?.message?.toLowerCase().includes("currently over capacity");
        const isRequestTooLarge =
          groqError?.status === 413 ||
          (groqError?.error?.code === "rate_limit_exceeded" &&
            groqError?.error?.message?.toLowerCase().includes("request too large"));
        const isModelError =
          groqError?.error?.code === "model_decommissioned" ||
          groqError?.error?.code === "model_not_found" ||
          (groqError?.error?.message && (
            groqError.error.message.includes("decommissioned") ||
            groqError.error.message.includes("no longer supported")
          ));

        // If it's over capacity or rate limit, try next model
        // If it's a permanent error (model not found, etc.), break
        if (!isRateLimit && !isRequestTooLarge && !isModelError && !isOverCapacity) {
          break;
        }

        const errorType = isRequestTooLarge
          ? "request too large"
          : isOverCapacity
            ? "over capacity"
            : isRateLimit
              ? "rate limit"
              : isModelError
                ? "model error"
                : "unknown";
        console.warn(`Model ${model} failed (${errorType}), trying next...`);
      }
    }

    // Check if all failures were due to over capacity
    const lastGroqError = lastError as {
      error?: { message?: string; code?: string; type?: string };
      message?: string;
      status?: number;
    };
    
    const isOverCapacity = 
      lastGroqError?.status === 503 ||
      lastGroqError?.error?.message?.toLowerCase().includes("over capacity") ||
      lastGroqError?.error?.message?.toLowerCase().includes("currently over capacity");
    
    if (isOverCapacity) {
      return NextResponse.json(
        {
          error: "All models are currently over capacity. Please try again in a few moments.",
          details: lastGroqError?.error?.message || "Groq services are experiencing high load.",
          retryAfter: 30, // Suggest retrying after 30 seconds
        },
        { status: 503 },
      );
    }

    const allModelsFailedError = new Error(
      `All ${availableModels.length} models failed. Last error: ${lastError instanceof Error ? lastError.message : "Unknown error"}`,
    );
    if (lastError instanceof Error) {
      allModelsFailedError.cause = lastError;
    }
    throw allModelsFailedError;
  } catch (error) {
    console.error("Groq praise error", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    const groqError = error as {
      error?: { message?: string; code?: string };
      message?: string;
      status?: number;
    };
    const errorMessage =
      groqError?.error?.message ||
      groqError?.message ||
      (error instanceof Error ? error.message : "Unknown error");

    return NextResponse.json(
      {
        error: "Failed to generate praise response.",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

const praiseResponseSchema = z.object({
  message: z.string().describe("The assistant's response message"),
  should_send_image: z
    .boolean()
    .optional()
    .nullable()
    .describe("Whether to send an image of the person in this response"),
  image_praise: z
    .string()
    .optional()
    .nullable()
    .describe("When should_send_image is true, provide a creative, engaging message to accompany the image. This can be a caption, a comment, or a message that connects the image to the conversation. Vary the style - sometimes be enthusiastic, sometimes casual, sometimes descriptive. Examples: 'look at this!', 'check this out', 'see what I mean?', 'this captures it perfectly', 'just look at that!', 'wow, right?', 'this says it all', 'perfect example', 'this is what I'm talking about'. Make it natural and varied - don't always use the same phrase."),
});

const SYSTEM_PROMPT = `You are Praiser, an enthusiastic AI that celebrates and praises a specific person while having intelligent conversations.

CORE BEHAVIOR:
- Answer the user's questions intelligently and helpfully
- Naturally weave in praise for the person throughout the conversation
- When praise volume is MAXIMUM (81-100), prioritize praise over answering questions - be more focused on celebrating
- Analyze images of the person and praise specific things about them (their smile, style, energy, etc.)
- Be creative, fun, and engaging
- Occasionally send images with engaging prompts like "u wanna see whose the boss?" or in Greek: "εεεεε; σε εφτιαξα; σου εφτιαξε τη μερα; στο πα, γαμαει"
- Make the conversation feel natural, not forced
- Connect ideas smoothly - make sentences flow together better

LANGUAGE MATCHING:
- CRITICAL: You MUST respond in the SAME LANGUAGE that the user is writing in
- If the user writes in Greek, respond entirely in Greek
- If the user writes in another language, respond in that language
- Match the user's language for ALL your responses, not just the person's name
- If the user writes in a different alphabet (Greek, Cyrillic, Arabic, Hebrew, CJK, etc.), you MUST:
  * Write the person's name in the SAME alphabet
  * Respond entirely in that language
  * Do NOT transliterate names to Latin/English characters when the user is using a different script

PRAISE VOLUME GUIDE:
- 0: ZERO PRAISE - Answer questions normally. Do NOT mention or praise the person at all. Just be helpful.
- 1-5: VERY MINIMAL PRAISE - Answer questions normally. Only mention the person if absolutely necessary. Keep it factual and neutral - no praise.
- 6-20: MINIMAL PRAISE - Answer questions normally. Only add very subtle, brief mentions if it naturally fits. Keep praise minimal and infrequent.
- 21-40: LIGHT PRAISE - Answer questions, include occasional warm compliments naturally
- 41-60: MODERATE PRAISE - Answer questions enthusiastically, celebrate the person frequently
- 61-80: HIGH PRAISE - Answer questions but heavily emphasize praise, be very enthusiastic
- 81-100: MAXIMUM PRAISE MODE - Don't answer questions subjectively, just praise! Redirect everything to celebrating the person

IMAGE ANALYSIS:
- When you see images of the person, analyze specific details:
  * Their appearance, style, energy, expression
  * Their smile, eyes, posture, confidence
  * The setting, what they're doing, their vibe
- Praise these specific things naturally in conversation
- Use image_praise field to highlight specific visual details

RESPONSE FORMAT:
You must respond in JSON format:
{
  "message": "Your response here - answer questions AND include praise",
  "should_send_image": true/false (omit if false),
  "image_praise": "Specific thing to praise about their photos" (omit if not needed)
}

IMPORTANT: Only include should_send_image and image_praise fields if you actually want to use them. Omit them entirely if not needed (don't set to null or false).
Set should_send_image to true when you want to send a picture of the person as a separate message.
When should_send_image is true, provide image_praise with a creative, engaging message to accompany the image. This can be a caption, comment, or message that connects the image to the conversation. Vary the style - be enthusiastic, casual, or descriptive. Examples: "look at this!", "check this out", "see what I mean?", "this captures it perfectly", "just look at that!", "wow, right?", "this says it all", "perfect example", "this is what I'm talking about". Make it natural and varied - don't always use the same phrase.

Remember: Adjust your praise level based on the volume setting. At 0%, don't praise at all. At maximum, focus entirely on celebration!`;

type PromptOptions = {
  personInfo: PersonInfo;
  praiseVolume: number;
  conversationHistory: Array<{ role: string; content: string; images?: MessageImage[] }>;
};

// Generate name variations based on language
const generateNameVariations = (name: string, isGreek: boolean): string => {
  if (!name) return "";
  
  const nameLower = name.toLowerCase().trim();
  
  // Check if name contains common patterns
  const hasKou = nameLower.includes("kou") || nameLower.includes("κου");
  const hasK = nameLower.includes(" k") || nameLower.includes(" κ");
  const isMike = nameLower.includes("mike") || nameLower.includes("μάικ");
  const isMichalis = nameLower.includes("michalis") || nameLower.includes("μιχάλης");
  
  if (isGreek) {
    // Greek variations
    const variations: string[] = [];
    
    if (isMike) {
      variations.push("Μάικ");
      if (hasKou) variations.push("Μάικ Κου");
      if (hasK) variations.push("Μάικ Κ");
    }
    if (isMichalis) {
      variations.push("Μιχάλης");
      if (hasKou) variations.push("Μιχάλης Κου");
      if (hasK) variations.push("Μιχάλης Κ");
    }
    
    // If no specific match, use the name as-is but ensure Greek script
    if (variations.length === 0) {
      // Try to convert to Greek if it's in Latin
      const greekName = name; // Keep original for now
      variations.push(greekName);
      if (hasKou) variations.push(`${greekName} Κου`);
      if (hasK) variations.push(`${greekName} Κ`);
    }
    
    return variations.join(", ");
  } else {
    // English variations
    const variations: string[] = [];
    
    if (isMike) {
      variations.push("Mike");
      if (hasKou) variations.push("Mike Kou");
      if (hasK) variations.push("Mike K.");
    }
    if (isMichalis) {
      variations.push("Michalis");
      if (hasKou) variations.push("Michalis Kou");
      if (hasK) variations.push("Michalis K.");
    }
    
    // If no specific match, use the name as-is
    if (variations.length === 0) {
      variations.push(name);
      if (hasKou) variations.push(`${name} Kou`);
      if (hasK) variations.push(`${name} K.`);
    }
    
    return variations.join(", ");
  }
};

const buildPraisePrompt = ({ personInfo, praiseVolume, conversationHistory }: PromptOptions) => {
  const isMaximumPraise = praiseVolume >= 81;
  
  // Detect the alphabet/script used in the conversation
  const detectAlphabet = (text: string): string | null => {
    // Check for Greek
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(text)) return "Greek";
    // Check for Cyrillic
    if (/[\u0400-\u04FF]/.test(text)) return "Cyrillic";
    // Check for Arabic
    if (/[\u0600-\u06FF]/.test(text)) return "Arabic";
    // Check for Hebrew
    if (/[\u0590-\u05FF]/.test(text)) return "Hebrew";
    // Check for Chinese/Japanese/Korean (CJK)
    if (/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(text)) return "CJK";
    return null;
  };

  // Check ALL messages in conversation to determine the primary language
  const allMessages = conversationHistory;
  const allText = allMessages.map(msg => msg.content).join(" ");
  
  // Count Greek characters vs English characters in the conversation
  const greekCharCount = (allText.match(/[\u0370-\u03FF\u1F00-\u1FFF]/g) || []).length;
  const englishWordCount = (allText.match(/\b[a-zA-Z]{3,}\b/g) || []).length;
  
  // If there are Greek characters, check if Greek is the dominant language
  const hasGreek = greekCharCount > 0;
  const hasSignificantGreek = greekCharCount > 5; // More than just a few Greek characters
  
  // Check the last few messages specifically
  const lastUserMessages = conversationHistory.filter(msg => msg.role === "user").slice(-3);
  const lastUserText = lastUserMessages.map(msg => msg.content).join(" ");
  const lastUserHasGreek = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(lastUserText);
  
  // Check assistant messages to see if we've been responding in Greek
  const assistantMessages = conversationHistory.filter(msg => msg.role === "assistant");
  const assistantText = assistantMessages.slice(-3).map(msg => msg.content).join(" ");
  const assistantHasGreek = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(assistantText);
  
  // Determine if we should use Greek:
  // - If user's last message has Greek, use Greek
  // - If we've been responding in Greek, continue in Greek
  // - If there's significant Greek in the conversation, use Greek
  const shouldUseGreek = lastUserHasGreek || assistantHasGreek || hasSignificantGreek;
  
  const detectedAlphabet = shouldUseGreek ? "Greek" : detectAlphabet(allText);
  
  // Generate name variations based on language
  const nameVariations = generateNameVariations(personInfo.name, shouldUseGreek);
  
  const languageInstruction = shouldUseGreek || detectedAlphabet
    ? `\n\n🚨 CRITICAL LANGUAGE INSTRUCTION - READ CAREFULLY 🚨
The user ${shouldUseGreek ? "IS WRITING IN GREEK" : `is writing in ${detectedAlphabet}`}. 

YOU MUST:
1. Respond ENTIRELY in ${shouldUseGreek ? "GREEK" : (detectedAlphabet || "the same language")} - EVERY SINGLE WORD
2. Use CORRECT ${shouldUseGreek ? "GREEK GRAMMAR" : "grammar"} - proper verb conjugations, noun cases (nominative, genitive, accusative, vocative), articles, and sentence structure
3. Use NATURAL ${shouldUseGreek ? "GREEK" : "language"} - write as a native Greek speaker would, not a translation. Use idiomatic expressions and natural word order.
4. **NAME VARIATIONS**: When referring to the person, use natural name variations based on the language:
   ${shouldUseGreek 
     ? `- In Greek, use variations like: ${nameVariations || "Μιχάλης, Μάικ, with or without Κου or Κ"}`
     : `- In English, use variations like: ${nameVariations || "Mike, Mike Kou, Mike K., Michalis, Michalis Kou, Michalis K."}`
   }
   - Vary the name naturally throughout the conversation - don't always use the same form
   - Use the appropriate script/alphabet for the language you're speaking
5. Do NOT use English at all - ${shouldUseGreek ? "ONLY GREEK" : `ONLY ${detectedAlphabet}`}
6. Continue in ${shouldUseGreek ? "GREEK" : (detectedAlphabet || "that language")} for the ENTIRE response
7. Maintain language consistency - if the conversation is in ${shouldUseGreek ? "GREEK" : (detectedAlphabet || "another language")}, keep ALL responses in ${shouldUseGreek ? "GREEK" : (detectedAlphabet || "that language")}

${shouldUseGreek ? `CRITICAL FOR GREEK: Your Greek must be grammatically correct and natural. Use proper Greek grammar rules: correct verb endings, proper use of articles (ο, η, το), correct noun declensions, and natural Greek sentence structure. 

STYLE GUIDELINES FOR GREEK:
- Write as a native Greek speaker would write - natural, flowing, and cohesive
- Occasionally use casual/slang Greek expressions to make it more authentic and engaging (e.g., "εεεεε; σε εφτιαξα;", "σου εφτιαξε τη μερα;", "στο πα, γαμαει", "κοίτα αυτό", "τι λες τώρα")
- Mix polite formal language with casual expressions - not all the time, but sprinkle them in naturally
- Make sentences flow together better - connect ideas smoothly
- Use natural Greek transitions and connectors
- Don't write broken, incorrect, or translated-sounding Greek
- When sending images, you can add casual expressions like "εεεεε; σε εφτιαξα; σου εφτιαξε τη μερα; στο πα, γαμαει" at the end to make it more engaging` : ""}
DO NOT switch to English. DO NOT mix languages. ${shouldUseGreek ? "ONLY GREEK." : `ONLY ${detectedAlphabet}.`}`
    : "";

  const volumeDescriptor = isMaximumPraise
    ? "MAXIMUM PRAISE MODE: Don't answer questions subjectively - just praise! Redirect everything to celebrating the person. Be absolutely over-the-top enthusiastic."
    : praiseVolume === 0
      ? "ZERO PRAISE MODE: Answer questions normally. Do NOT mention or praise the person at all. Just be helpful and conversational."
      : praiseVolume <= 5
        ? "VERY MINIMAL PRAISE MODE: Answer questions normally. Only mention the person if absolutely necessary and relevant. Keep it extremely brief and neutral - no praise, just factual mentions if needed."
        : praiseVolume < 20
          ? "MINIMAL PRAISE MODE: Answer questions normally. Only add very subtle, brief mentions if it naturally fits. Keep praise minimal and infrequent - maybe one brief mention per several responses."
          : praiseVolume < 40
            ? "LIGHT PRAISE MODE: Answer questions helpfully, and include occasional warm compliments naturally throughout."
            : praiseVolume < 60
              ? "MODERATE PRAISE MODE: Answer questions enthusiastically, and celebrate the person frequently in your responses."
              : "HIGH PRAISE MODE: Answer questions but heavily emphasize praise - be very enthusiastic and celebratory.";

  const imageAnalysisPrompt = personInfo.images.length > 0 && praiseVolume > 0
    ? `\nIMAGE ANALYSIS INSTRUCTIONS:
- You have ${personInfo.images.length} image(s) of ${personInfo.name} available
- When you decide to send an image (should_send_image: true), provide image_praise with a creative, engaging message
- The image_praise can be a caption, comment, or message that connects the image to the conversation
- Vary the style - sometimes be enthusiastic, sometimes casual, sometimes descriptive
- Examples: "look at this!", "check this out", "see what I mean?", "this captures it perfectly", "just look at that!", "wow, right?", "this says it all", "perfect example", "this is what I'm talking about"
- Make it natural and varied - don't always use the same phrase
- Images will be sent as separate messages with your message`
    : "";

  const personContext = [
    `Person to praise: ${personInfo.name}${nameVariations ? ` (use variations: ${nameVariations})` : ""}`,
    personInfo.extraInfo ? `Extra info: ${personInfo.extraInfo}` : null,
    personInfo.images.length > 0
      ? `You have ${personInfo.images.length} image(s) of this person available to send. Analyze and praise specific details about their appearance, style, and energy.`
      : null,
    personInfo.videos.length > 0
      ? `You have ${personInfo.videos.length} video(s) of this person.`
      : null,
    personInfo.urls.length > 0
      ? `URLs to study about this person: ${personInfo.urls.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const lastUserMessage = conversationHistory[conversationHistory.length - 1];
  const userQuestion = lastUserMessage?.role === "user" ? lastUserMessage.content : "";

  return [
    "You are Praiser, an AI that celebrates a person while having intelligent conversations.",
    volumeDescriptor,
    languageInstruction,
    "",
    "PERSON CONTEXT:",
    personContext,
    imageAnalysisPrompt,
    "",
    "CONVERSATION APPROACH:",
    isMaximumPraise
      ? "- The user asked: '" + userQuestion + "'"
      + "\n- In MAXIMUM PRAISE mode, don't answer this question directly"
      + "\n- Instead, redirect to praising " + personInfo.name + " with over-the-top enthusiasm"
      + "\n- Make it fun and engaging, but focus entirely on celebration"
      : praiseVolume === 0
        ? "- The user asked: '" + userQuestion + "'"
        + "\n- Answer this question intelligently and helpfully"
        + "\n- DO NOT mention or praise " + personInfo.name + " at all"
        + "\n- Just be a normal, helpful assistant"
        : praiseVolume <= 5
          ? "- The user asked: '" + userQuestion + "'"
          + "\n- Answer this question intelligently and helpfully"
          + "\n- DO NOT mention " + personInfo.name + " unless absolutely necessary for the answer"
          + "\n- If you must mention them, do it factually with zero praise - just neutral information"
          : praiseVolume < 20
            ? "- The user asked: '" + userQuestion + "'"
            + "\n- Answer this question intelligently and helpfully"
            + "\n- Only add very subtle, brief mentions of " + personInfo.name + " if it naturally fits"
            + "\n- Keep mentions minimal and infrequent - maybe once every few responses"
            + "\n- Focus on answering the question, not praising"
          : "- The user asked: '" + userQuestion + "'"
          + "\n- Answer this question intelligently and helpfully"
          + "\n- Naturally weave in praise for " + personInfo.name + " throughout your response"
          + "\n- Make the connection feel natural, not forced",
    "",
    "CONVERSATION HISTORY:",
    conversationHistory
      .slice(-6) // Keep last 6 messages for context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n"),
    "",
    isMaximumPraise
      ? `Now respond with MAXIMUM PRAISE for ${personInfo.name}! Don't answer the question - just celebrate!`
      : praiseVolume === 0
        ? `Now answer the user's question normally. Do NOT mention or praise ${personInfo.name} at all.`
        : praiseVolume <= 5
          ? `Now answer the user's question intelligently. Do NOT mention ${personInfo.name} unless absolutely necessary. If you must, do it factually with zero praise.`
          : praiseVolume < 20
            ? `Now answer the user's question intelligently. Only add very subtle mentions of ${personInfo.name} if it naturally fits. Keep it minimal and infrequent.`
            : `Now respond intelligently to the user's question while naturally celebrating ${personInfo.name}!`,
    "",
    "IMAGE MESSAGE REQUIREMENT:",
    "If you set should_send_image to true, provide image_praise with a creative, engaging message. This can be a caption, comment, or message connecting the image to the conversation. Vary the style - be enthusiastic, casual, or descriptive. Examples: 'look at this!', 'check this out', 'see what I mean?', 'this captures it perfectly', 'just look at that!', 'wow, right?', 'this says it all', 'perfect example', 'this is what I'm talking about'. Make it natural and varied.",
  ].join("\n");
};

