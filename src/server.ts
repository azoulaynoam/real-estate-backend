import dotenv from "dotenv";
import compression from "compression";
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import path from "path";
import multer from "multer";

dotenv.config();

const app = express();

mongoose.Promise = global.Promise;
const uri = process.env.MONGO_URL;
if (!uri) throw new Error("No Mongo URL provided");
const connection = mongoose.createConnection(uri);

export default connection;

const User = require("./api/models/userModel");
const Session = require("./api/models/sessionModel");
const Property = require("./api/models/propertyModel");
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

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("build"));
routes(app, upload_files);
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(4000);

console.log("Azoulay Real-Estate API Started");