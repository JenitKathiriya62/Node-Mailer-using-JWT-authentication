const express = require("express");
const router = express();
router.use(express.json());
const path = require("path");
const multer = require("multer");
const auth = require("../middleware/auth");
const { userRegister,sendMailVerification,forgotPassword, loginUser, profileUser, updateProfile, refreshToken, logout} = require("../controllers/userControllers");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, path.join(__dirname, "../public/images"));
    }
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

const { registerValidator,sendMailVerificationValidtor,passwordValidtor,loginValidator,updateProfileValidator} = require("../helpers/validation");

router.post("/register", upload.single("image"), registerValidator,userRegister);
router.post("/send-mail-verification",sendMailVerificationValidtor,sendMailVerification)
router.post("/forgot-password", passwordValidtor,forgotPassword)
router.post("/login",loginValidator,loginUser)
router.get("/profile",auth,profileUser)
router.post("/update-profile",auth,upload.single("image"),updateProfileValidator,updateProfile)
router.get("/refresh-token",auth,refreshToken);
router.get("/logout",auth,logout);


module.exports = router;
