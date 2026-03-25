export const complaintCategories = [
  "garbage",
  "water",
  "electricity",
  "road",
  "drainage",
  "streetlight",
  "traffic",
  "public_transport",
  "park",
  "encroachment",
  "pollution",
  "stray_animals",
] as const;

export type ComplaintCategory = (typeof complaintCategories)[number];

export const departmentByCategory: Record<ComplaintCategory, string> = {
  garbage: "Sanitation Department",
  water: "Water Supply Department",
  electricity: "Electricity Board",
  road: "Roads & Infrastructure Department",
  drainage: "Drainage Department",
  streetlight: "Electrical Maintenance",
  traffic: "Traffic Police",
  public_transport: "Transport Department",
  park: "Parks & Recreation",
  encroachment: "Municipal Enforcement",
  pollution: "Environmental Department",
  stray_animals: "Animal Control",
};

export const categoryImportanceByCategory: Record<ComplaintCategory, number> = {
  garbage: 0.55,
  water: 0.78,
  electricity: 0.88,
  road: 0.62,
  drainage: 0.84,
  streetlight: 0.74,
  traffic: 0.86,
  public_transport: 0.58,
  park: 0.35,
  encroachment: 0.48,
  pollution: 0.72,
  stray_animals: 0.6,
};

export type ComplaintDepartment = (typeof departmentByCategory)[ComplaintCategory];
