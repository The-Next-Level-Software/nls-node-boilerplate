// src/utils/seedDatabase.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../startup/models.js";
import bcrypt from "bcryptjs"; // for hashing passwords

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Currently only User, but can add more later
const MODELS = [
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

                // Hash password if required
                if (hashPassword) {
                    data = await Promise.all(
                        data.map(async (item) => {
                            if (item.password) {
                                item.password = await bcrypt.hash(item.password, 10);
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
