"use strict";
import { Document, Schema, model as mongooseModel } from "mongoose";
const { json } = require("express");

interface IProperty extends Document {
  action: string;
  status: boolean;
  free_text_en: string;
  free_text_he: string;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  size: number;
  price: number;
  video: string;
  images: string[];
  createdAt: Date;
}

/**
 * Represents a property
 * @constructor
 * @param {String} action - Sell or Rent
 * @param {Boolean} status - Is it still avaliable or not
 * @param {String} free_text - Apartment description
 * @param {Number} rooms - Number of rooms
 * @param {Number} bedrooms - Number of bedrooms
 * @param {Number} bathrooms - Number of bathrooms
 * @param {Number} size - Size of the apartment in Square Meters
 * @param {Number} price - Price of the apartment
 * @param {String} video - path to video
 * @param {[String]} images - An array of images
 */

var PropertySchema = new Schema<IProperty>({
  action: {
    type: String,
    enum: ["sell", "rent"],
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
  },
  free_text_en: {
    type: String,
    required: true,
    maxlength: 380,
  },
  free_text_he: {
    type: String,
    required: true,
    maxlength: 380,
  },
  rooms: {
    type: Number,
    required: true,
  },
  bedrooms: {
    type: Number,
    required: true,
  },
  bathrooms: {
    type: Number,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  video: {
    type: String,
    required: false,
  },
  images: {
    type: [JSON],
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongooseModel("Properties", PropertySchema);
