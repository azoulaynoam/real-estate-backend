import dotenv from "dotenv";
import compression from "compression";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import path from "path";
import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import cors from "cors";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

import routes from "./api/routes/propertyRoute";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./build/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const s3storage = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID
      ? process.env.AWS_S3_ACCESS_KEY_ID
      : "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
      ? process.env.AWS_S3_SECRET_ACCESS_KEY
      : "",
  },
});

const upload_files = multer({
  storage: multerS3({
    s3: s3storage,
    bucket: process.env.AWS_S3_BUCKET_NAME
      ? process.env.AWS_S3_BUCKET_NAME
      : "",
    acl: "public-read",
    metadata: function (req, file, cb) {
      console.log(file);
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      console.log(file);
      cb(null, Date.now().toString());
    },
  }),
  fileFilter: async (req, file, cb) => {
    console.log(file);
    if (file.fieldname === "images") {
      if (file.mimetype.indexOf("image/") === 0) {
        cb(null, true);
      } else {
        //Image type not supported
        cb(null, false);
      }
    } else if (file.fieldname === "video") {
      if (file.mimetype.indexOf("video/") === 0) {
        cb(null, true);
      } else {
        //Video type not supported
        cb(null, false);
      }
    } else {
      //File type not supported
      cb(null, false);
    }
  },
  dest: "./build/uploads/",
});

if (process.env.NODE_ENV === "DEVELOPMENT") {
  app.use(
    cors({
      origin: "http://localhost:3001",
      credentials: true,
      methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE"],
    })
  );
}

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("build"));
routes(app, upload_files);
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(PORT);

console.log("Azoulay Real-Estate API Started On Port " + PORT);
