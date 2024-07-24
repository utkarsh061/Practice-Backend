// require('dotenv').config({path:"./env"})
import dotenv from "dotenv"
import connectDB from "./db/databse.js";

dotenv.config({
    path:'./env'
})

connectDB();