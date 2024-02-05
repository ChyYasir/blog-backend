import express from "express";
import {
  OTPVerification,
  forgotResetPassword,
  getTenantFollowers,
  requestPasswordReset,
  resendOTP,
  resetPassword,
} from "../controllers/tenantController.js";
import tenantAuth from "../middleware/tenantAuthMiddleware.js";
const router = express.Router();

router.post("/followers", tenantAuth, getTenantFollowers);
router.post("/verify/:tenantId/:otp", OTPVerification);
router.post("/resend-link/:tenantId", resendOTP);
router.post("/request-reset-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/forgot-reset-password", forgotResetPassword);
export default router;
