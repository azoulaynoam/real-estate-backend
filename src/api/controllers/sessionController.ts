"use strict";

var server = require("../../server");
var crypto = require("crypto");
var Session = server.connection.model("Sessions");
var User = server.connection.model("Users");

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
exports.middleware = (req, res, next) => {
  Session.findOne({ token: req.cookies.access_token }, function (err, session) {
    if (err || session === null) {
      res.sendStatus(401);
    } else {
      User.findOne({ _id: session.user_id }, function (err, user) {
        if (err || session === null) {
          console.log("User not found.");
          res.sendStatus(401);
        } else {
          req.user = user;
          next();
        }
      });
    }
  });
};

exports.create_session = function (user, ip_address) {
  var session = new Session({
    user_id: user._id,
    token: token_generator(),
    ip_address: ip_address,
  });
  var generateToken = function (err, token_session) {
    if (err) {
      if (err.errors.token) {
        console.log(err);
        session.token = token_generator();
        session.save(generateToken);
      } else {
        return token_session.token;
      }
    }
  };
  session.save(generateToken);
  return session.token;
};

exports.delete_session = function (req, res) {
  Session.findOneAndDelete(
    { token: req.cookies.access_token },
    function (err, session) {
      if (err) res.sendStatus(404);
      else res.sendStatus(200);
    }
  );
};

exports.check_token = function (req, res) {
  Session.findOne({ token: req.cookies.access_token }, function (err, session) {
    if (err || session === null) {
      res.sendStatus(401);
    } else {
      User.findOne({ _id: session.user_id }, function (err, user) {
        if (err || session === null) {
          res.sendStatus(401);
        } else {
          res.sendStatus(202);
        }
      });
    }
  });
};
