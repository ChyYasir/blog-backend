import JWT from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;
  //console.log(authHeader);
  if (!authHeader || !authHeader?.startsWith("Bearer")) {
    return next(new Error("Authentication failed: Token not provided"));
  }

  const token = authHeader?.split(" ")[1];
  // //console.log({authHeader})
  // //console.log({token})

  try {
    const tenantToken = JWT.verify(token, process.env.JWT_SECRET_KEY);
    //console.log({ tenantToken });
    req.body.tenant = {
      tenantId: tenantToken.tenantId,
    };

    return next();
  } catch (error) {
    if (error instanceof JWT.TokenExpiredError) {
      return next("Authentication failed: Token expired");
    }

    console.error(error);
    return next("Authentication failed: Invalid token");
  }
};

export default authMiddleware;
