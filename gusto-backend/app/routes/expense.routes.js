module.exports = (app) => {
  const expenses = require("../controllers/expense.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const multer = require("multer");
  const path = require("path");
  const fs = require("fs");

  const router = require("express").Router();

  // All routes require authentication
  router.use(authMiddleware.verifyToken);

  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure multer for image uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "expense-" + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed!"));
      }
    }
  });

  // Image upload route
  router.post("/upload-image", upload.single("image"), expenses.uploadImage);

  // Create a new expense
  router.post("/", expenses.create);

  // Retrieve all expenses
  router.get("/", expenses.findAll);

  // Get expense summary
  router.get("/summary", expenses.getSummary);

  // Get total expenses
  router.get("/total", expenses.getTotal);

  // Retrieve a single expense
  router.get("/:id", expenses.findOne);

  // Update an expense
  router.put("/:id", expenses.update);

  // Delete an expense
  router.delete("/:id", expenses.delete);

  app.use("/api/expenses", router);
};

