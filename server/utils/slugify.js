// "Men's T-Shirt" -> "men-s-t-shirt"
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Slug pehle se maujood ho to -2, -3 laga deta hai
const generateUniqueSlug = async (Model, name, excludeId = null) => {
  const base = slugify(name) || "item";
  let slug = base;
  let count = 1;

  while (
    await Model.exists({
      slug,
      ...(excludeId && { _id: { $ne: excludeId } }),
    })
  ) {
    count++;
    slug = `${base}-${count}`;
  }
  return slug;
};

module.exports = { slugify, generateUniqueSlug };