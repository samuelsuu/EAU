// utils/normalizeFreelancerData.ts
export const normalizeFreelancerData = (freelancers: any[]) => {
  if (!Array.isArray(freelancers)) return [];

  return freelancers.map((f: any) => ({
    ...f,
    // ✅ Flatten nested fields that might be objects
    location:
      typeof f.location === "object"
        ? f.location.name || f.location.slug || ""
        : f.location || "",
    category:
      typeof f.category === "object"
        ? f.category.name || f.category.slug || ""
        : f.category || "",
    profession:
      typeof f.profession === "object"
        ? f.profession.name || f.profession.slug || ""
        : f.profession || "",
    // Example: normalize rating or id if needed
    rating: typeof f.rating === "string" ? parseFloat(f.rating) : f.rating,
  }));
};
