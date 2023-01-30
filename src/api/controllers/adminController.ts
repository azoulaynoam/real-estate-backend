"use strict";

import { Request, Response } from "express";
import { Document, CallbackError, Types } from "mongoose";
import { IUser, UserModel } from "../models/userModel";
import session from "../controllers/sessionController";
import bcryptjs from "bcryptjs";

/**
 * Logging a user and storing a cookie with a token with experation of 1 week.
 */
const login = async (
  req: Request<any, any, { username: string; password: string }>,
  res: Response
) => {
  const user = await UserModel.findOne({
    username: req.body.username,
  });
  if (!user) {
    res.status(401).send("Error: Username Not Found.");
  } else {
    bcryptjs.compare(
      req.body.password,
      user.password,
      async (err: Error, truePass: boolean) => {
        if (truePass) {
          let ip = req.socket.remoteAddress;
          const token = await session.create_session(user, ip);
          const maxAge = 7 * 24 * 60 * 60 * 1000; // Thats a 1 week in miliseconds
          res
            .status(200)
            .cookie("access_token", token, {
              maxAge: maxAge,
              httpOnly: process.env.NODE_ENV === "DEVELOPMENT" ? false : true,
              secure: true,
              sameSite:
                process.env.NODE_ENV === "DEVELOPMENT" ? "none" : undefined,
            })
            .send("Logged in succesfully.");
        } else {
          res.status(401).send("Error: Wrong Password.");
        }
      }
    );
  }
};

/**
 * Logging a user out.
 */
const log_out = function (req: Request, res: Response) {
  session.delete_session(req, res);
};

/**
 * Registeration
 */
const register = async (req: Request, res: Response) => {
  bcryptjs.hash(
    req.body.password,
    10,
    async (err: Error, password_hash: string) => {
      if (err) {
        res.status(401).send("Error: Please enter password.");
      } else {
        var new_user = new UserModel({
          username: req.body.username,
          password: password_hash,
        });
        await new_user.save(
          {},
          async (
            err: CallbackError,
            user: Document<unknown, any, IUser> &
              IUser & {
                _id: Types.ObjectId;
              }
          ) => {
            if (err) {
              res.status(401).json(err.message);
            } else {
              var token = await session.create_session(
                user,
                req.socket.remoteAddress
              );
              var maxAge = 7 * 24 * 60 * 60 * 1000; // Thats a 1 week in miliseconds
              res
                .status(200)
                .cookie("access_token", token, {
                  maxAge: maxAge,
                  httpOnly: true,
                  secure: false,
                })
                .send("Registered succesfully.");
            }
          }
        );
      }
    }
  );
};

export default { login, log_out, register };
