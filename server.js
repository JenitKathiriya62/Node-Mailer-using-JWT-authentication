require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const PORT = process.env.PORT | 3000;
const app = express();
mongoose.connect('mongodb://127.0.0.1:27017/restful-auth-apis')

app.set("view engine","ejs");
app.set("views","./views")

const userRouter = require("./routes/userRoute")
app.use("/api",userRouter);

const authRouter = require("./routes/authRoute")
app.use("/",authRouter);




app.listen(PORT, () => {
  console.log("Server Started");
});
