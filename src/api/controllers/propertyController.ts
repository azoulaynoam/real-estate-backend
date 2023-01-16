"use strict";

var fs = require("fs");
var path = require("path");
var server = require("../../server");
var Property = server.connection.model("Properties");

// Sorting a json ASC or DESC by chosen field.
function sortJSON(json, field, order) {
  return json.sort(function (a, b) {
    var x = a[field];
    var y = b[field];
    if (order === "ASC") {
      return x < y ? -1 : x > y ? 1 : 0;
    }
    if (order === "DESC") {
      return x > y ? -1 : x < y ? 1 : 0;
    }
  });
}

// Delete files and handeling the errors for existens reasons.
function delete_file(file_path) {
  try {
    fs.unlinkSync(path.join(__dirname + "../../../build" + file_path));
  } catch (err) {
    console.log(err);
  }
}

/*
    Returning uploaded images and video
*/
function get_new_files(files) {
  let images, video;
  if (files) {
    Object.keys(files).forEach((key) => {
      switch (key) {
        case "images":
          images = [];
          for (let i = 0; i < files["images"].length; i++) {
            let file_path = "/uploads/" + files["images"][i].filename;
            images.push({ path: file_path });
          }
          break;
        case "video":
          video = "/uploads/" + files["video"][0].filename;
        default:
          break;
      }
    });
  }
  return [images, video];
}

/*
    Returning chosen images and the actions (checking which images and video used to )
*/
async function get_old_files(property, body) {
  let images, video;
  if (body.images && body.images !== null) {
    images = [];
    if (Array.isArray(body.images)) {
      body.images.forEach((image) => {
        if (
          Array.isArray(property.images) &&
          property.images.some((img) => img.path == image)
        ) {
          images.push({ path: image });
        }
      });
    } else if (
      Array.isArray(property.images) &&
      property.images.some((img) => img.path == body.images)
    ) {
      images.push({ path: body.images });
    }
  }
  if (body.video) {
    if (property.video == body.video) {
      video = body.video;
    }
  }
  return [images, video];
}

/*
    Get all attributes from body (besides files)
*/
function create_property_body(body) {
  let fields = [
    "action",
    "status",
    "free_text_en",
    "free_text_he",
    "rooms",
    "bedrooms",
    "bathrooms",
    "size",
    "price",
  ];
  let new_property = {};
  Object.keys(body).forEach((key) => {
    if (fields.includes(key)) new_property[key] = body[key];
  });
  return new_property;
}

async function get_property(req, property) {
  var new_property = create_property_body(req.body);
  var [images, video] = get_new_files(req.files);
  var [old_images, old_video] = await get_old_files(property, req.body);

  if (old_images && old_images !== null) {
    // Adding old images from body.
    if (images && images !== null) {
      old_images.forEach((img) => {
        if (!images.some((image) => image.path === img.path)) images.push(img);
      });
    } else {
      images = old_images;
    }
  }
  // Checking for new video, if exists, delete the old one
  if (video && old_video !== video) {
    if (property.video && property.video != null) delete_file(property.video);
  } // Checking for new video, if exists, delete the old one
  else if (old_video !== property.video) {
    if (property.video && property.video != null) delete_file(property.video);
    video = old_video;
  } else if (property.video && property.video != null)
    delete_file(property.video);

  old_images = property.images;

  if (old_images && old_images.length) {
    // Deleting unnecessarry files from previus version of property
    if (images && images.length)
      old_images.forEach((image) => {
        if (!images.some((img) => img.path == image.path)) {
          delete_file(image.path);
        }
      });
  }

  new_property.images = images;
  new_property.video = video;

  return new_property;
}

/**
 * Middleware for finding propertie.
 * Output property at res.locals.property
 */
exports.middleware = (req, res, next) => {
  Property.find({ id: req.params.propertyId }, function (err, property) {
    if (err) {
      console.log("Error: Property not found.");
      res.send(err);
    } else {
      res.locals.property = property;
      next();
    }
  });
};

// Property Creation & Save on DB.
exports.create_property = function (req, res) {
  let [images, video] = get_new_files(req.files);
  let new_property = create_property_body(req.body);
  new_property["status"] = true;
  if (images) new_property["images"] = images;
  if (video) new_property["video"] = video;
  new_property = new Property(new_property);
  new_property.save(function (err, property) {
    if (err) res.send(err);
    else res.json(property).status(201);
  });
};

exports.update_property = async function (req, res) {
  var property = res.locals.property[0];

  if (!property || property === null) {
    res.sendStatus(404);
  } else {
    var new_property = await get_property(req, property);

    Property.findOneAndUpdate(
      { id: req.params.propertyId },
      new_property,
      { new: true, runValidators: true },
      function (err, property) {
        if (err) res.send(err);
        else res.json(property);
      }
    );
  }
};

exports.read_property = function (req, res) {
  Property.find({ id: req.params.propertyId }, function (err, property) {
    if (err) res.send(err);
    else res.json(property);
  });
};

exports.delete_property = function (req, res) {
  Property.findOneAndDelete(
    { id: req.params.propertyId },
    function (err, property) {
      if (err || !property || property === null) {
        res.sendStatus(404);
      } else {
        if (property.images && property.images !== null) {
          if (Array.isArray(property.images)) {
            property.images.forEach((image) => {
              delete_file(image.path);
            });
          } else {
            delete_file(property.images.path);
          }
        }
        if (property.video && property.video !== null) {
          delete_file(property.video);
        }
        res.sendStatus(202);
      }
    }
  );
};

exports.list_properties = function (req, res) {
  let fields = [
    "id",
    "action",
    "status",
    "free_text_en",
    "free_text_he",
    "rooms",
    "bedrooms",
    "bathrooms",
    "size",
    "price",
  ];
  let filter = {};
  let field = null;
  let order = null;
  let start = null;
  let end = null;
  try {
    Object.keys(req.query).forEach((param) => {
      switch (param) {
        case "_sort":
          if (fields.includes(req.query[param])) field = req.query[param];
          break;
        case "_order":
          order = req.query[param];
          break;
        case "_start":
          start = JSON.parse(req.query[param]);
          break;
        case "_end":
          end = JSON.parse(req.query[param]);
          break;
        default:
          if (param.includes(fields)) filter[param] = req.query[param];
          break;
      }
    });
  } catch (err) {
    console.log(err.message);
  }
  Property.find(filter, function (err, properties) {
    let len = properties.length;
    if (err) {
      res.status(404).send(err);
    } else {
      if (field) {
        try {
          properties = sortJSON(properties, field, order);
        } catch {
          res.sendStatus(500);
        }
      }
      res.header("Access-Control-Expose-Headers", "X-Total-Count");
      res.header("X-Total-Count", len);
      if (start || end) {
        if (start && !end) {
          properties = properties.slice(start);
        } else if (end && !start) {
          properties = properties.slice(start, end);
        } else {
          properties = properties.slice(0, end);
        }
        res.header(
          "Content-Range",
          "properties " + start + "-" + (end - 1) + "/" + len
        );
      }
      res.status(200).json(properties);
    }
  }).catch((err) => {
    console.log(err);
  });
};
