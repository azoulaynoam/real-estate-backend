"use strict";
import connection from "../../db/connections";
import { Schema } from "mongoose";

interface ISession {
  user_id: Schema.Types.ObjectId;
  token: string;
  login_date: Date;
  ip_address: string;
  expireAt: Date;
}

/**
 * Represents a loggin session for the admin panel
 */
const SessionSchema = new Schema<ISession>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      require: true,
    },
    token: {
      type: String,
      require: true,
      unique: true,
    },
    login_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ip_address: {
      type: String,
      require: true,
    },
    expireAt: {
      type: Date,
      index: { expires: "7d" },
    },
  },
  { timestamps: true }
);

const sessionModel = connection.model<ISession>("Sessions", SessionSchema);
export { sessionModel, ISession };
