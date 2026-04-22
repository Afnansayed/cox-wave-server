import express, { Application, Request, Response } from "express";
import { indexRoutes } from "./routes/index.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFoundHandler } from "./app/middleware/notFoundHandler";
import cookieParser from "cookie-parser";
import { PaymentController } from "./app/module/payment/payment.controller";
// import * as cron from "cron";
// import { bookingService } from "./app/module/booking/booking.service";
import cors from "cors";
import { envVars } from "./app/config/env";

const app: Application = express()


// stripe webhook
app.post("/webhook", express.raw({ type: "application/json" }), PaymentController.handleStripeWebhookEvent);

// Middleware to parse JSON bodies
app.use(cors({
    origin: [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL, "http://localhost:3000", "http://localhost:5000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization" , "Cookie"]
}));
app.use(express.json());
app.use(cookieParser());
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", indexRoutes);

// Basic route
app.get('/', async (req: Request, res: Response) => {
  res.status(200).json("Welcome to the CoxWave API!");
});


//corn 
// new cron.CronJob("*/20 * * * *", async () => {
//   try {
//     console.log("Running cron job to cancel unpaid bookings...");
//     await bookingService.cancelUnpaidBookings();
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   } catch (error: any) {
//     console.error("Error occurred while canceling unpaid bookings:", error.message);
//   }
// }).start();


// Global error handler
app.use(globalErrorHandler);
// Not found handler
app.use(notFoundHandler);

export default app;