const banglaPattern = /[\u0980-\u09FF]/;
const latinPattern = /[A-Za-z]/;

export function detectLanguage(input = "") {
  const hasBangla = banglaPattern.test(input);
  const hasEnglish = latinPattern.test(input);

  if (hasBangla && hasEnglish) {
    return "Mixed";
  }

  return hasBangla ? "Bangla" : "English";
}

export function isBangla(input = "") {
  const language = detectLanguage(input);
  return language === "Bangla" || language === "Mixed";
}
