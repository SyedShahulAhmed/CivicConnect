const stopwordList = [
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "but",
  "by",
  "for",
  "from",
  "had",
  "has",
  "have",
  "i",
  "in",
  "into",
  "is",
  "it",
  "its",
  "me",
  "my",
  "near",
  "of",
  "on",
  "our",
  "please",
  "pls",
  "than",
  "that",
  "the",
  "their",
  "there",
  "this",
  "to",
  "too",
  "was",
  "we",
  "were",
  "with",
];

export const stopwords = new Set<string>(stopwordList);

const phraseSynonyms: Array<[RegExp, string]> = [
  [/\btrash\b/g, "garbage"],
  [/\brubbish\b/g, "garbage"],
  [/\bwaste pile\b/g, "garbage dump"],
  [/\bpower cut\b/g, "power outage"],
  [/\bpower cuts\b/g, "power outage"],
  [/\bpower failure\b/g, "power outage"],
  [/\bblackout\b/g, "power outage"],
  [/\bcurrent gone\b/g, "power outage"],
  [/\bwater leak\b/g, "water leakage"],
  [/\bwater leaking\b/g, "water leakage"],
  [/\bpipe burst\b/g, "burst pipe"],
  [/\bpotholes\b/g, "pothole"],
  [/\bstreet lights\b/g, "streetlight"],
  [/\bstreet light\b/g, "streetlight"],
  [/\blight pole\b/g, "streetlight pole"],
  [/\bbus stop\b/g, "bus_stop"],
  [/\bmetro station\b/g, "metro_station"],
  [/\bdogs\b/g, "dog"],
  [/\bpuppies\b/g, "puppy"],
  [/\bcows\b/g, "cow"],
  [/\bmonkeys\b/g, "monkey"],
  [/\bstray dog\b/g, "stray animal dog"],
  [/\bstray dogs\b/g, "stray animal dog"],
  [/\bencroachments\b/g, "encroachment"],
  [/\boccupied\b/g, "encroached"],
];

const singularizeToken = (token: string): string => {
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("ses") && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && token.length > 4 && !/(ss|us|is|ous)$/.test(token)) {
    return token.slice(0, -1);
  }

  return token;
};

export const normalizeComplaintText = (text: string): string => {
  let normalized = text.toLowerCase();

  phraseSynonyms.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });

  return normalized.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
};

export const tokenizeComplaintText = (
  text: string,
  { removeStopwords = true }: { removeStopwords?: boolean } = {},
): string[] => {
  const tokens = normalizeComplaintText(text)
    .split(" ")
    .map((token) => singularizeToken(token.trim()))
    .filter((token) => token.length > 1);

  if (!removeStopwords) {
    return tokens;
  }

  return tokens.filter((token) => !stopwords.has(token));
};

export const buildNgrams = (tokens: string[], size = 2): string[] => {
  if (size < 2 || tokens.length < size) {
    return [];
  }

  const ngrams: string[] = [];

  for (let index = 0; index <= tokens.length - size; index += 1) {
    ngrams.push(tokens.slice(index, index + size).join("_"));
  }

  return ngrams;
};

export const extractComplaintFeatures = (
  text: string,
  {
    removeStopwords = true,
    includeBigrams = true,
  }: {
    removeStopwords?: boolean;
    includeBigrams?: boolean;
  } = {},
): string[] => {
  const tokens = tokenizeComplaintText(text, { removeStopwords });

  if (!includeBigrams) {
    return tokens;
  }

  return [...tokens, ...buildNgrams(tokens, 2)];
};

export const countTokenFrequency = (tokens: string[]): Map<string, number> => {
  const counts = new Map<string, number>();

  tokens.forEach((token) => {
    counts.set(token, (counts.get(token) || 0) + 1);
  });

  return counts;
};
