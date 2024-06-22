const express = require("express");
const router = express();
router.use(express.json());
const bodyparser = require("body-parser");
const userControllers = require('../controllers/userControllers');
router.use(bodyparser.json());
router.use(bodyparser.urlencoded({extended:true}));



router.get("/mail-verification",userControllers.mailVerification);
router.get("/reset-password",userControllers.resetPassword);
router.post("/reset-password",userControllers.updatePassword);
router.get("/reset-sucess",userControllers.resetSuccess);


module.exports = router;
