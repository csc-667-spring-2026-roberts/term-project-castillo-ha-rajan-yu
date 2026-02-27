import express from "express";
import path from "path";
import homeRouter from "./routes/home.js";
import { requestLogger } from "./middleware/logging.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "..", "public")));

app.use(requestLogger);

app.use("/", homeRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});
