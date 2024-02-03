import express from "express";
import tenantAuth from "../middleware/tenantAuthMiddleware.js";
import {
  addCategory,
  getCategories,
} from "../controllers/categoryControllers.js";

const router = express.Router();

// ADMIN ROUTES
router.post("/admin/add", tenantAuth, addCategory);

// general
router.get("/", getCategories);
export default router;
