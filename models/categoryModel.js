
import mongoose, { Schema } from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  // Add any other fields you may need
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
