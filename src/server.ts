// Import core dependencies and route/middleware modules used by the server.
import express from "express";
import path from "path";
import homeRouter from "./routes/home.js";
import { requestLogger } from "./middleware/logging.js";
import { fileURLToPath } from "url";

// Recreate __filename and __dirname for ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the Express application instance.
const app = express();
// Read the port from environment variables, defaulting to 3000.
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Parse incoming JSON request bodies.
app.use(express.json());
// Parse URL-encoded form submissions.
app.use(express.urlencoded({ extended: true }));

// Serve static assets from the public directory.
app.use(express.static(path.join(__dirname, "..", "public")));

// Log details for each incoming request.
app.use(requestLogger);

// Register application routes.
app.use("/", homeRouter);

// Start the server and print the local URL once it is listening.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});
