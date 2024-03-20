import Verification from "../models/emailVerification.js";
import ResetToken from "../models/resetTokenModel.js";
import Tenant from "../models/tenantModel.js";
import Users from "../models/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmailTenant,
} from "../utils/sendEmail.js";

export const OTPVerification = async (req, res, next) => {
  try {
    const { tenantId, otp } = req.params;

    const result = await Verification.findOne({ tenantId });

    const { expiresAt, token } = result;

    // token has expired, delete token
    if (expiresAt < Date.now()) {
      await Verification.findOneAndDelete({ tenantId });

      const message = "Verification token has expired.";
      res.status(404).json({ message });
    } else {
      const isMatch = await compareString(otp, token);

      if (isMatch) {
        await Promise.all([
          Tenant.findOneAndUpdate({ _id: tenantId }, { emailVerified: true }),
          Verification.findOneAndDelete({ tenantId }),
        ]);

        const message = "Email verified successfully";
        res.status(200).json({ message });
      } else {
        const message = "Verification failed or link is invalid";
        res.status(404).json({ message });
      }
    }
  } catch (error) {
    //console.log(error);
    res.status(404).json({ message: "Something went wrong" });
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    await Verification.findOneAndDelete({ tenantId: tenantId });

    const tenant = await Tenant.findById(tenantId);

    tenant.password = undefined;

    const token = createJWT(tenant?._id);

    sendVerificationEmailTenant(tenant, res, token);
  } catch (error) {
    //console.log(error);
    res.status(404).json({ message: "Something went wrong" });
  }
};
export const getTenantFollowers = async (req, res) => {
  const { tenantId } = req.body.tenant;
  // //console.log(req.body);
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Find all users for a tenantId with pagination
    const followers = await Users.find({ tenantId: tenantId })
      .select("-password") // Exclude password from the result
      .sort({ _id: -1 })
      .limit(limit)
      .skip(skip);

    // Count total followers for pagination metadata
    const total = await Users.countDocuments({ tenantId: tenantId });

    const numOfPages = Math.ceil(total / limit);

    res.status(200).json({
      data: followers,
      total,
      numOfPages,
      page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const requestPasswordReset = async (req, res, next) => {
  const { email } = req.body;
  // //console.log({ email });
  try {
    const tenant = await Tenant.findOne({ email });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    // //console.log({ tenant });
    // Generate token
    const resetToken = createJWT(tenant._id);
    // const hash = await hashString(resetToken);
    // //console.log({ hash });

    // Save token in the database
    await new ResetToken({
      tenantId: tenant._id,
      token: resetToken,
      expiresAt: Date.now() + 3600000, // Token expires in 1 hour
    }).save();

    // Send email with reset link (implement sendPasswordResetEmail accordingly)
    const resetLink = `${process.env.FRONTEND_URL}/tenants/reset-password/${resetToken}`;
    await sendPasswordResetEmail(tenant.email, resetLink);

    res
      .status(200)
      .json({ message: "Password reset link sent to your email address" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res, next) => {
  const { token, oldPassword, newPassword } = req.body;
  //console.log(req.body);
  try {
    // const hashedToken = await hashString(token);
    // //console.log({ hashedToken });
    const resetToken = await ResetToken.findOne({ token: token });
    if (!resetToken || resetToken.expiresAt < Date.now()) {
      return res
        .status(400)
        .json({ message: "Invalid or expired password reset token" });
    }

    //console.log({ resetToken });
    const tenant = await Tenant.findById(resetToken.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    const isMatch = await compareString(oldPassword, tenant.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password does not match" });
    }
    // Update password
    tenant.password = await hashString(newPassword);
    await tenant.save();

    tenant.password = undefined;

    // Delete the reset token
    await ResetToken.findByIdAndDelete(resetToken._id);

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const forgotResetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;
  //console.log(req.body);
  try {
    // const hashedToken = await hashString(token);
    // //console.log({ hashedToken });
    const resetToken = await ResetToken.findOne({ token: token });
    if (!resetToken || resetToken.expiresAt < Date.now()) {
      return res
        .status(400)
        .json({ message: "Invalid or expired password reset token" });
    }

    //console.log({ resetToken });
    const tenant = await Tenant.findById(resetToken.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    // Update password
    tenant.password = await hashString(newPassword);
    await tenant.save();

    tenant.password = undefined;

    // Delete the reset token
    await ResetToken.findByIdAndDelete(resetToken._id);

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
