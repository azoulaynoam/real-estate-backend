import dotenv from "dotenv";
import compression from "compression";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import multer from "multer";
import multerS3 from "multer-s3";
import cors from "cors";
import routes from "./api/routes/propertyRoute";
import { S3Client } from "./db/connections";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

const upload_files = multer({
  storage: multerS3({
    s3: S3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME
      ? process.env.AWS_S3_BUCKET_NAME
      : "",
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, Date.now().toString());
    },
  }),
  fileFilter: (req, file, cb) => {
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
});

// Cors is used to allow cross origin requests.
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "DEVELOPMENT"
        ? "http://localhost:3001"
        : "https://realestate-in-israel.com",
    credentials: true,
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE"],
  })
);

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
routes(app, upload_files);
app.get("/health", (req, res) => {
  res.sendStatus(200);
});

app.listen(PORT);

console.log("Azoulay Real-Estate API Started On Port " + PORT);
