"use strict";
import { Schema } from "mongoose";
import connection from "../../db/connections";

interface IUser {
  username: string;
  password: string;
  permission: number;
}

var UserSchema = new Schema<IUser>(
  {
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
  },
  { timestamps: true }
);

const UserModel = connection.model("Users", UserSchema);
export { IUser, UserModel };
