import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,  //remove leading and trailing zeroes
        index:true  //to optimize searching field in DB
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,  //remove leading and trailing zeroes
    },
    fullName:{
        type:String,
        required:true,
        trim:true,  
        index:true  
    },
    avatar:{
        type:String, 
        // required:true,
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type:mongoose.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,"Password is Required"]
    },
    refreshToken:{
        type:String
    }
},{timestamps:true})

userSchema.pre("save", async function(next){
    if(this.isModified("password")){  //to check if "password" is modified
        this.password = await bcrypt.hash(this.password,10)
    }
    next()
})

//Mongoose Schema have "methods" object where we can add as much as methods as we want 

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)   //it returns True/False
}          

userSchema.methods.generateAccessToken = function(){
   const token =  jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    return token
}
//We have created two tokens to increase security, One will be used as "Cookies" and the other will be "Session"
userSchema.methods.generateRefreshToken = function(){
    const token = jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
    return token
}

export const User = mongoose.model("User", userSchema)