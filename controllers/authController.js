import Tenant from "../models/tenantModel.js";
import Users from "../models/userModel.js";
import {
  compareString,
  createJWT,
  createUserJWT,
  hashString,
} from "../utils/index.js";
import { sendVerificationEmailTenant } from "../utils/sendEmail.js";

export const register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      image,
      accountType,
      provider,
      tenantId,
    } = req.body;

    //validate fileds
    if (!(firstName || lastName || email || password)) {
      return next("Provide Required Fields!");
    }

    // if (accountType === "Writer" && !image)
    //   return next("Please provide profile picture");

    const userExists = await Users.findOne({ email, tenantId });

    if (userExists) {
      return next("Email Address already exists. Try Login");
    }

    const hashedPassword = await hashString(password);

    const user = await Users.create({
      name: firstName + " " + lastName,
      email,
      password: !provider ? hashedPassword : "",
      image,
      accountType,
      provider,
      tenantId,
    });

    user.password = undefined;

    const token = createUserJWT(user?._id);

    //send email verification if account type is writer
    // if (accountType === "Writer") {
    //   sendVerificationEmail(user, res, token);
    // } else {
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user,
      token,
    });
    // }
  } catch (error) {
    //console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const googleSignUp = async (req, res, next) => {
  const { name, email, image, emailVerified, tenantId } = req.body;

  try {
    const userExists = await Users.findOne({
      tenantId: tenantId,
      email: email,
    });

    if (userExists) {
      next("Email Address already exists. Try Login");
      return;
    }

    const user = await Users.create({
      name,
      email,
      image,
      provider: "Google",
      emailVerified,
      tenantId,
    });

    user.password = undefined;

    const token = createUserJWT(user?._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user,
      token,
    });
  } catch (error) {
    //console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, tenantId } = req.body;

    //validation
    if (!email) {
      return next("Please Provide User Credentials");
    }

    // find user by email
    const user = await Users.findOne({ email, tenantId }).select("+password");

    if (!user) {
      return next("Invalid email or password");
    }

    // Google account signed in
    if (!password && user?.provider === "Google") {
      const token = createUserJWT(user?._id);

      return res.status(201).json({
        success: true,
        message: "Login successfully",
        user,
        token,
      });
    }

    // compare password
    const isMatch = await compareString(password, user?.password);

    if (!isMatch) {
      return next("Invalid email or password");
    }

    // if (user?.accountType === "Writer" && !user?.emailVerified) {
    //   return next("Please verify your email address.");
    // }

    user.password = undefined;

    const token = createUserJWT(user?._id);

    res.status(201).json({
      success: true,
      message: "Login successfully",
      user,
      token,
    });
  } catch (error) {
    //console.log(error);
    res.status(404).json({ success: "failed", message: error.message });
  }
};

// Tenant Controllers
export const registerTenant = async (req, res, next) => {
  const { firstName, lastName, email, password, image } = req.body;

  if (!image)
    return res.status(400).json({ message: "Profile picture required" });

  try {
    const existingTenant = await Tenant.findOne({ email });
    if (existingTenant) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await hashString(password);

    const tenant = new Tenant({
      name: firstName + " " + lastName,
      email,
      password: hashedPassword,
      image,
    });

    await tenant.save();
    tenant.password = undefined; // Don't return the password

    const token = createJWT(tenant._id);
    sendVerificationEmailTenant(tenant, res, token);
  } catch (error) {
    next(error);
  }
};

export const loginTenant = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const tenant = await Tenant.findOne({ email }).select("+password");
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const isMatch = await compareString(password, tenant?.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!tenant?.emailVerified) {
      return next("Please verify your email address.");
    }
    tenant.password = undefined;
    const token = createJWT(tenant?._id);
    //console.log({ token });
    res
      .status(201)
      .json({ success: true, message: "Login successfully", tenant, token });
  } catch (error) {
    //console.log(error);
    res.status(404).json({ success: "failed", message: error.message });
  }
};
