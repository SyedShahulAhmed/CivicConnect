import cron from "node-cron";

import { ComplaintModel } from "../models/Complaint";

export const runSlaSweep = async (): Promise<number> => {
  const now = new Date();
  const overdueComplaints = await ComplaintModel.find({
    status: { $ne: "Resolved" },
    slaDeadline: { $lt: now },
  });

  await Promise.all(
    overdueComplaints.map(async (complaint) => {
      complaint.severityScore = Math.min(100, complaint.severityScore + 10);
      await complaint.save();
    }),
  );

  return overdueComplaints.length;
};

export const startSlaMonitor = (): void => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      await runSlaSweep();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("SLA monitor failed", error);
    }
  });
};

