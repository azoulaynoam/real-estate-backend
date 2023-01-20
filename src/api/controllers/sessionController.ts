"use strict";

import { Request, Response } from "express";
import { ISession, sessionModel } from "../models/sessionModel";
import mongoClient from "../../server";
import { IUser } from "../models/userModel";
import crypto from "crypto";
var Session = mongoClient.model<ISession>("Sessions");
var User = mongoClient.model<IUser>("Users");

var token_generator = function () {
  return (
    crypto.randomBytes(8).toString("hex") +
    "-" +
    crypto.randomBytes(8).toString("hex") +
    "-" +
    crypto.randomBytes(8).toString("hex")
  );
};

/*
Middleware for token based authentication.
*/
const middleware = (req: Request, res: Response, next: Function) => {
  Session.findOne(
    { token: req.cookies.access_token },
    function (err: Error, session: ISession) {
      if (err || session === null) {
        res.sendStatus(401);
      } else {
        User.findOne(
          { _id: session.user_id },
          function (err: Error, user: IUser) {
            if (err || session === null) {
              console.log("User not found.");
              res.sendStatus(401);
            } else {
              res.locals.user = user;
              next();
            }
          }
        );
      }
    }
  );
};

const create_session = async (user: IUser, ip_address: string) => {
  let token = await token_generator();
  let check = await sessionModel.findOne({ token: token });
  while (check) {
    token = await token_generator();
    check = await sessionModel.findOne({ token: token });
  }
  const session = new Session({
    user_id: user._id,
    token: token,
    ip_address: ip_address,
  });
  await session.save();
  return session.token;
};

const delete_session = async (req: Request, res: Response) => {
  Session.findOneAndDelete(
    { token: req.cookies.access_token },
    function (err: Error, session: ISession) {
      if (err) res.sendStatus(404);
      else res.sendStatus(200);
    }
  );
};

const check_token = async (req: Request, res: Response) => {
  Session.findOne(
    { token: req.cookies.access_token },
    async (err: Error, session: ISession) => {
      if (err || session === null) {
        res.sendStatus(401);
      } else {
        await User.findOne(
          { _id: session.user_id },
          function (err: Error, user: IUser) {
            if (err || session === null) {
              res.sendStatus(401);
            } else {
              res.sendStatus(202);
            }
          }
        );
      }
    }
  );
};

export default { middleware, create_session, delete_session, check_token };
