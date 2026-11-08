const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const http = require("http");
const path = require("path");
require("dotenv").config();
// All dates in the app are the restaurant's local time (business day 03:00 → 02:59)
process.env.TZ = process.env.TZ || "Asia/Baghdad";

const app = express();

// CORS configuration (BEFORE helmet to avoid conflicts)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) or from allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:8080", "http://localhost:3128"];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);

// Gzip compression — reduces API response size by 3-5x
app.use(compression());

// Body parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Serve static files (uploads) — cached for 7 days
// CORS is handled by global middleware above
app.use(
  "/uploads",
  express.static(__dirname + "/uploads", {
    maxAge: "7d",
    immutable: true,
    etag: true,
  }),
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Restaurant Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
require("./app/routes/auth.routes")(app);
require("./app/routes/category.routes")(app);
require("./app/routes/menu.routes")(app);
require("./app/routes/itemSize.routes")(app);
require("./app/routes/inventory.routes")(app);
require("./app/routes/storageLocation.routes")(app);
require("./app/routes/ingredientStock.routes")(app);
require("./app/routes/transfer.routes")(app);
require("./app/routes/kitchenItemStock.routes")(app);
require("./app/routes/order.routes")(app);
require("./app/routes/orderReturn.routes")(app);
require("./app/routes/staff.routes")(app);
require("./app/routes/recipe.routes")(app);
require("./app/routes/dailyReceipt.routes")(app);
require("./app/routes/purchase.routes")(app);
require("./app/routes/expense.routes")(app);
require("./app/routes/expenseCategory.routes")(app);
require("./app/routes/box.routes")(app);
require("./app/routes/report.routes")(app);
require("./app/routes/supplier.routes")(app);
require("./app/routes/customer.routes")(app);
require("./app/routes/tip.routes")(app);
require("./app/routes/account.routes")(app);
require("./app/routes/postingSettings.routes")(app);
require("./app/routes/journalEntry.routes")(app);
require("./app/routes/payment.routes")(app);
require("./app/routes/otherIncome.routes")(app);

// Serve frontend static files from dist folder — cached for 1 day
const frontendDistPath = path.join(__dirname, "gusto-frontend/dist");
app.use(express.static(frontendDistPath));

// Catch-all handler: send back React/Vue app's index.html file for SPA routing
// This must be after API routes but before 404 handler
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      message: "API route not found",
    });
  }

  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(404).json({
        message: "Frontend not found. Please build the frontend first.",
      });
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Fingerprint device configuration
const FINGERPRINT_IP = process.env.FINGERPRINT_IP || "192.168.4.164";
const FINGERPRINT_PORT = process.env.FINGERPRINT_PORT || 4370;

// Create HTTP server
const PORT = process.env.PORT || 3128;
const server = http.createServer(app);

// Initialize WebSocket (Socket.IO) for real-time features
const io = require("socket.io")(server, {
  cors: corsOptions,
});

// Make io available to routes
app.set("io", io);

// Make fingerprint config available to routes
app.set("fingerprintConfig", {
  ip: FINGERPRINT_IP,
  port: FINGERPRINT_PORT,
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  // Join kitchen room
  socket.on("join_kitchen", () => {
    socket.join("kitchen");
    console.log("👨‍🍳 Socket joined kitchen room");
  });

  // Join cashier room
  socket.on("join_cashier", () => {
    socket.join("cashier");
    console.log("💰 Socket joined cashier room");
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log("");
  console.log("🚀 ================================");
  console.log(`✨ Restaurant Management API Server`);
  console.log(`📡 Running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`👆 Fingerprint Device: ${FINGERPRINT_IP}:${FINGERPRINT_PORT}`);
  console.log("🔥 WebSocket server ready");
  console.log("================================");
  console.log("");
});

module.exports = app;
