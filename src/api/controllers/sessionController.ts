"use strict";

import { NextFunction, Request, Response } from "express";
import { ISession, sessionModel as Session } from "../models/sessionModel";
import { IUser, UserModel } from "../models/userModel";
import crypto from "crypto";
import { Document, Types } from "mongoose";

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
const middleware = (req: Request, res: Response, next: NextFunction) => {
  Session.findOne(
    { token: req.cookies.access_token },
    function (err: Error, session: ISession) {
      if (err || session === null) {
        res.sendStatus(401);
      } else {
        UserModel.findOne(
          { _id: session.user_id },
          function (err: Error, user: IUser) {
            if (err || session === null) {
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

const create_session = async (
  user: Document<unknown, any, IUser> &
    IUser & {
      _id: Types.ObjectId;
    },
  ip_address?: string
) => {
  let token = await token_generator();
  let check = await Session.findOne({ token: token });
  while (check) {
    token = await token_generator();
    check = await Session.findOne({ token: token });
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
  if (!req.cookies.access_token) {
    res.sendStatus(401);
  } else {
    const session = await Session.findOne({ token: req.cookies.access_token });
    if (!session) {
      res.sendStatus(401);
    } else {
      await UserModel.findOne({ _id: session.user_id })
        .then((user) => {
          res.sendStatus(200);
        })
        .catch((err) => {
          res.sendStatus(401);
        });
    }
  }
};

export default { middleware, create_session, delete_session, check_token };
