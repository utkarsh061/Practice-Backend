// require('dotenv').config({path:"./env"})
import dotenv from "dotenv"
import connectDB from "./db/databse.js";

dotenv.config({
    path:'./env'
})

connectDB().then(() =>{

    app.on("error", (error) => {
        console.log("Application is not able to communicate with Databse:", error)
    })
    
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`App is Running on Port ${process.env.PORT}`)
    })
}).catch((err) => {
    console.log("MongoDB connection failed !!!",err)
})