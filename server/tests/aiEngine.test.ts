import { describe, expect, it } from "@jest/globals";

import type { ComplaintDocument } from "../src/models/Complaint";

import { detectDuplicateComplaint } from "../src/ai-engine/duplicateDetector";
import { runAiPipeline, type ComplaintPriority } from "../src/ai-engine/pipeline";
import type { ComplaintCategory } from "../src/ai-engine/constants";

const buildComplaint = (
  complaintId: string,
  title: string,
  description: string,
): ComplaintDocument => {
  return {
    complaintId,
    title,
    description,
  } as unknown as ComplaintDocument;
};

describe("civic AI engine", () => {
  const baselineComplaints = [
    buildComplaint(
      "CMP-1001",
      "Garbage not collected near school",
      "Garbage not collected for four days and very bad smell outside the school gate",
    ),
    buildComplaint(
      "CMP-1002",
      "Streetlight dead near park",
      "Streetlight not working and road is dark every night near the public park",
    ),
    buildComplaint(
      "CMP-1003",
      "Water leak by market road",
      "Water leakage near the main road has made the road slippery",
    ),
    buildComplaint(
      "CMP-1004",
      "Drain overflow in lane",
      "Drain overflow is causing mosquitoes and sewage smell in the lane",
    ),
  ];

  const classificationCases: Array<{
    input: string;
    expectedCategory: ComplaintCategory;
    expectedDepartment: string;
    expectedPriority: ComplaintPriority;
  }> = [
    {
      input: "Garbage not collected for 5 days, very bad smell",
      expectedCategory: "garbage",
      expectedDepartment: "Sanitation Department",
      expectedPriority: "Medium",
    },
    {
      input: "Streetlight not working, very dangerous at night",
      expectedCategory: "streetlight",
      expectedDepartment: "Electrical Maintenance",
      expectedPriority: "High",
    },
    {
      input: "Water leakage near main road",
      expectedCategory: "water",
      expectedDepartment: "Water Supply Department",
      expectedPriority: "High",
    },
    {
      input: "Drain overflow causing mosquito issue",
      expectedCategory: "drainage",
      expectedDepartment: "Drainage Department",
      expectedPriority: "High",
    },
  ];

  it.each(classificationCases)(
    "classifies '$input' into the expected civic workflow",
    ({ input, expectedCategory, expectedDepartment, expectedPriority }) => {
      const result = runAiPipeline({
        title: input,
        description: input,
        existingComplaints: baselineComplaints,
      });

      expect(result.category).toBe(expectedCategory);
      expect(result.department).toBe(expectedDepartment);
      expect(result.priority).toBe(expectedPriority);
      expect(result.categoryConfidence).toBeGreaterThan(0.5);
      expect(result.sentimentScore).toBeGreaterThanOrEqual(0);
      expect(result.sentimentScore).toBeLessThanOrEqual(1);
      expect(result.severityScore).toBeGreaterThanOrEqual(0);
      expect(result.severityScore).toBeLessThanOrEqual(100);
    },
  );

  it("detects exact duplicates, enforces the top-5 related limit, and exposes the final output shape", () => {
    const duplicatePool = Array.from({ length: 6 }, (_, index) =>
      buildComplaint(
        `CMP-${index + 1}`,
        "Garbage not collected for 5 days",
        "Very bad smell near school gate because garbage is still lying there",
      ),
    );

    const duplicateResult = detectDuplicateComplaint(
      "Garbage not collected for 5 days, very bad smell near school gate",
      duplicatePool,
    );

    expect(duplicateResult.duplicateScore).toBeGreaterThan(0.85);
    expect(duplicateResult.isDuplicate).toBe(true);
    expect(duplicateResult.relatedComplaintIds).toHaveLength(5);
    expect(duplicateResult.relatedComplaintIds).toEqual(["CMP-1", "CMP-2", "CMP-3", "CMP-4", "CMP-5"]);

    const pipelineResult = runAiPipeline({
      title: "Garbage not collected for 5 days, very bad smell near school gate",
      description: "Please fix this asap, the waste pile is getting worse.",
      existingComplaints: duplicatePool,
    });

    expect(pipelineResult).toEqual(
      expect.objectContaining({
        category: expect.any(String),
        department: expect.any(String),
        categoryConfidence: expect.any(Number),
        priority: expect.stringMatching(/^(Low|Medium|High)$/),
        sentimentScore: expect.any(Number),
        duplicateScore: expect.any(Number),
        severityScore: expect.any(Number),
        isDuplicate: expect.any(Boolean),
        relatedComplaintIds: expect.any(Array),
      }),
    );
  });
});
