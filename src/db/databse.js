import mongoose from "mongoose";
import { DB_Name } from "../constants.js";
import express from "express";

const app = express()

const connectDB = async () =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)

        console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`)

        // app.on("error",(error) =>{
        //     console.log("Application not able to communicate with Databse:",error)
        //     throw error
        // })  

        // app.listen(process.env.PORT, () => {
        //     console.log(`App is connected on Port ${process.env.PORT}`)
        // })
        
    } catch (error) {
        console.log("Mongo Database is unable to connect:",error)
        process.exit(1)
    }
}

export default connectDB;