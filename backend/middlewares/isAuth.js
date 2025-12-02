import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export default async function isAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // JWT me tum userId store kar rahi ho
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ⭐ This is the missing part that caused the crash
    req.user = user;   
    req.userId = user._id;  // optional, but useful

    next();
  } catch (err) {
    console.log("AUTH ERROR:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}
