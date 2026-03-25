import type { ComplaintDocument } from "../models/Complaint";

import { countTokenFrequency, extractComplaintFeatures } from "./textUtils";

const cosineSimilarity = (left: Map<string, number>, right: Map<string, number>) => {
  const terms = new Set([...left.keys(), ...right.keys()]);
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  terms.forEach((term) => {
    const leftValue = left.get(term) || 0;
    const rightValue = right.get(term) || 0;
    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  });

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

const sharedFeatureCount = (left: string[], right: string[]) => {
  const rightSet = new Set(right);
  return [...new Set(left)].filter((token) => rightSet.has(token)).length;
};

const overlapScore = (left: string[], right: string[]) => {
  const intersection = sharedFeatureCount(left, right);

  if (intersection === 0) {
    return 0;
  }

  return intersection / Math.min(new Set(left).size || 1, new Set(right).size || 1);
};

const jaccardScore = (left: string[], right: string[]) => {
  const intersection = sharedFeatureCount(left, right);
  const union = new Set([...left, ...right]).size || 1;

  return intersection / union;
};

const sharedBigramCount = (left: string[], right: string[]) => {
  const rightSet = new Set(right.filter((token) => token.includes("_")));
  return [...new Set(left.filter((token) => token.includes("_")))].filter((token) => rightSet.has(token)).length;
};

const buildTfidfVector = (
  tokens: string[],
  documentFrequency: Map<string, number>,
  documentCount: number,
): Map<string, number> => {
  const tf = countTokenFrequency(tokens);
  const maxFrequency = Math.max(...tf.values(), 1);
  const vector = new Map<string, number>();

  tf.forEach((count, term) => {
    const normalizedTf = 0.5 + (0.5 * count) / maxFrequency;
    const idf = Math.log((documentCount + 1) / ((documentFrequency.get(term) || 0) + 1)) + 1;
    vector.set(term, normalizedTf * idf);
  });

  return vector;
};

export const detectDuplicateComplaint = (
  inputText: string,
  complaints: ComplaintDocument[],
): {
  duplicateScore: number;
  isDuplicate: boolean;
  relatedComplaintIds: string[];
  similarComplaintCount: number;
} => {
  const targetFeatures = extractComplaintFeatures(inputText);
  const complaintDocuments = complaints.map((complaint) => ({
    complaintId: complaint.complaintId,
    features: extractComplaintFeatures(`${complaint.title} ${complaint.title} ${complaint.description}`),
  }));
  const documentFrequency = new Map<string, number>();
  const allDocuments = [targetFeatures, ...complaintDocuments.map((complaint) => complaint.features)];

  allDocuments.forEach((tokens) => {
    new Set(tokens).forEach((token) => {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    });
  });

  const documentCount = allDocuments.length;
  const targetVector = buildTfidfVector(targetFeatures, documentFrequency, documentCount);
  const rankedMatches = complaintDocuments
    .map((complaint) => {
      const complaintVector = buildTfidfVector(complaint.features, documentFrequency, documentCount);
      const cosine = cosineSimilarity(targetVector, complaintVector);
      const overlap = overlapScore(targetFeatures, complaint.features);
      const jaccard = jaccardScore(targetFeatures, complaint.features);
      const overlapBonus = Math.min(sharedFeatureCount(targetFeatures, complaint.features) / 100, 0.05);
      const bigramBonus = Math.min(sharedBigramCount(targetFeatures, complaint.features) / 40, 0.05);
      const score = Math.min(1, cosine * 0.35 + overlap * 0.45 + jaccard * 0.2 + overlapBonus + bigramBonus);

      return {
        complaintId: complaint.complaintId,
        score,
      };
    })
    .sort((left, right) => right.score - left.score);

  const topScore = rankedMatches[0]?.score || 0;
  const similarMatches = rankedMatches.filter((match) => match.score > 0.65);

  return {
    duplicateScore: Number(topScore.toFixed(4)),
    isDuplicate: topScore > 0.85,
    relatedComplaintIds: similarMatches.slice(0, 5).map((match) => match.complaintId),
    similarComplaintCount: similarMatches.length,
  };
};
