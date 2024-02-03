import express from "express";
import { OTPVerification, resendOTP } from "../controllers/tenantController.js";

const router = express.Router();

router.post("/verify/:tenantId/:otp", OTPVerification);
router.post("/resend-link/:tenantId", resendOTP);

export default router;
