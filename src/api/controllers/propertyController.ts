"use strict";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { IProperty, propertyModel } from "../models/propertyModel";

// Delete files and handeling the errors for existens reasons.
const delete_file = (file_path?: string) => {
  try {
    if (file_path)
      fs.unlinkSync(path.join(__dirname + "../../../build" + file_path));
  } catch (err) {
    console.log(err);
  }
};

/*
    Returning uploaded images and video
*/
const get_new_files = async (
  files:
    | Express.Multer.File[]
    | {
        [fieldname: string]: Express.Multer.File[];
      }
    | undefined
) => {
  const images: { path: string }[] = [];
  let video: string | undefined;
  if (files) {
    Object.keys(files).forEach((key) => {
      switch (key) {
        case "images":
          if (!Array.isArray(files))
            for (let i = 0; i < files.images.length; i++) {
              let file_path = "/uploads/" + files.images[i].filename;
              images.push({ path: file_path });
            }
          break;
        case "video":
          if (!Array.isArray(files))
            video = "/uploads/" + files.video[0].filename;
        default:
          break;
      }
    });
  }
  return { images, video };
};

/*
    Get all attributes from body (besides files)
*/

const get_property = async (req: Request, property: IProperty) => {
  let new_property: IProperty = req.body.property;
  let { images, video } = await get_new_files(req.files);
  const old_images = property.images;
  const old_video = property.video;
  if (old_images && Array.isArray(old_images)) {
    // Adding old images from body.
    if (images && Array.isArray(images)) {
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

  if (old_images && old_images.length) {
    // Deleting unnecessarry files from previus version of property
    if (images && images.length)
      old_images.forEach((image: { path: string }) => {
        if (!images.some((img) => img.path == image.path)) {
          delete_file(image.path);
        }
      });
  }

  new_property.images = images;
  new_property.video = video;

  return new_property;
};

/**
 * Middleware for finding propertie.
 * Output property at res.locals.property
 */
const middleware = async (
  req: Request<{ propertyId: string }>,
  res: Response<{}, { property: IProperty }>,
  next: Function
) => {
  propertyModel.find(
    { id: req.params.propertyId },
    function (err: Error, property: IProperty) {
      if (err) {
        console.log("Error: Property not found.");
        res.send(err);
      } else {
        res.locals.property = property;
        next();
      }
    }
  );
};

// Property Creation & Save on DB.
const create_property = async (req: Request, res: Response) => {
  const property = new propertyModel(req.body);
  const { images, video } = await get_new_files(req.files);
  property.status = true;
  if (images && Array.isArray(images)) property.images = images;
  if (video && !Array.isArray(video)) property.video = video;
  const saved = await property.save();
  if (saved) res.status(201).json(saved);
  else res.sendStatus(500);
};

const update_property = async (
  req: Request<{ propertyId: string }>,
  res: Response<IProperty, { property: IProperty }>
) => {
  var property: IProperty = res.locals.property;

  if (!property || property === null) {
    res.sendStatus(404);
  } else {
    var new_property = await get_property(req, property);

    await propertyModel.findOneAndUpdate(
      { id: req.params.propertyId },
      new_property,
      function (err: Error, property: IProperty) {
        if (err) res.send();
        else res.status(200).json(property ? property : undefined);
      }
    );
  }
};

const read_property = async (
  req: Request<{ propertyId: string }>,
  res: Response
) => {
  await propertyModel.find(
    { id: req.params.propertyId },
    async (err: Error, property: IProperty) => {
      if (err) res.send(err);
      else res.json(property);
    }
  );
};

const delete_property = async (
  req: Request<{ propertyId: string }>,
  res: Response
) => {
  const result = await propertyModel
    .findByIdAndDelete(req.params.propertyId)
    .exec();
  if (!result) {
    res.sendStatus(404);
  } else {
    if (result.images && result.images !== null) {
      result.images.forEach(async (image) => {
        delete_file(image.path);
      });
    }
    if (result.video && result.video !== null) {
      delete_file(result.video);
    }
    res.sendStatus(202);
  }
};

type sortFields =
  | "_id"
  | "action"
  | "status"
  | "rooms"
  | "bedrooms"
  | "bathrooms"
  | "size"
  | "price"
  | "createdAt";

const list_properties = async (
  req: Request<
    any,
    any,
    IProperty,
    {
      _sort?: sortFields;
      _order?: "ASC" | "DESC" | undefined;
      _start?: string;
      _end?: string;
    }
  >,
  res: Response
) => {
  let filter = {};
  let field: sortFields | undefined;
  let order: "ASC" | "DESC" = "ASC";
  let start: number = 0;
  let end: number = 0;
  try {
    Object.keys(req.query).forEach((param) => {
      switch (param) {
        case "_sort":
          field = req.query["_sort"];
          break;
        case "_order":
          order = req.query["_order"] ? req.query["_order"] : order;
          break;
        case "_start":
          if (req.query["_start"]) start = JSON.parse(req.query["_start"]);
          break;
        case "_end":
          if (req.query["_end"]) end = JSON.parse(req.query["_end"]);
          break;
        default:
          break;
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Error";
    console.log(message);
  }

  const orderObj: { [key: string]: 1 | -1 } = {};

  if (field) {
    orderObj[field] = order === "ASC" ? 1 : -1;
  }

  const properties = await propertyModel
    .find(filter)
    .skip(start)
    .limit(end > 0 ? end - start : end)
    .sort(orderObj);

  if (!properties || properties.length === 0) {
    res.sendStatus(404);
  } else {
    const len = properties.length;
    res.header("Access-Control-Expose-Headers", "X-Total-Count");
    res.header("X-Total-Count", String(len));
    if (start || end) {
      res.header(
        "Content-Range",
        "properties " + start + end ? "-" + (end - 1) : "" + "/" + len // Format: properties 0-20/100 (start-end/total)
      );
    }
    res.status(200).json(properties);
  }
};

export default {
  create_property,
  update_property,
  read_property,
  delete_property,
  list_properties,
  middleware,
};
