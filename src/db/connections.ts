import mongoose from "mongoose";
import { S3 } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.MONGO_URL;
if (!uri) throw new Error("No Mongo URL provided");
const mongoDB = mongoose.createConnection(uri, {
  keepAlive: true,
});

const S3Client = new S3({
  region: process.env.AWS_S3_REGION ? process.env.AWS_S3_REGION : "",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID
      ? process.env.AWS_S3_ACCESS_KEY_ID
      : "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
      ? process.env.AWS_S3_SECRET_ACCESS_KEY
      : "",
  },
});

export { mongoDB, S3Client };
