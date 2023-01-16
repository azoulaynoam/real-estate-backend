"use strict";

import { Request, Response } from "express";
import mongoose from "mongoose";
import mongoClient from "../../server";
import { IUser } from "../models/userModel";
import bcryptjs from "bcryptjs";
var create_session = require("../controllers/sessionController").create_session;
var delete_session = require("../controllers/sessionController").delete_session;
var User = mongoClient.model<IUser>("Users");

/**
 * Logging a user and storing a cookie with a token with experation of 1 week.
 */
exports.login = function (req: Request, res: Response) {
  User.findOne(
    {
      username: req.body.username,
    },
    function (err: Error, user: IUser) {
      if (err || user === null) {
        res.status(401).send("Error: Username Not Found.");
      } else {
        bcryptjs.compare(
          req.body.password,
          user.password,
          (err: Error, truePass: boolean) => {
            if (truePass) {
              let ip = req.socket.remoteAddress;
              const token = create_session(user, ip);
              const maxAge = 7 * 24 * 60 * 60 * 1000; // Thats a 1 week in miliseconds
              res
                .status(200)
                .cookie("access_token", token, {
                  maxAge: maxAge,
                  httpOnly: true,
                  secure: true,
                })
                .send("Logged in succesfully.");
            } else {
              res.status(401).send("Error: Wrong Password.");
            }
          }
        );
      }
    }
  );
};

/**
 * Logging a user out.
 */
exports.log_out = function (req: Request, res: Response) {
  delete_session(req, res);
};

/**
 * Registeration
 */
exports.register = function (req: Request, res: Response) {
  bcryptjs.hash(
    req.body.password,
    10,
    function (err: Error, password_hash: string) {
      if (err) {
        res.status(401).send("Error: Please enter password.");
      } else {
        var new_user = new User({
          username: req.body.username,
          password: password_hash,
        });
        new_user.save({}, (err: mongoose.CallbackError, user: IUser) => {
          if (err) {
            res.status(401).json(err.message);
          } else {
            var token = create_session(user, req.socket.remoteAddress);
            var maxAge = 7 * 24 * 60 * 60 * 1000; // Thats a 1 week in miliseconds
            res
              .status(200)
              .cookie("access_token", token, {
                maxAge: maxAge,
                httpOnly: true,
                secure: true,
              })
              .send("Registered succesfully.");
          }
        });
      }
    }
  );
};
