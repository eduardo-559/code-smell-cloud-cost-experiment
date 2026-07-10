import jwt from "jsonwebtoken";

const UNAUTHORIZED_RESPONSE = { success: false, message: "Unauthorized!" };

const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers?.token;

    if (!token) {
      return res.status(401).json(UNAUTHORIZED_RESPONSE);
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const expected = process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD;

    if (decodedToken !== expected) {
      return res.status(401).json(UNAUTHORIZED_RESPONSE);
    }

    return next();
  } catch (error) {
    console.log("Error while authenticating admin: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default adminAuth;
