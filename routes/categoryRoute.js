import express from "express";
import userAuth from "../middleware/authMiddleware.js";
import { addCategory, getCategories } from "../controllers/categoryControllers.js";

const router = express.Router();

// ADMIN ROUTES
router.post("/admin/add", userAuth, addCategory);


// general
router.get("/", getCategories); 
export default router;