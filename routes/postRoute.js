import express from "express";
import tenantAuth from "../middleware/tenantAuthMiddleware.js";
import userAuth from "../middleware/userAuthMiddleware.js";
import {
  commentPost,
  createPost,
  deleteComment,
  deletePost,
  getComments,
  getFollowers,
  getPopularContents,
  getPost,
  getPostContent,
  getPostTenant,
  getPosts,
  getRecentPosts,
  stats,
  updatePost,
} from "../controllers/postController.js";

const router = express.Router();

// ADMIN ROUTES
router.post("/admin-analytics", tenantAuth, stats);
router.post("/admin-followers", tenantAuth, getFollowers);
router.post("/admin-content", tenantAuth, getPostContent);
router.post("/create-post", tenantAuth, createPost);
router.get("/admin/:postId", getPostTenant);
router.delete("/:id", tenantAuth, deletePost); // delete post
router.patch("/update/:id", tenantAuth, updatePost); // update post

// LIKE & COMMENT ON POST
router.post("/comment/:id/:tenantId", userAuth, commentPost);

// GET POSTS ROUTES
router.get("/comments/:postId", getComments);
router.get("/", getPosts);
router.get("/popular/:tenantId", getPopularContents);
router.get("/recent/:tenantId", getRecentPosts);
router.get("/:postId/:tenantId", getPost);

// DELETE POSTS ROUTES

router.delete("/comment/:id/:postId", userAuth, deleteComment);

export default router;
