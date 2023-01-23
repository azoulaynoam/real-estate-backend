import dotenv from "dotenv";
import compression from "compression";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import path from "path";
import multer from "multer";
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

const upload_files = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
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
});

app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
  })
);
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
