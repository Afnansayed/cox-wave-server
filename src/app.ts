import express,{ Application, Request, Response } from "express";
import { indexRoutes } from "./routes";

const app:Application = express()
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

app.use("/api/v1", indexRoutes);

// Basic route
app.get('/', async (req: Request, res: Response) => {
  res.status(200).json("Welcome to the CoxWave API!");
});

export default app;