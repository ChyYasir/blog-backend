import express from "express";
import authRoute from "./authRoute.js";
import userRoute from "./userRoute.js";
import postRoute from "./postRoute.js";
import categoryRoute from "./categoryRoute.js";
import tenantRoute from "./tenantRoute.js";

const router = express.Router();

router.use("/auth", authRoute); //auth/register
router.use("/users", userRoute);
router.use("/posts", postRoute);
router.use("/categories", categoryRoute);
router.use("/tenants", tenantRoute);

export default router;
