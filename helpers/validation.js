const { check } = require("express-validator");

const registerValidator = [
  check("name", "Name is required").not().isEmpty(),
  check("email", "Please enter a valid email").isEmail().normalizeEmail({
    gmail_remove_dots: true,
  }),
  check("mobile", "Please enter a valid mobile number")
    .isLength({
      min: 10,
      max: 10,
    })
    .isNumeric()
    .withMessage("Mobile number must contain only digits"),
  check(
    "password",
    "Password must contain one special character, one capital letter, one small letter, and one number"
  ).isStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }),

  check("image")
    .custom((value, { req }) => {
      if (
        req.file &&
        (req.file.mimetype === "image/jpeg" ||
          req.file.mimetype === "image/png")
      ) {
        return true;
      }
      return false;
    })
    .withMessage("Please upload an image in JPEG or PNG format"),
];

const sendMailVerificationValidtor = [
  check("email", "Please enter a valid email").isEmail().normalizeEmail({
    gmail_remove_dots: true,
  }),
];

const passwordValidtor = [
  check("email", "Please enter a valid email").isEmail().normalizeEmail({
    gmail_remove_dots: true,
  }),
];

const loginValidator = [
  check("email", "Please enter a valid email").isEmail().normalizeEmail({
    gmail_remove_dots: true,
  }),
  check("password", "Password is required").not().isEmpty(),
];

const updateProfileValidator = [
  check("name", "Name is required").not().isEmpty(),
  check("mobile", "Please enter a valid mobile number")
    .isLength({
      min: 10,
      max: 10,
    })
    .isNumeric()
    .withMessage("Mobile number must contain only digits"),
];


module.exports = {
  registerValidator,
  sendMailVerificationValidtor,
  passwordValidtor,
  loginValidator,
  updateProfileValidator,
};
