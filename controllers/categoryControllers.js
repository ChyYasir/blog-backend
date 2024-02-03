import Category from "../models/categoryModel.js";

export const addCategory = async (req, res) => {
  try {
    const { name, tenantId } = req.body;

    // Check if the category with the same name and tenantId already exists
    const existingCategory = await Category.findOne({ name, tenantId });

    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Category already exists for this tenant" });
    }

    // If the category doesn't exist, save the new category
    const category = new Category({ name, tenantId });
    await category.save();

    res.status(201).json({ message: "Category added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Categories
export const getCategories = async (req, res) => {
  try {
    const { tenantId } = req.query; // Get tenantId from query parameters
    const categories = await Category.find({ tenantId });
    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
