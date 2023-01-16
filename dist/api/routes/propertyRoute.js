"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(app, upload_files) {
    var admin = require("../controllers/adminController");
    var property = require("../controllers/propertyController");
    var session = require("../controllers/sessionController");
    app.route("/login").get(session.check_token).post(admin.login);
    app.route("/logout").get(admin.log_out);
    /*app.route('/register')
          .post(admin.register)*/
    app
        .route("/properties")
        .get(property.list_properties)
        .post(session.middleware, upload_files.fields([
        { name: "images", maxCount: 10 },
        { name: "video", maxCount: 1 },
    ]), property.create_property);
    app
        .route("/properties/:propertyId")
        .get(property.read_property)
        .delete(session.middleware, property.delete_property)
        .put(session.middleware, property.middleware, upload_files.fields([
        { name: "images", maxCount: 10 },
        { name: "video", maxCount: 1 },
    ]), property.update_property);
}
exports.default = default_1;
