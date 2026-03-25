import type { ComplaintDocument } from "../models/Complaint";

import {
  categoryImportanceByCategory,
  complaintCategories,
  departmentByCategory,
  type ComplaintCategory,
} from "./constants";
import { classifyCategory } from "./classifier";
import { detectDuplicateComplaint } from "./duplicateDetector";
import { analyzeUrgencySignals, predictSentimentScore } from "./sentiment";
import { normalizeComplaintText } from "./textUtils";

export type { ComplaintCategory } from "./constants";
export type ComplaintPriority = "Low" | "Medium" | "High";

const dangerKeywords = [
  "dangerous",
  "accident",
  "fire",
  "sewage",
  "spark",
  "electrocution",
  "unsafe",
  "life threatening",
  "overflow",
  "overflowing",
];

const infrastructureCategories = new Set<ComplaintCategory>([
  "road",
  "garbage",
  "streetlight",
  "public_transport",
]);

const isComplaintCategory = (value: string | undefined): value is ComplaintCategory => {
  return Boolean(value && (complaintCategories as readonly string[]).includes(value));
};

const priorityFromDecisionTree = ({
  category,
  sentimentScore,
  duplicateScore,
  similarComplaintCount,
  urgencySignalScore,
  text,
}: {
  category: ComplaintCategory;
  sentimentScore: number;
  duplicateScore: number;
  similarComplaintCount: number;
  urgencySignalScore: number;
  text: string;
}): ComplaintPriority => {
  const normalizedText = normalizeComplaintText(text);
  const hasDangerSignal = dangerKeywords.some((keyword) => normalizedText.includes(keyword));
  const categoryImportance = categoryImportanceByCategory[category];
  const repeatedIssue = duplicateScore > 0.65 || similarComplaintCount >= 2;

  if (
    hasDangerSignal ||
    normalizedText.includes("electric spark") ||
    sentimentScore > 0.8 ||
    duplicateScore > 0.85 ||
    urgencySignalScore > 0.72 ||
    (categoryImportance >= 0.8 && urgencySignalScore > 0.55)
  ) {
    return "High";
  }

  if (
    repeatedIssue ||
    infrastructureCategories.has(category) ||
    sentimentScore > 0.45 ||
    urgencySignalScore > 0.4 ||
    categoryImportance >= 0.55
  ) {
    return "Medium";
  }

  return "Low";
};

const priorityWeights: Record<ComplaintPriority, number> = {
  Low: 15,
  Medium: 38,
  High: 62,
};

const computeSeverityScore = ({
  category,
  priority,
  sentimentScore,
  duplicateScore,
  similarComplaintCount,
  urgencySignalScore,
}: {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  sentimentScore: number;
  duplicateScore: number;
  similarComplaintCount: number;
  urgencySignalScore: number;
}) => {
  const priorityContribution = priorityWeights[priority];
  const categoryContribution = categoryImportanceByCategory[category] * 8;
  const sentimentContribution = sentimentScore * 14;
  const duplicateContribution = duplicateScore * 10;
  const frequencyContribution = Math.min(similarComplaintCount, 5) * 3;
  const urgencyContribution = urgencySignalScore * 14;

  return Math.min(
    100,
    Math.round(
      priorityContribution +
        categoryContribution +
        sentimentContribution +
        duplicateContribution +
        frequencyContribution +
        urgencyContribution,
    ),
  );
};

export const runAiPipeline = ({
  title,
  description,
  existingComplaints,
  categoryHint,
}: {
  title: string;
  description: string;
  existingComplaints: ComplaintDocument[];
  categoryHint?: string;
}) => {
  const combinedText = `${title} ${description}`.trim();
  const classified = classifyCategory(combinedText);
  const hintedCategory = isComplaintCategory(categoryHint) ? categoryHint : undefined;
  const category = hintedCategory ?? classified.category;
  const department = hintedCategory ? departmentByCategory[hintedCategory] : classified.department;
  const sentimentScore = predictSentimentScore(combinedText);
  const urgencyAnalysis = analyzeUrgencySignals(combinedText);
  const duplicateResult = detectDuplicateComplaint(combinedText, existingComplaints);
  const priority = priorityFromDecisionTree({
    category,
    sentimentScore,
    duplicateScore: duplicateResult.duplicateScore,
    similarComplaintCount: duplicateResult.similarComplaintCount,
    urgencySignalScore: urgencyAnalysis.urgencySignalScore,
    text: combinedText,
  });
  const severityScore = computeSeverityScore({
    category,
    priority,
    sentimentScore,
    duplicateScore: duplicateResult.duplicateScore,
    similarComplaintCount: duplicateResult.similarComplaintCount,
    urgencySignalScore: urgencyAnalysis.urgencySignalScore,
  });

  return {
    category,
    department,
    categoryConfidence: hintedCategory
      ? Number(Math.max(classified.confidence, hintedCategory === classified.category ? 0.995 : 0.96).toFixed(4))
      : classified.confidence,
    priority,
    sentimentScore,
    duplicateScore: duplicateResult.duplicateScore,
    severityScore,
    isDuplicate: duplicateResult.isDuplicate,
    relatedComplaintIds: duplicateResult.relatedComplaintIds,
  };
};
