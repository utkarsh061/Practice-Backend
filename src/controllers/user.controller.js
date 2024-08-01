import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()
        
        user.refreshToken=refreshToken
        await user.save({ validateBeforeSave: false })  

        return { accessToken,refreshToken }
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generation Refresh and Access Token")
    }
}

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
        username:username?.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"                  //selest let us select which fields we want(but in string we pass 
    )                                              //the fields(with "-" sign) that we don't need as by default all fields are selected)
    if(!createdUser){
        throw new ApiError(500,"Internal Server Error, Unable to Register User")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
})

const loginUser = asyncHandler(async (req,res) => {
    //check if data is coming from frontEnd
    //check if user is already registered
    //check if password is getting matched
    //create access and refresh token and send it to user via cookies
    //send response 

    const {username,email,password} = req.body
    if(!(username || email)){
        throw new ApiError(400,"Username or email is required")
    }
    const user = await User.findOne({
        $or : [{email} , {username}],
    })
    if(!user){
        throw new ApiError(404,"User Does Not Exist")
    }
    const isPassworCorrect =  await user.isPasswordCorrect(password) 
    if(!isPassworCorrect){      //don't use "User" as it's an mongoDB object, it won't be able to access the methods created by us
        throw new ApiError(401,"Invalid User Credentials")
    }
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken" 
    )
    //Passing secure cookies
    const options ={
        httpOnly:true,       // As Cookies can be modified by default,
        secure:true          // By passing these two parameters, Cookies can only be modified by Server
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User Logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req,res) => {
    const userID = req.user._id
    await User.findByIdAndUpdate(
        userID,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true  //to give response with new and updated value instead of the old value
        }
    )
    const options ={
        httpOnly:true,       // As Cookies can be modified by default,
        secure:true          // By passing these two parameters, Cookies can only be modified by Server
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new ApiResponse(
            200,
            {},
            "User Logged out Successfully"
            )
    )
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    try {
        const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
        if(incomingRefreshToken){
            throw new ApiError(401,"Unauthorized Request")
        }
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token Expired or used")
        }
        const options = {
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }

})
export {registerUser,loginUser,logoutUser,refreshAccessToken};