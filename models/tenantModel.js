// models/Tenant.js
import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    image: { type: String, required: true },
    password: { type: String, select: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Followers" }],
  },
  { timestamps: true }
);

const Tenant = mongoose.model("Tenant", tenantSchema);

export default Tenant;
