import { normalizeComplaintText, tokenizeComplaintText } from "./textUtils";

const calmingWeights: Record<string, number> = {
  thanks: -1.2,
  appreciate: -1.1,
  resolved: -1.4,
  fixed: -1.1,
  manageable: -0.6,
  minor: -0.5,
  small: -0.4,
  please: -0.2,
};

const urgencyWeights: Record<string, number> = {
  urgent: 1.8,
  dangerous: 2.4,
  danger: 2.2,
  accident: 2.4,
  fire: 2.8,
  spark: 2.3,
  sparking: 2.4,
  sewage: 2.2,
  overflow: 1.7,
  overflowing: 1.8,
  leakage: 1.3,
  leaking: 1.3,
  blocked: 1.2,
  outage: 2,
  unsafe: 2.2,
  dark: 1.2,
  slippery: 1.1,
  electrocution: 3,
  smoke: 1.7,
  smell: 1,
  foul: 1.1,
  mosquito: 1.1,
  flooding: 1.6,
  flooded: 1.6,
  broken: 1.2,
  crack: 1,
  jam: 1,
  traffic: 0.6,
  bite: 2.1,
  aggressive: 1.6,
  dead: 1.1,
  sick: 1.5,
  unbearable: 1.7,
  horrible: 1.4,
  terrible: 1.6,
  angry: 1.4,
  immediately: 1.8,
};

const intensityModifiers: Record<string, number> = {
  very: 1.15,
  really: 1.12,
  extremely: 1.35,
  badly: 1.18,
  seriously: 1.2,
  highly: 1.2,
  too: 1.08,
  immediately: 1.3,
  urgently: 1.25,
};

const urgencyPhraseWeights: Record<string, number> = {
  asap: 2.6,
  "right now": 2.3,
  "immediately": 2.1,
  "life threatening": 3.6,
  "very dangerous": 2.8,
  "electric spark": 2.8,
  "not safe": 2.2,
  "need action": 1.8,
  "for 5 days": 1.2,
  "for almost a week": 1.1,
  "since midnight": 1.1,
  "since morning": 0.8,
  "getting worse": 1.4,
  "can't wait": 2.1,
  "cannot wait": 2.1,
};

const sigmoid = (value: number): number => 1 / (1 + Math.exp(-value));

export const analyzeUrgencySignals = (text: string) => {
  const normalizedText = normalizeComplaintText(text);
  const tokens = tokenizeComplaintText(text, { removeStopwords: false });
  const matchedKeywords = new Set<string>();
  const matchedPhrases = new Set<string>();
  let rawScore = -1.5;
  let intensityHits = 0;

  Object.entries(urgencyPhraseWeights).forEach(([phrase, weight]) => {
    if (normalizedText.includes(phrase)) {
      rawScore += weight;
      matchedPhrases.add(phrase);
    }
  });

  tokens.forEach((token, index) => {
    const previousToken = tokens[index - 1];
    const currentWeight = urgencyWeights[token] || calmingWeights[token] || 0;

    if (currentWeight === 0) {
      return;
    }

    let multiplier = 1;

    if (previousToken && intensityModifiers[previousToken]) {
      multiplier *= intensityModifiers[previousToken];
      intensityHits += 1;
    }

    if (urgencyWeights[token]) {
      matchedKeywords.add(token);
    }

    rawScore += currentWeight * multiplier;
  });

  const exclamationBoost = Math.min((text.match(/!/g) || []).length * 0.12, 0.5);
  const uppercaseBoost = /\b[A-Z]{3,}\b/.test(text) ? 0.25 : 0;
  rawScore += exclamationBoost + uppercaseBoost;

  const urgencySignalScore = Number(sigmoid((rawScore - 0.6) / 2.4).toFixed(4));

  return {
    urgencySignalScore,
    matchedKeywords: [...matchedKeywords],
    matchedPhrases: [...matchedPhrases],
    intensityHits,
  };
};

export const predictSentimentScore = (text: string): number => {
  return analyzeUrgencySignals(text).urgencySignalScore;
};
