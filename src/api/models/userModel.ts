"use strict";
import { model as mongooseModel, Schema, Document } from "mongoose";

interface IUser extends Document {
  username: string;
  password: string;
  permission: number;
}

var UserSchema = new Schema<IUser>({
  username: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  permission: {
    type: Number,
    enum: [0, 1, 2],
    default: 0,
  },
});

const UserModel = mongooseModel("Users", UserSchema);
export { IUser, UserModel };
