import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import userModel from "../models/userModel.js";

const INVALID_CREDENTIALS_RESPONSE = {
  success: false,
  message: "Invalid email or password",
};

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

const sendInvalidCredentials = (res) => {
  return res.status(400).json(INVALID_CREDENTIALS_RESPONSE);
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) return sendInvalidCredentials(res);

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return sendInvalidCredentials(res);

    const token = createToken(user._id);
    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.log("Error while logging in user: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await userModel.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = createToken(user._id);
    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.log("Error while registering user: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const isAdmin =
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD;

    if (!isAdmin) return sendInvalidCredentials(res);

    const token = jwt.sign(email + password, process.env.JWT_SECRET);
    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.log("Error while logging in admin: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { loginUser, registerUser, loginAdmin };
