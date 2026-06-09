const emergencyPatterns = [
  {
    flag: "Possible heart attack or severe cardiac symptom",
    terms: [
      "chest pain",
      "chest pressure",
      "heart attack",
      "pain radiating to arm",
      " বুক ব্যথা",
      "বুকব্যথা",
      "বুকে চাপ",
      "হার্ট অ্যাটাক"
    ]
  },
  {
    flag: "Serious breathing difficulty",
    terms: [
      "difficulty breathing",
      "shortness of breath",
      "cannot breathe",
      "breathing issue",
      "wheezing badly",
      "শ্বাসকষ্ট",
      "শ্বাস নিতে কষ্ট",
      "শ্বাস বন্ধ",
      "দম বন্ধ"
    ]
  },
  {
    flag: "Possible stroke symptoms",
    terms: [
      "stroke",
      "face drooping",
      "arm weakness",
      "slurred speech",
      "sudden confusion",
      "মুখ বেঁকে",
      "হাত দুর্বল",
      "কথা জড়িয়ে",
      "স্ট্রোক"
    ]
  },
  {
    flag: "Loss of consciousness or seizure",
    terms: [
      "unconscious",
      "fainted",
      "seizure",
      "convulsion",
      "not responding",
      "অজ্ঞান",
      "খিঁচুনি",
      "জ্ঞান নেই"
    ]
  },
  {
    flag: "Severe bleeding or trauma",
    terms: [
      "heavy bleeding",
      "uncontrolled bleeding",
      "severe injury",
      "major accident",
      "রক্তপাত",
      "অনেক রক্ত",
      "দুর্ঘটনা"
    ]
  },
  {
    flag: "Pregnancy emergency symptom",
    terms: [
      "pregnancy bleeding",
      "pregnant bleeding",
      "severe abdominal pain pregnant",
      "গর্ভাবস্থায় রক্তপাত",
      "গর্ভবতী রক্তপাত"
    ]
  },
  {
    flag: "Severe allergic reaction",
    terms: [
      "anaphylaxis",
      "swollen throat",
      "swelling lips",
      "swelling tongue",
      "allergic reaction breathing",
      "গলা ফুলে",
      "জিহ্বা ফুলে",
      "অ্যালার্জি শ্বাসকষ্ট"
    ]
  },
  {
    flag: "Possible self-harm risk",
    terms: [
      "suicidal",
      "kill myself",
      "end my life",
      "self harm",
      "নিজেকে মেরে ফেল",
      "আত্মহত্যা",
      "নিজেকে ক্ষতি"
    ]
  }
];

function normalize(input = "") {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function isNegated(normalizedInput, normalizedTerm) {
  const index = normalizedInput.indexOf(normalizedTerm);
  if (index === -1) {
    return false;
  }

  const before = normalizedInput.slice(Math.max(0, index - 28), index).trim();
  const after = normalizedInput.slice(index + normalizedTerm.length, index + normalizedTerm.length + 16).trim();
  const englishNegationMatch = before.match(/\b(no|not|never|without|deny|denies|denied)\b[^.!?;]*$/i);
  const englishNegation =
    Boolean(englishNegationMatch) && !/\b(but|however|except)\b/i.test(englishNegationMatch[0]);
  const banglaNegation = /^(নেই|না|হয়নি|করছে না|নাই)(\s|$)/.test(after);

  return englishNegation || banglaNegation;
}

export function detectEmergency(input = "") {
  const normalizedInput = ` ${normalize(input)} `;
  const flags = [];
  const matchedTerms = [];

  for (const pattern of emergencyPatterns) {
    const matched = pattern.terms.filter((term) => {
      const normalizedTerm = normalize(term);
      return normalizedInput.includes(normalizedTerm) && !isNegated(normalizedInput, normalizedTerm);
    });
    if (matched.length > 0) {
      flags.push(pattern.flag);
      matchedTerms.push(...matched.map((term) => term.trim()));
    }
  }

  return {
    isEmergency: flags.length > 0,
    riskLevel: flags.length > 0 ? "High" : "Low",
    flags,
    matchedTerms: [...new Set(matchedTerms)]
  };
}

export function emergencyActionText(isBangla = false) {
  if (isBangla) {
    return "এটি জরুরি হতে পারে। এখনই নিকটস্থ হাসপাতাল/ইমার্জেন্সিতে যান অথবা স্থানীয় জরুরি নম্বরে কল করুন। একা থাকলে আশেপাশের কাউকে সাহায্যের জন্য ডাকুন।";
  }

  return "This may be an emergency. Go to the nearest hospital/emergency department now or call local emergency services. If alone, ask someone nearby for help immediately.";
}
