import { GoogleGenAI } from '@google/genai';

const getApiKey = (): string => {
  return (import.meta.env.VITE_AI_API_KEY || '').trim();
};

export function isAiConfigured(): boolean {
  return getApiKey().length > 0;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function detectMimeType(fileName?: string, headerType?: string | null): string {
  const cleanName = (fileName || '').toLowerCase();

  if (cleanName.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (cleanName.endsWith('.doc')) {
    return 'application/msword';
  }
  if (cleanName.endsWith('.pptx')) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  if (cleanName.endsWith('.ppt')) {
    return 'application/vnd.ms-powerpoint';
  }
  if (cleanName.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (cleanName.endsWith('.xls')) {
    return 'application/vnd.ms-excel';
  }
  if (cleanName.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (cleanName.endsWith('.png')) {
    return 'image/png';
  }
  if (cleanName.endsWith('.jpg') || cleanName.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (cleanName.endsWith('.webp')) {
    return 'image/webp';
  }
  if (cleanName.endsWith('.gif')) {
    return 'image/gif';
  }
  if (cleanName.endsWith('.txt')) {
    return 'text/plain';
  }
  if (cleanName.endsWith('.csv')) {
    return 'text/csv';
  }

  if (headerType && !headerType.includes('octet-stream')) {
    return headerType.split(';')[0].trim();
  }

  return 'application/pdf';
}

/**
 * Chat completion function that passes the active class context, active document context,
 * native document inline binary data (for .docx, .pptx, .pdf, images), the complete
 * Class Knowledge Base, and the user's active UI language to Gemini.
 */
export async function sendChatMessage(
  userPrompt: string,
  activeDocumentTitle?: string,
  activeClassName?: string,
  classKnowledgeBase?: string,
  documentUrlOrCallback?: string | ((chunk: string, cumulative: string) => void),
  callbackOrLanguage?: ((chunk: string, cumulative: string) => void) | string,
  callbackOrStreamChunk?: (chunk: string, cumulative: string) => void
): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API key is missing. Please add VITE_AI_API_KEY to your .env.local file to enable live AI responses.'
    );
  }

  let activeDocumentUrl: string | undefined;
  let activeLanguage = 'English';
  let onStreamChunk: ((chunk: string, cumulative: string) => void) | undefined;

  if (typeof documentUrlOrCallback === 'function') {
    onStreamChunk = documentUrlOrCallback;
    activeDocumentUrl = undefined;
  } else if (typeof documentUrlOrCallback === 'string') {
    activeDocumentUrl = documentUrlOrCallback;
  }

  if (typeof callbackOrLanguage === 'function') {
    onStreamChunk = callbackOrLanguage;
  } else if (typeof callbackOrLanguage === 'string' && callbackOrLanguage.trim().length > 0) {
    activeLanguage = callbackOrLanguage.trim();
  }

  if (typeof callbackOrStreamChunk === 'function') {
    onStreamChunk = callbackOrStreamChunk;
  }

  const ai = new GoogleGenAI({ apiKey });

  const classNameClean = activeClassName?.trim() || '';
  const docTitleClean = activeDocumentTitle?.trim() || '';
  const kbClean = classKnowledgeBase?.trim() || '';

  // 1. Fetch the active document binary from Supabase public URL and encode to Base64 for native parsing
  let documentPart: { inlineData: { data: string; mimeType: string } } | null = null;
  if (activeDocumentUrl) {
    try {
      const response = await fetch(activeDocumentUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const headerType = response.headers.get('content-type');
        const mimeType = detectMimeType(docTitleClean || activeDocumentUrl, headerType);
        const base64Data = arrayBufferToBase64(buffer);
        if (base64Data) {
          documentPart = {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          };
        }
      } else {
        console.warn(`Could not fetch active document at ${activeDocumentUrl}: status ${response.status}`);
      }
    } catch (fetchErr) {
      console.warn('Could not fetch active document for Gemini inline parsing:', fetchErr);
    }
  }

  const classAnchor = classNameClean
    ? `You are a helpful, knowledgeable medical study partner. We are currently studying for our "${classNameClean}" module.`
    : 'You are a helpful, knowledgeable medical study partner studying medical practical examinations.';

  const docContext = docTitleClean
    ? `FOCUS DOCUMENT: The user is currently looking specifically at the file named "${docTitleClean}".`
    : 'FOCUS DOCUMENT: NO DOCUMENT IS CURRENTLY ACTIVE OR LOADED.';

  const attachmentNote = documentPart
    ? `\n[NATIVE ATTACHMENT LOADED: The active document file has been directly attached in this message as inlineData (${documentPart.inlineData.mimeType}). Read its full text, slide content, headings, structure, and images directly.]`
    : '';

  const knowledgeBaseSection = kbClean
    ? `=== CLASS KNOWLEDGE BASE (ALL MATERIALS IN THIS MODULE) ===\n${kbClean}\n=== END OF CLASS KNOWLEDGE BASE ===`
    : '=== CLASS KNOWLEDGE BASE ===\nNo module documents have been uploaded to this class yet.\n=== END OF CLASS KNOWLEDGE BASE ===';

  // Intent parser: Detect "First-Time Learning" / "Teach me the basics" request across English, Romanian, and Hungarian
  const promptLower = userPrompt.toLowerCase();
  const isFirstTimeLearningIntent =
    promptLower.includes('reading this document for the first time') ||
    promptLower.includes('teach me the basics') ||
    promptLower.includes('guide me through the basic concepts') ||
    promptLower.includes('first-time learning') ||
    promptLower.includes('guided reading') ||
    promptLower.includes('citesc acest document pentru prima dată') ||
    promptLower.includes('invata-ma elementele de baza') ||
    promptLower.includes('învață-mă elementele de bază') ||
    promptLower.includes('conceptele de bază') ||
    promptLower.includes('először olvasom') ||
    promptLower.includes('tanítsd meg az alapokat') ||
    promptLower.includes('alapvető koncepciók') ||
    promptLower.includes('alapfogalmak');

  const languageInstruction = `CRITICAL MANDATORY LANGUAGE REQUIREMENT:
You must communicate, explain concepts, and format all questions and answers exclusively in ${activeLanguage}. Do not use English unless citing a specific Latin or English medical term that lacks a direct translation.`;

  const systemInstruction = `${languageInstruction}

${classAnchor}
${docContext}${attachmentNote}

${knowledgeBaseSection}

LANGUAGE COMPLIANCE:
- You must communicate, explain concepts, and format all questions and answers exclusively in ${activeLanguage}. Do not use English unless citing a specific Latin or English medical term that lacks a direct translation.

TONE & PERSONALITY:
- Use a natural, conversational, and encouraging tone in ${activeLanguage}—like a smart, friendly peer quizzing a classmate over study materials, NOT a robotic "OSPE Examiner".
- Be supportive, concise, and focused on high-yield clinical practical exam concepts.
- Use rich Markdown formatting: bold key anatomical structures, use bullet points for lists, and clear subheadings for organized explanations.

FOCUS MODE LOGIC & KNOWLEDGE BASE INTEGRATION:
- You have been provided with the Class Knowledge Base containing all study materials for this module. The user is currently looking specifically at the file named '${docTitleClean || 'none'}'.
- Use the broader knowledge base to inform your answers, anatomical relations, histology layers, and clinical ties, but focus your immediate questions, MCQs, and station drills specifically on the active document unless the user asks otherwise.

CRITICAL GUARDRAIL (NO HALLUCINATIONS):
- If there is NO active document loaded (active document title is empty or missing):
  You must ABSOLUTELY NOT invent, assume, or guess a medical topic, slide, or question to discuss.
  Instead, concisely and politely ask your study partner in ${activeLanguage} to select or upload a document in the Study Center first so you can study and practice it together.

MODES OF INTERACTION (ALL EXCLUSIVELY IN ${activeLanguage.toUpperCase()}):

1. FIRST-TIME LEARNING (GUIDED READING MODE):
   - Triggered when the user asks "Teach me the basics", is reading for the first time, or asks to be guided step-by-step:
     a) Title: Start your response with the distinct header:
        ### 📖 Guided Reading Mode
        (or translated equivalent in ${activeLanguage}) so the student immediately sees you have shifted out of exam mode.
     b) Digestible Sections: Break the active document down into small, easily digestible sections (e.g. 1. Orientation & Big Picture, 2. Key Structures & Landmarks, 3. How It Works). Do not overwhelm with an exhaustive wall of text.
     c) Plain Language & Analogies: Demystify dense medical terminology simply in ${activeLanguage}, using real-world analogies where helpful.
     d) No Grading / Socratic Check: Absolutely do NOT test, quiz, or grade the student yet. Instead, conclude each explanation with a warm Socratic check in ${activeLanguage} for basic understanding.

2. MULTIPLE CHOICE QUESTIONS (MCQs):
   - Formulate engaging 4-option questions (A, B, C, D) in ${activeLanguage} testing identification, innervation, blood supply, tissue layers, or physiological curves grounded specifically in "${docTitleClean}".
   - Explain the correct answer clearly in ${activeLanguage} and include a high-yield clinical pearl.

3. WRITTEN STATIONS:
   - Formulate practical OSPE station questions in ${activeLanguage} with itemized marks (e.g. "[1.0 Mark]", "[0.5 Mark]").
   - If the student submits an answer, provide constructive, encouraging point-by-point feedback and the model answer in ${activeLanguage}.

4. Keep the scope strictly anchored to "${docTitleClean}" and the broader module knowledge base.
${isFirstTimeLearningIntent ? `\n[ACTIVE INTENT DETECTED: First-Time Learning Mode requested. Shift into Mode 1 in ${activeLanguage}: start with "### 📖 Guided Reading Mode", break down the material step-by-step, use plain language and analogies, avoid grading, and finish with a Socratic understanding check in ${activeLanguage}.]` : ''}`;

  const userParts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
  if (documentPart) {
    userParts.push(documentPart);
  }
  userParts.push({
    text: `${systemInstruction}\n\nStudent: ${userPrompt}`,
  });

  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-1.5-flash',
    'gemini-2.5-flash',
  ];
  let lastError: unknown = null;

  for (const model of candidateModels) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: [
          {
            role: 'user',
            parts: userParts,
          },
        ],
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        const chunkText = chunk.text || '';
        fullText += chunkText;
        if (onStreamChunk) {
          onStreamChunk(chunkText, fullText);
        }
      }

      if (fullText.trim().length > 0) {
        return fullText;
      }
    } catch (err: unknown) {
      lastError = err;
      console.warn(`Model ${model} call encountered error:`, err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('401')) {
        throw err;
      }
    }
  }

  throw (
    lastError ||
    new Error('Failed to generate response from Gemini API. Please check your network and API key.')
  );
}
