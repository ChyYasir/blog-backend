import mongoose, { Schema } from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    desc: { type: String },
    shortDesc: { type: String, required: true, maxlength: 200 },
    img: { type: String },
    cat: { type: String },
    views: [{ type: Schema.Types.ObjectId, ref: "Views" }],
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant" },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comments" }],
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Posts = mongoose.model("Posts", postSchema);

export default Posts;
