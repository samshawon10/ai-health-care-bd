import OpenAI from "openai";
import { env } from "../config/env.js";
import { emergencyActionText } from "./emergencyService.js";
import { detectLanguage, isBangla } from "./languageService.js";

let openaiClient = null;

function getOpenAIClient() {
  if (!env.openaiApiKey) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.openaiApiKey,
      timeout: env.openaiRequestTimeoutMs,
      maxRetries: 1
    });
  }

  return openaiClient;
}

const guidanceSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "possibleCondition",
    "riskLevel",
    "explanation",
    "recommendation",
    "emergencyAction",
    "emergencyRequired",
    "disclaimer",
    "language"
  ],
  properties: {
    possibleCondition: {
      type: "string",
      description: "A cautious possible condition or health topic, never a definitive diagnosis."
    },
    riskLevel: {
      type: "string",
      enum: ["Low", "Medium", "High"]
    },
    explanation: {
      type: "string"
    },
    recommendation: {
      type: "string"
    },
    emergencyAction: {
      type: "string"
    },
    emergencyRequired: {
      type: "boolean"
    },
    disclaimer: {
      type: "string"
    },
    language: {
      type: "string",
      enum: ["Bangla", "English", "Mixed"]
    }
  }
};

const safetyInstructions = `
You are AI Healthcare Assistant for Bangladesh.
You help users understand symptoms, medical reports, and general health questions in Bangla or English.

Safety rules:
- You do not replace doctors and you must never claim that you do.
- Be conservative. Do not over-diagnose. Use "possible" and "may be".
- Prioritize emergency detection and urgent care instructions.
- Keep answers short, clear, and practical for Bangladesh.
- If the user writes Bangla, answer in Bangla. If English, answer in English. If mixed, use simple mixed Bangla-English.
- Do not recommend prescription-only medicine, dosages, or stopping prescribed treatment.
- Encourage consultation with a qualified doctor, especially for persistent, severe, worsening, pregnant, elderly, child, or chronic-disease cases.
- Always include a safety disclaimer.

Return only valid JSON matching the provided schema.
`;

function roleBehavior(role = "patient") {
  const normalized = role === "child_care" ? "guardian" : role === "clinic_admin" ? "super_admin" : role;

  if (normalized === "doctor") {
    return "Audience is a doctor. Use concise clinical language, summarize red flags, likely differentials, recommended evaluation, and avoid patient-facing reassurance.";
  }

  if (normalized === "guardian") {
    return "Audience is a child caregiver. Use simple child-safety language, highlight when pediatric care is urgent, and remind them to contact a pediatric clinician.";
  }

  if (normalized === "super_admin") {
    return "Audience is a system administrator. Do not provide diagnosis. Summarize operational risk and advise routing the case to a qualified clinician.";
  }

  return "Audience is a patient. Use simple, friendly, non-technical language with clear next steps.";
}

function compactProfile(profile = {}) {
  return Object.fromEntries(
    Object.entries(profile).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return value !== undefined && value !== null && value !== "";
    })
  );
}

function limitInput(input = "") {
  const normalized = String(input).replace(/\s+/g, " ").trim();
  if (normalized.length <= env.openaiMaxInputChars) {
    return { text: normalized, truncated: false, originalLength: normalized.length };
  }

  return {
    text: normalized.slice(0, env.openaiMaxInputChars),
    truncated: true,
    originalLength: normalized.length
  };
}

function extractOutputText(response) {
  if (response.output_text) {
    return response.output_text;
  }

  const output = response.output || [];
  const textParts = [];

  for (const item of output) {
    for (const content of item.content || []) {
      if (content.type === "refusal") {
        throw new Error("OpenAI refused to answer this request.");
      }

      if (content.type === "output_text" && content.text) {
        textParts.push(content.text);
      }
    }
  }

  return textParts.join("\n");
}

function parseGuidanceResponse(response) {
  const text = extractOutputText(response);
  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  return JSON.parse(text);
}

function getEmergencySummary(emergency) {
  return emergency?.flags?.length ? emergency.flags.join(", ") : "Emergency red flag symptoms";
}

function deterministicEmergencyGuidance({ input, emergency }) {
  const bangla = isBangla(input);
  const language = detectLanguage(input);

  if (bangla) {
    return {
      guidance: {
        possibleCondition: "জরুরি সতর্কতা: গুরুতর লক্ষণ পাওয়া গেছে",
        riskLevel: "High",
        explanation:
          "আপনার লেখা লক্ষণে জরুরি ঝুঁকির সংকেত পাওয়া গেছে। অনলাইনে আরও ব্যাখ্যার জন্য অপেক্ষা করা নিরাপদ নয়।",
        recommendation:
          "এখনই একজন মানুষকে জানান, একা থাকবেন না, এবং নিকটস্থ হাসপাতাল বা জরুরি বিভাগে যান।",
        emergencyAction: emergencyActionText(true),
        emergencyRequired: true,
        disclaimer:
          "এটি জরুরি নিরাপত্তা নির্দেশনা, ডাক্তারি রোগ নির্ণয়ের বিকল্প নয়।",
        language
      },
      source: "rules",
      warning: getEmergencySummary(emergency)
    };
  }

  return {
    guidance: {
      possibleCondition: "Emergency red flag symptoms detected",
      riskLevel: "High",
      explanation:
        "Your symptoms include emergency warning signs. Waiting for online guidance may be unsafe.",
      recommendation:
        "Tell someone nearby, do not stay alone, and go to the nearest hospital or emergency department now.",
      emergencyAction: emergencyActionText(false),
      emergencyRequired: true,
      disclaimer:
        "This is emergency safety guidance and is not a medical diagnosis or a substitute for a clinician.",
      language
    },
    source: "rules",
    warning: getEmergencySummary(emergency)
  };
}

function fallbackGuidance({ input, emergency, mode, role = "patient", reason = "AI service is unavailable." }) {
  const bangla = isBangla(input);
  const emergencyRequired = Boolean(emergency?.isEmergency);
  const language = detectLanguage(input);
  const normalizedRole = role === "child_care" ? "guardian" : role === "clinic_admin" ? "super_admin" : role;

  if (normalizedRole === "super_admin") {
    return {
      guidance: {
        possibleCondition: "Operational healthcare case review",
        riskLevel: emergencyRequired ? "High" : "Medium",
        explanation:
          "This request should be handled as an administrative monitoring event, not as a clinical diagnosis.",
        recommendation:
          "Route the case to an assigned clinician, review AI usage logs, and prioritize emergency alerts for follow-up.",
        emergencyAction: emergencyRequired ? emergencyActionText(false) : "",
        emergencyRequired,
        disclaimer:
          "Administrative AI summaries do not replace professional medical review.",
        language
      },
      source: "fallback",
      warning: reason
    };
  }

  if (bangla) {
    return {
      guidance: {
        possibleCondition:
          mode === "report_analysis"
            ? "রিপোর্টের ফলাফল বুঝতে ডাক্তারি ব্যাখ্যা প্রয়োজন হতে পারে"
            : "লক্ষণ অনুযায়ী একাধিক কারণ সম্ভব",
        riskLevel: emergencyRequired ? "High" : "Medium",
        explanation:
          "AI পরিষেবা এখন ব্যবহার করা যাচ্ছে না, তাই এটি নিরাপদ fallback উত্তর। আপনার দেওয়া তথ্য সীমিত, তাই নিশ্চিত রোগ নির্ণয় করা সম্ভব নয়।",
        recommendation:
          emergencyRequired
            ? "জরুরি লক্ষণ থাকলে অপেক্ষা করবেন না। দ্রুত নিকটস্থ হাসপাতাল বা জরুরি বিভাগে যান।"
            : "পর্যাপ্ত পানি পান করুন, বিশ্রাম নিন, লক্ষণ লিখে রাখুন, এবং লক্ষণ না কমলে একজন নিবন্ধিত চিকিৎসকের পরামর্শ নিন।",
        emergencyAction: emergencyRequired ? emergencyActionText(true) : "",
        emergencyRequired,
        disclaimer:
          "এটি সাধারণ স্বাস্থ্য তথ্য, ডাক্তারি পরামর্শ বা রোগ নির্ণয়ের বিকল্প নয়।",
        language
      },
      source: "fallback",
      warning: reason
    };
  }

  return {
    guidance: {
      possibleCondition:
        mode === "report_analysis"
          ? "Report findings may need clinical interpretation"
          : "Several causes are possible based on these symptoms",
      riskLevel: emergencyRequired ? "High" : "Medium",
      explanation:
        "This is a safe fallback response because the AI service is currently unavailable. The information provided is limited, so a diagnosis cannot be confirmed.",
      recommendation:
        emergencyRequired
          ? "Do not wait. Go to the nearest hospital or emergency department now."
          : "Rest, stay hydrated when appropriate, track symptoms, and consult a registered clinician if symptoms persist, worsen, or concern you.",
      emergencyAction: emergencyRequired ? emergencyActionText(false) : "",
      emergencyRequired,
      disclaimer:
        "This is general health information and is not a substitute for professional medical advice, diagnosis, or treatment.",
      language
    },
    source: "fallback",
    warning: reason
  };
}

function normalizeGuidance(guidance, input, emergency, mode, role) {
  const fallback = fallbackGuidance({ input, emergency, mode, role }).guidance;
  const riskLevels = new Set(["Low", "Medium", "High"]);
  const languages = new Set(["Bangla", "English", "Mixed"]);

  return {
    possibleCondition: String(guidance?.possibleCondition || fallback.possibleCondition),
    riskLevel: riskLevels.has(guidance?.riskLevel) ? guidance.riskLevel : fallback.riskLevel,
    explanation: String(guidance?.explanation || fallback.explanation),
    recommendation: String(guidance?.recommendation || fallback.recommendation),
    emergencyAction: String(guidance?.emergencyAction || fallback.emergencyAction || ""),
    emergencyRequired: Boolean(guidance?.emergencyRequired || fallback.emergencyRequired),
    disclaimer: String(guidance?.disclaimer || fallback.disclaimer),
    language: languages.has(guidance?.language) ? guidance.language : detectLanguage(input)
  };
}

function applyEmergencyOverride(guidance, emergency, input) {
  if (!emergency?.isEmergency) {
    return guidance;
  }

  return {
    ...guidance,
    riskLevel: "High",
    emergencyRequired: true,
    emergencyAction: guidance.emergencyAction || emergencyActionText(isBangla(input))
  };
}

async function createGuidance({ mode, input, profile = {}, emergency, role = "patient" }) {
  if (emergency?.isEmergency && env.openaiSkipEmergencyAi) {
    return {
      ...deterministicEmergencyGuidance({ input, emergency }),
      model: "rules"
    };
  }

  const client = getOpenAIClient();
  const boundedInput = limitInput(input);

  if (!client) {
    const fallback = fallbackGuidance({
      input,
      emergency,
      mode,
      role,
      reason: "OPENAI_API_KEY is not configured."
    });
    return {
      ...fallback,
      model: env.openaiModel
    };
  }

  const prompt = {
    mode,
    user_input: boundedInput.text,
    input_was_truncated: boundedInput.truncated,
    original_input_length: boundedInput.originalLength,
    request_role: role,
    role_behavior: roleBehavior(role),
    user_profile: compactProfile(profile),
    deterministic_emergency_detection: {
      isEmergency: Boolean(emergency?.isEmergency),
      flags: emergency?.flags || [],
      matchedTerms: emergency?.matchedTerms || []
    },
    output_sections: [
      "Possible Condition",
      "Risk Level",
      "Explanation",
      "Recommendation",
      "Emergency Action"
    ]
  };

  try {
    const response = await client.responses.create({
      model: env.openaiModel,
      instructions: safetyInstructions,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(prompt)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "healthcare_guidance",
          strict: true,
          schema: guidanceSchema
        }
      },
      temperature: 0.1,
      max_output_tokens: 700
    });

    const parsed = parseGuidanceResponse(response);
    const normalized = normalizeGuidance(parsed, input, emergency, mode, role);

    return {
      guidance: applyEmergencyOverride(normalized, emergency, input),
      source: "openai",
      model: env.openaiModel,
      warning: boundedInput.truncated ? "Input was truncated before AI analysis." : undefined
    };
  } catch (error) {
    console.error("OpenAI guidance generation failed:", error.message);
    const fallback = fallbackGuidance({
      input,
      emergency,
      mode,
      role,
      reason: "OpenAI request failed; returned safe fallback guidance."
    });

    return {
      ...fallback,
      model: env.openaiModel
    };
  }
}

export async function assessSymptoms({ symptoms, profile = {}, emergency, role = "patient" }) {
  return createGuidance({
    mode: "symptom_check",
    input: symptoms,
    profile,
    emergency,
    role
  });
}

export async function answerHealthQuestion({ message, profile = {}, emergency, role = "patient" }) {
  return createGuidance({
    mode: "medical_chat",
    input: message,
    profile,
    emergency,
    role
  });
}

export async function analyzeReportText({ reportText, profile = {}, emergency, role = "patient" }) {
  return createGuidance({
    mode: "report_analysis",
    input: reportText,
    profile,
    emergency,
    role
  });
}
