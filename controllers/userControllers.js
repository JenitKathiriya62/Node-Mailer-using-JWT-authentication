const User = require("../models/userModel");
const Blacklist = require("../models/blacklist");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const mailer = require("../helpers/mailer");
const mongoose = require("mongoose");
const randomstring = require("randomstring");
const PasswordReset = require("../models/passwordReset");
const passwordReset = require("../models/passwordReset");
const path = require("path");
const { deleteFile } = require("../helpers/deleteFile");
const jwt = require("jsonwebtoken");

const userRegister = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }
    const { name, email, mobile, password } = req.body;
    const isExist = await User.findOne({ email });
    if (isExist) {
      return res.status(400).json({
        success: false,
        msg: "Email Already Used!",
      });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      mobile,
      password: hashPassword,
      image: "images/" + req.file.filename,
    });

    const userData = await user.save();

    const msg =
      "<p>Hello " +
      name +
      ', Please <a href="http://127.0.0.1:3000/mail-verification?id=' +
      userData._id +
      '">Verify</a> your Mail.</p>';

    mailer.sendMail(email, "Mail Verification", msg);

    return res.status(200).json({
      success: true,
      msg: "Registered Successfully",
      user: userData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const mailVerification = async (req, res) => {
  var objectId;
  try {
    if (req.query.id === undefined) {
      return res.render("404");
    }
    if (mongoose.Types.ObjectId.isValid(req.query.id)) {
      objectId = new mongoose.Types.ObjectId(req.query.id);
    } else {
      return res.render("mail-verification", { message: "User Not Found!" });
    }

    const userData = await User.findOne({ _id: objectId });
    if (userData) {
      if (userData.is_verified == 1) {
        return res.render("mail-verification", {
          message: "Your Mail already Verified..",
        });
      }
      await User.findByIdAndUpdate(
        { _id: req.query.id },
        {
          $set: {
            is_verified: 1,
          },
        }
      );
      return res.render("mail-verification", {
        message: "Mail Verified Successfully..",
      });
    } else {
      return res.render("mail-verification", { message: "User Not Found!" });
    }
  } catch (error) {
    console.log(error);
    return res.render("404");
  }
};

const sendMailVerification = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "Email Doesn't Exists",
      });
    }

    if (userData.is_verified == 1) {
      return res.status(400).json({
        success: false,
        msg: userData.email + " Already Verified",
      });
    }

    const msg =
      "<p>Hello " +
      userData.name +
      ', Please <a href="http://127.0.0.1:3000/mail-verification?id=' +
      userData._id +
      '">Verify</a> your Mail.</p>';

    mailer.sendMail(userData.email, "Mail Verification", msg);

    return res.status(200).json({
      success: true,
      msg: "Verification Link Send to your Mail, please check",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "Email Doesn't Exists",
      });
    }

    const randomString = randomstring.generate();
    const msg =
      "<p>Hello " +
      userData.name +
      ', Please Click <a href="http://127.0.0.1:3000/reset-password?token=' +
      randomString +
      '">here</a> to reset your password</p>';
    await PasswordReset.deleteMany({ user_id: userData._id });
    const passwordReset = new PasswordReset({
      user_id: userData._id,
      token: randomString,
    });

    await passwordReset.save();

    mailer.sendMail(userData.email, "Reset Password", msg);

    return res.status(201).json({
      success: true,
      msg: "Reset Password Link Send to Your Mail, please check",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    if (req.query.token == undefined) {
      return res.render("404");
    }

    const resetData = await passwordReset.findOne({ token: req.query.token });
    if (!resetData) {
      return res.render("404");
    }

    return res.render("reset-password", { resetData });
  } catch (error) {
    return res.render("404");
  }
};

const updatePassword = async (req, res) => {
  try {
    const { user_id, password, c_password } = req.body;
    const resetData = await PasswordReset.findOne({ user_id });
    if (password != c_password) {
      return res.render("reset-password", {
        resetData,
        error: "Conform Password do not match, Retry",
      });
    }

    const hashPassword = await bcrypt.hash(c_password, 10);
    await User.findByIdAndUpdate(
      { _id: user_id },
      {
        $set: {
          password: hashPassword,
        },
      }
    );

    await PasswordReset.deleteMany({ user_id });

    return res.redirect("/reset-sucess");
  } catch (error) {
    return res.render("404");
  }
};

const resetSuccess = async (req, res) => {
  try {
    return res.render("reset-sucess");
  } catch (error) {
    return res.render("404");
  }
};

const generateAccessToken = async (user) => {
  const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
    expiresIn: "2h",
  });
  return token;
};

const generateRefreshToken = async (user) => {
  const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
    expiresIn: "4h",
  });
  return token;
};

const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(401).json({
        success: false,
        msg: "Email and Password is Incorrect!",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        msg: "Email and Password is Incorrect!",
      });
    }

    if (userData.is_verified == 0) {
      return res.status(401).json({
        success: false,
        msg: "Please Verify your Account!",
      });
    }

    const accessToken = await generateAccessToken({ user: userData });
    const refreshToken = await generateRefreshToken({ user: userData });

    return res.status(200).json({
      success: true,
      msg: "Login Successfully",
      user: userData,
      accessToken: accessToken,
      refreshToken: refreshToken,
      tokenType: "Bearer",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const profileUser = async (req, res) => {
  try {
    const userData = req.user.user;
    return res.status(200).json({
      success: true,
      msg: "User Profile Data",
      data: userData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { name, mobile } = req.body;
    const data = {
      name,
      mobile,
    };

    const user_id = req.user.user._id;

    if (req.file !== undefined) {
      data.image = "images/" + req.file.filename;

      const oldUser = await User.findOne({ _id: user_id });

      const oldFilePath = path.join(__dirname, "../public/" + oldUser.image);
      deleteFile(oldFilePath);
    }

    const userData = await User.findByIdAndUpdate(
      { _id: user_id },
      {
        $set: data,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      msg: "User Data Updated",
      user: userData,
    });
  } catch (error) {
    console.log("errorrrr");
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const userId = req.user.user._id;
    const userData = await User.findOne({ _id: userId });

    const accessToken = await generateAccessToken({ user: userData });
    const refreshToken = await generateRefreshToken({ user: userData });

    return res.status(200).json({
      success: true,
      msg: "Token Refreshed!",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};


const logout = async(req,res)=>{
  try{
   
   const token =  req.body.token || req.query.token || req.headers["authorization"];

    const bearer = token.split(' ');
    const bearerToken = bearer[1];

    const newBlacklist = new Blacklist({
      token:bearerToken
    });

    await newBlacklist.save();

    res.setHeader('Clear-Site-Data','"cookies","strorage"');
    return res.status(200).json({
      success: true,
      msg:'Logout Done',
    });

  }catch(error){
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

module.exports = {
  userRegister,
  mailVerification,
  sendMailVerification,
  forgotPassword,
  resetPassword,
  updatePassword,
  resetSuccess,
  loginUser,
  profileUser,
  updateProfile,
  refreshToken,
  logout,
};
