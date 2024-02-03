import express from "express";
import {
  googleSignUp,
  login,
  loginTenant,
  register,
  registerTenant,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/google-signup", googleSignUp);
router.post("/login", login);
router.post("/tenant/register", registerTenant);
router.post("/tenant/login", loginTenant);

export default router;
