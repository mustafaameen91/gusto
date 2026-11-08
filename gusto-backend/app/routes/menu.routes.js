module.exports = (app) => {
  const menu = require("../controllers/menu.controller");
  const authMiddleware = require("../middleware/auth.middleware");
  const multer = require("multer");
  const path = require("path");
  const fs = require("fs");

  const router = require("express").Router();

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
      cb(null, "menu-" + uniqueSuffix + path.extname(file.originalname));
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

  // Public route for QR menu
  router.get("/", menu.findAll);
  router.get("/:id", menu.findOne);
  router.get("/category/:categoryId", menu.findByCategory);

  // Image upload route
  router.post("/upload-image", authMiddleware.verifyToken, authMiddleware.isAdmin, upload.single("image"), menu.uploadImage);

  // Protected admin routes
  router.post("/", authMiddleware.verifyToken, authMiddleware.isAdmin, menu.create);
  router.put("/:id", authMiddleware.verifyToken, authMiddleware.isAdmin, menu.update);
  router.patch("/:id/toggle-availability", authMiddleware.verifyToken, menu.toggleAvailability);
  router.delete("/:id", authMiddleware.verifyToken, authMiddleware.isAdmin, menu.delete);

  app.use("/api/menu", router);
};

