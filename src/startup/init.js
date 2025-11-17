// src/startup/init.js
import { connectDB } from "../config/database.js";
import logger from "../config/logger.js";
import { seedDatabase } from "../seed/seed.js";

export default async function init() {
    const connection = await connectDB(); // returns mongoose.connection
    // await seedDatabase(connection);
    // future: connect Redis, initialize queues, seed other data
}
