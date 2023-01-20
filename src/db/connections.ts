import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.MONGO_URL;
if (!uri) throw new Error("No Mongo URL provided");
const connection = mongoose.createConnection(uri);

export default connection;
