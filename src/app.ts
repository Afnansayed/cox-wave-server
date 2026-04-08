import express,{ Application, Request, Response } from "express";
import { indexRoutes } from "./routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFoundHandler } from "./app/middleware/notFoundHandler";
import cookieParser from "cookie-parser";

const app:Application = express()


// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", indexRoutes);

// Basic route
app.get('/', async (req: Request, res: Response) => {
  res.status(200).json("Welcome to the CoxWave API!");
});

// Global error handler
app.use(globalErrorHandler);
// Not found handler
app.use(notFoundHandler);

export default app;