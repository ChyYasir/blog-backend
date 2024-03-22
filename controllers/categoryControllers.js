import Category from "../models/categoryModel.js";

export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const { tenantId } = req.body.tenant;

    // Check if the tenant already has 15 categories
    const tenantCategoriesCount = await Category.countDocuments({ tenantId });

    if (tenantCategoriesCount >= 10) {
      return res
        .status(400)
        .json({ message: "You Have Reached Limit of 10 Categories" });
    }

    // Check if the category with the same name and tenantId already exists
    const existingCategory = await Category.findOne({ name, tenantId });

    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "This Category is Already Exists" });
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
// Delete Category

export const getAdminCategories = async (req, res) => {
  const { tenantId } = req.body.tenant;
  console.log(tenantId);
  try {
    const categories = await Category.find({ tenantId });
    console.log(categories);
    res.status(200).json({ categories: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Can Not Fetch Categories" });
  }
};
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.body.tenant;

    const deletedCategory = await Category.findOneAndDelete({
      _id: id,
      tenantId,
    });

    if (!deletedCategory) {
      return res
        .status(404)
        .json({ message: "Category not found for this tenant" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//edit category
export const editCategory = async (req, res) => {
  const { id } = req.params; // The ID of the category to be updated
  const { name } = req.body; // The new name of the category
  const { tenantId } = req.body.tenant; // Tenant ID from the request body
  console.log({ name, tenantId });
  try {
    // Check if a different category with the same new name already exists for this tenant
    const existingCategory = await Category.findOne({
      name,
      tenantId,
      _id: { $ne: id }, // $ne operator to exclude the category being updated from the search
    });

    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Category with this name already exists" });
    }

    // Find the category by ID and tenantId, and update it with the new name
    const updatedCategory = await Category.findOneAndUpdate(
      { _id: id, tenantId },
      { name },
      { new: true } // Return the updated document
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
