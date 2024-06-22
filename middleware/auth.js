const jwt = require("jsonwebtoken");
const Blacklist = require("../models/blacklist");
const config = process.env;
const verifyToken = async (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["authorization"];

  if (!token) {
    return res.status(403).json({
      success: false,
      msg: "A Token is required for authentication",
    });
  }

  try {
    const bearer = token.split(" ");
    const bearerToken = bearer[1];
    const blacklistToken = await Blacklist.findOne({ token: bearerToken });
    if(blacklistToken){
      return res.status(400).json({
        success: false,
        msg: "This session has expired, please re-login",
      });
    }


    const decodedData = jwt.verify(bearerToken, config.ACCESS_SECRET_TOKEN);
    req.user = decodedData;
  } catch (error) {
    return res.status(401).json({
      success: false,
      msg: "Invalid Token",
    });
  }

  return next();
};

module.exports = verifyToken;
