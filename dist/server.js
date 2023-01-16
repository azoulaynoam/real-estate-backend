"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const compression_1 = __importDefault(require("compression"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
dotenv_1.default.config();
const app = (0, express_1.default)();
mongoose_1.default.Promise = global.Promise;
const uri = process.env.MONGO_URL;
if (!uri)
    throw new Error("No Mongo URL provided");
const connection = mongoose_1.default.createConnection(uri);
module.exports.connection = connection;
const User = require("./api/models/userModel");
const Session = require("./api/models/sessionModel");
const Property = require("./api/models/propertyModel");
const propertyRoute_1 = __importDefault(require("./api/routes/propertyRoute"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./build/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload_files = (0, multer_1.default)({
    storage: storage,
    fileFilter: (req, file, cb) => {
        console.log(file);
        if (file.fieldname === "images") {
            if (file.mimetype.indexOf("image/") === 0) {
                cb(null, true);
            }
            else {
                //Image type not supported
                cb(null, false);
            }
        }
        else if (file.fieldname === "video") {
            if (file.mimetype.indexOf("video/") === 0) {
                cb(null, true);
            }
            else {
                //Video type not supported
                cb(null, false);
            }
        }
        else {
            //File type not supported
            cb(null, false);
        }
    },
});
app.use((0, compression_1.default)());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static("build"));
(0, propertyRoute_1.default)(app, upload_files);
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname + "/build/index.html"));
});
app.listen(4000);
console.log("Azoulay Real-Estate API Started");
