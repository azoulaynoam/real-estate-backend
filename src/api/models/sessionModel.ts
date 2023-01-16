"use strict";
import { Schema, model as mongooseModel } from "mongoose";

interface ISession extends Document {
  user_id: Schema.Types.ObjectId;
  token: string;
  login_date: Date;
  ip_address: string;
  expireAt: Date;
}

/**
 * Represents a loggin session for the admin panel
 */
const SessionSchema = new Schema<ISession>({
  user_id: {
    type: Schema.Types.ObjectId,
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
});

export default mongooseModel("Sessions", SessionSchema);
