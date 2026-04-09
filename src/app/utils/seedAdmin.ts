import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { Role } from "../../generated/prisma/enums";
import AppError from "../errorHelpers/AppError";
import status from "http-status";
import { envVars } from "../config/env";



const seedAdmin = async () => {
  try {
    const adminEmail = envVars.seedAdmin.ADMIN_EMAIL || "admin@gmail.com";
    const adminPassword = envVars.seedAdmin.ADMIN_PASSWORD || "admin1234";
    const adminName = envVars.seedAdmin.ADMIN_NAME || "System Administrator";

    console.log("Checking if admin user already exists...");

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      console.log(`User with email ${adminEmail} already exists!`);
      return;
    }

    console.log("Creating admin user via better-auth...");

    // Use auth.api to properly hash the password and setup session tokens
    const data = await auth.api.signUpEmail({
      body: {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      }
    });

    if (!data.user) {
      throw new AppError(status.BAD_REQUEST, "Failed to create admin user in better-auth");
    }

    console.log("Setting up Admin relational tables and enforcing ADMIN role...");

    // Run transaction to enforce role and create Admin record
    await prisma.$transaction(async (tx) => {
      // Force the role to ADMIN and ensure email is verified
      await tx.user.update({
        where: { id: data.user.id },
        data: {
          role: Role.ADMIN,
          emailVerified: true
        }
      });

      // Create proper Admin record
      await tx.admin.create({
        data: {
          user_id: data.user.id,
          name: adminName,
          email: adminEmail
        }
      });
    });

    console.log("-----------------------------------------");
    console.log("Admin seeded successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("-----------------------------------------");

    process.exit(0);
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`Seed failed [AppError]: ${error.message} (Status: ${error.statusCode})`);
    } else {
      console.error("Failed to seed admin:", error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seedAdmin();
