import express from "express";
import tenantAuth from "../middleware/tenantAuthMiddleware.js";
import {
  addCategory,
  deleteCategory,
  editCategory,
  getAdminCategories,
  getCategories,
} from "../controllers/categoryControllers.js";

const router = express.Router();

// ADMIN ROUTES
router.post("/admin/add", tenantAuth, addCategory);
router.delete("/admin/delete/:id", tenantAuth, deleteCategory);
router.get("/admin/get", tenantAuth, getAdminCategories);
router.patch("/admin/edit/:id", tenantAuth, editCategory);
// general
router.get("/", getCategories);
export default router;
