import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN
}))

//Configuration to store data

app.use(express.json({limit:"10kb"}))   //for forms etc where data will come in json format
app.use(express.urlencoded({extended:true,limit:"10kb"}))  //for url data as url data will not contain spaces and 
//other some things, so this will convert that to the format so that server can understand it

app.use(express.static("public"))       //As I have public folder to store images,pdf etc static files
app.use(cookieParser())

//Importing Router
import userRouter from "./routes/user.route.js"

//routes declaration
app.use("/api/user",userRouter) //http://localhost:8000/api/user/


export default app;