import Verification from "../models/emailVerification.js";
import Tenant from "../models/tenantModel.js";
import { compareString, createJWT } from "../utils/index.js";
import { sendVerificationEmailTenant } from "../utils/sendEmail.js";

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
    console.log(error);
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
    console.log(error);
    res.status(404).json({ message: "Something went wrong" });
  }
};
