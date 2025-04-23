require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const { MONGO_URI, JWT_SECRET } = process.env;

const app = express();
app.use(express.json());
app.use(cors());

// 1) Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

// 2) User Schema (Student)
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  matricNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  level: { type: String, required: true },
  role: { type: String, default: "student" },
});
const Student = mongoose.model("Student", studentSchema);

// 3) Teacher Schema
const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: String,
});
const Teacher = mongoose.model("Teacher", teacherSchema);

// ---------------- STUDENT ROUTES ---------------- //

// Signup Route (Student)
app.post("/student/signup", async (req, res) => {
  try {
    const { name, email, password, matricNumber, level, role } = req.body;

    // Check if email or matric number already exists
    const existing = await Student.findOne({ $or: [{ email }, { matricNumber }] });
    if (existing) {
      return res.status(400).json({ error: "Student already registered with this email or matric number" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new Student({
      name,
      email,
      password: hashedPassword,
      matricNumber,
      level,
      role: role || "student",
    });

    await newStudent.save();

    // ✅ Generate and send JWT token
    const token = jwt.sign({ studentId: newStudent._id, role: "student" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Student registered successfully", token });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Something went wrong during registration" });
  }
});

// Login Route (Student)
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id, role: "student" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Student login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ---------------- TEACHER ROUTES ---------------- //

// Signup Route (Teacher)
app.post("/teacher/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 5);
    const newTeacher = new Teacher({ name, email, password: hashedPassword });
    await newTeacher.save();

    res.json({ message: "Teacher account created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Teacher signup failed" });
  }
});

// Login Route (Teacher)
app.post("/teacher/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, teacher.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ teacherId: teacher._id, role: "teacher" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Teacher login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("SEN Prep Questions Backend Running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
