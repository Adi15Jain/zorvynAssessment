const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const recordRoutes = require("./src/routes/record.routes");
const analyticsRoutes = require("./src/routes/analytics.routes");

const app = express();

// Security Middlewares
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://fonts.googleapis.com",
                ],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
            },
        },
    }),
);
app.use(cors());

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Handle favicon.ico 404
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Rate Limiting Middleware for Auth routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

// Body Parser Middleware
app.use(express.json());

// Setup Swagger
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Finance Dashboard API",
            version: "1.0.0",
            description: "API documentation for the Finance Dashboard",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: ["./src/routes/*.js"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", limiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", analyticsRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Health check route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date(),
    });
});

// Serve frontend for all other routes (SPA)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

module.exports = app;
