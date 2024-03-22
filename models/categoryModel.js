import mongoose, { Schema } from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      // unique: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant", // assuming you have a Tenant model
      required: true,
    },
    // Add any other fields you may need
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
