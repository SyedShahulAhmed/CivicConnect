import trainingDataRaw from "./trainingData.json";
import {
  complaintCategories,
  departmentByCategory,
  type ComplaintCategory,
  type ComplaintDepartment,
} from "./constants";
import { extractComplaintFeatures } from "./textUtils";

type TrainingDataEntry = {
  category: ComplaintCategory;
  department: ComplaintDepartment;
  samples: string[];
};

type CategoryModel = {
  category: ComplaintCategory;
  department: ComplaintDepartment;
  counts: Map<string, number>;
  totalFeatureWeight: number;
  prior: number;
};

const isComplaintCategory = (value: string): value is ComplaintCategory => {
  return (complaintCategories as readonly string[]).includes(value);
};

const isTrainingDataEntry = (entry: unknown): entry is TrainingDataEntry => {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const candidate = entry as Partial<TrainingDataEntry>;

  return Boolean(
    typeof candidate.category === "string" &&
      isComplaintCategory(candidate.category) &&
      candidate.department === departmentByCategory[candidate.category] &&
      Array.isArray(candidate.samples) &&
      candidate.samples.every((sample) => typeof sample === "string" && sample.trim().length >= 4),
  );
};

const trainingData = (trainingDataRaw as unknown[]).filter(isTrainingDataEntry);

if (trainingData.length === 0) {
  throw new Error("AI training data is missing or invalid.");
}

const vocabulary = new Set<string>();
const totalSamples = trainingData.reduce((sum, entry) => sum + entry.samples.length, 0);

const categoryModels: CategoryModel[] = trainingData.map((entry) => {
  const counts = new Map<string, number>();
  let totalFeatureWeight = 0;

  entry.samples.forEach((sample) => {
    extractComplaintFeatures(sample).forEach((feature) => {
      const weight = feature.includes("_") ? 1.35 : 1;
      counts.set(feature, (counts.get(feature) || 0) + weight);
      totalFeatureWeight += weight;
      vocabulary.add(feature);
    });
  });

  return {
    category: entry.category,
    department: entry.department,
    counts,
    totalFeatureWeight,
    prior: entry.samples.length / totalSamples,
  };
});

const toConfidenceScore = (scores: Array<{ score: number }>) => {
  const maxScore = Math.max(...scores.map((entry) => entry.score));
  const normalized = scores.map((entry) => Math.exp(entry.score - maxScore));
  const total = normalized.reduce((sum, value) => sum + value, 0) || 1;
  const probabilities = normalized.map((value) => value / total).sort((left, right) => right - left);
  const topProbability = probabilities[0] || 0;
  const runnerUpProbability = probabilities[1] || 0;
  const margin = topProbability - runnerUpProbability;

  return Number(Math.min(0.9999, Math.max(0.4, topProbability + margin * 0.35)).toFixed(4));
};

export const classifyCategory = (
  text: string,
): {
  category: ComplaintCategory;
  department: ComplaintDepartment;
  confidence: number;
} => {
  const features = extractComplaintFeatures(text);
  const fallback = categoryModels[0];

  if (!fallback) {
    throw new Error("No trained category models were built.");
  }

  if (features.length === 0) {
    return {
      category: fallback.category,
      department: fallback.department,
      confidence: 0.4,
    };
  }

  const vocabularySize = vocabulary.size || 1;
  const scores = categoryModels.map((entry) => {
    const logScore = features.reduce((score, feature) => {
      const featureCount = entry.counts.get(feature) || 0;
      const featureWeight = feature.includes("_") ? 1.15 : 1;

      return score + Math.log((featureCount + 1) / (entry.totalFeatureWeight + vocabularySize)) * featureWeight;
    }, Math.log(entry.prior || 1 / categoryModels.length));

    return {
      category: entry.category,
      department: entry.department,
      score: logScore,
    };
  });

  const bestMatch = scores.reduce((best, current) => {
    return current.score > best.score ? current : best;
  });

  return {
    category: bestMatch.category,
    department: bestMatch.department,
    confidence: toConfidenceScore(scores),
  };
};
