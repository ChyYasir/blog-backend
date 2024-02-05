import mongoose from "mongoose";

const resetTokenSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Tenant",
  },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const ResetToken = mongoose.model("ResetToken", resetTokenSchema);

export default ResetToken;
