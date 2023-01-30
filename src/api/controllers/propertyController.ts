"use strict";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { IProperty, propertyModel } from "../models/propertyModel";
import { S3Client } from "../../db/connections";

// Delete files and handeling the errors for existens reasons.
const delete_file = async (file_path: string) => {
  try {
    const deleted = await S3Client.deleteObject({
      Bucket: "samantha-azoulay",
      Key: file_path.split("/").pop(),
    });
    return deleted.$metadata.httpStatusCode === 204;
  } catch (error) {
    return false;
  }
};

interface IMulterS3 {
  fieldname: "images" | "video";
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  bucket: string;
  key: string;
  acl: string;
  contentType: string;
  contentDisposition: string | null;
  contentEncoding: string | null;
  storageClass: string;
  serverSideEncryption: string | null;
  metadata: [Object];
  location: string;
  etag: string;
  versionId?: string;
}

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
  let video: { path: string } | undefined;
  if (files) {
    Object.keys(files).forEach((key) => {
      switch (key) {
        case "images":
          if (!Array.isArray(files))
            for (let i = 0; i < files.images.length; i++) {
              images.push({
                path: (files.images[i] as any as IMulterS3).location,
              }); // files.images[i].location
            }
          break;
        case "video":
          if (!Array.isArray(files))
            video = { path: (files.video[0] as any as IMulterS3).location }; // files.video[0].location
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

const get_property = async (
  req: Request<any, any, IProperty>,
  property: IProperty
) => {
  let new_property: IProperty = req.body;
  let { images, video } = await get_new_files(req.files);
  const old_images = property.images;
  const old_video = property.video;

  if (old_images.length) {
    old_images.forEach(async (image) => {
      if (!images.find((img) => img.path === image.path)) {
        await delete_file(image.path);
      }
    });
  }

  if (old_video && old_video.path && old_video.path !== video?.path) {
    await delete_file(old_video.path);
  }

  new_property.images = images;
  new_property.video = video;

  return new_property;
};

/**
 * Middleware that checks if property exists before uploading the files.
 */
const middleware = async (
  req: Request<{ propertyId: string }>,
  res: Response<{}, { property: IProperty }>,
  next: Function
) => {
  const exists = await propertyModel.findById(req.params.propertyId);
  if (exists) {
    res.locals.property = exists;
    next();
  } else {
    res.sendStatus(404);
  }
};

// Property Creation & Save on DB.
const create_property = async (req: Request, res: Response) => {
  const property = new propertyModel(req.body);
  const { images, video } = await get_new_files(req.files);
  property.status = true;
  if (images && Array.isArray(images)) property.images = images;
  if (video) property.video = video;
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

    const result = await propertyModel.findByIdAndUpdate(
      req.params.propertyId,
      new_property
    );
    if (!result) res.sendStatus(404);
    else res.status(200).json(result);
  }
};

const read_property = async (
  req: Request<{ propertyId: string }>,
  res: Response
) => {
  const result = await propertyModel.findById(req.params.propertyId);
  if (!result) res.sendStatus(404);
  res.json(result).status(200);
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
        await delete_file(image.path);
      });
    }
    if (result.video && result.video !== null) {
      await delete_file(result.video.path);
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
