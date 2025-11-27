// src/utils/seedDatabase.js
import bcrypt from "bcryptjs"; // for hashing passwords
import fs from "fs/promises";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "../config/database.js";
import { Role, User } from "../startup/models.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS = [
  { name: "Roles", model: Role, file: "roles.json", hashPassword: true },
  { name: "Users", model: User, file: "users.json", hashPassword: true },
];

export const seedDatabase = async (connection) => {
  try {
    if (!connection || connection.readyState !== 1) {
      throw new Error(
        "MongoDB connection not provided or not ready. Pass the existing connection from init.js"
      );
    }

    for (const { name, model, file, hashPassword } of MODELS) {
      const filePath = path.join(__dirname, "exports", file);

      try {
        const fileContent = await fs.readFile(filePath, "utf-8");
        let data = JSON.parse(fileContent);

        if (!Array.isArray(data) || !data.length) {
          console.warn(`⚠️  Skipping ${name} — no valid data`);
          continue;
        }

        if (hashPassword) {
          data = await Promise.all(
            data.map(async (item) => {
              if (item.password) {
                item.password = await bcrypt.hash(item.password, 10);
              }
              if (
                item.role &&
                typeof item.role === "string" &&
                item.role.toLowerCase() === "user"
              ) {
                const role = await Role.findOne({ name: "user" }).select("_id").lean();
                if (role) {
                  item.role = role._id;
                }
              }
              return item;
            })
          );
        }

        await model.deleteMany({});
        await model.insertMany(data);
        console.log(`🌱 Seeded ${name} (${data.length} records)`);
      } catch (err) {
        if (err.code === "ENOENT") {
          console.warn(`⚠️  Skipping ${name} — file not found: ${file}`);
        } else {
          console.error(`❌ Error seeding ${name}:`, err);
        }
      }
    }

    console.log("\n✅ All seeding completed successfully");
  } catch (err) {
    console.error("❌ Error during seeding:", err);
  }
};

// -----------------------------------------------------------------------------
// Standalone execution (npm run seed)
// -----------------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    console.log("🚀 Starting database seeding...");

    const connection = await connectDB();
    await seedDatabase(connection);

    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed");
    process.exit(0);
  })();
}
