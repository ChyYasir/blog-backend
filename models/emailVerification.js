import mongoose, { Schema } from "mongoose";

const emailVerificationSchema = Schema({
  tenantId: String,
  token: String,
  createdAt: Date,
  expiresAt: Date,
});

const Verification = mongoose.model("Verification", emailVerificationSchema);

export default Verification;
