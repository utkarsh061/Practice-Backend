import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req,res) => {
    //data lena UI se
    //validation if data is coming 
    //check if user already exist
    //check for images and avatar
    //upload them to cloudinary
    //writing it to DB
    //remove password amd refresh token from response
    //check for user creation
    //returning a response to show data is saved

    const {username,fullName,email,password} = req.body

    //validation if data is coming 

    // if(fullName === ""){
    //     throw new ApiError(400,"FullName is required")
    // }  
                    //OR
    if(
        [username,fullName,email,password].some((field) => 
            field?.trim() ==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    //check if user already exist
    const existedUser = await User.findOne({  
        $or: [{email},{username}], 
    })
    //we can use findOne two times for email and username specifically but using $or will help us to check email and username 
    //simultaneosly so that we don't have to write extra code, there are other funcationalities as well like $and , $comment
    if(existedUser){
        throw new ApiError(409,"User with email/username already Present")
    }

    //check for images and avatar & check avatar
    // const avatarLocalPath=req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log("Request:", req.files)

    // if(!avatarLocalPath){
    //     throw new ApiError(400,"Avatar file is required")
    // }

    //upload them to cloudinary
    // const avatar=await uploadOnCloudinary(avatarLocalPath)
    // const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    // console.log("avatar:",avatar)
    // console.log("coverImage",coverImage)
    // if(!avatar){
    //     throw new ApiError(400,"Avatar file is required")
    // }

    //writing it to DB
    const user = await User.create({
        fullName,
        // avatar:avatar.url || "",
        // coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refressToken"                  //selest let us select which fields we want(but in string we pass 
    )                                              //the fields(with "-" sign) that we don't need as by default all fields are selected)
    if(!createdUser){
        throw new ApiError(500,"Internal Server Error, Unable to Register User")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
})

export {registerUser};