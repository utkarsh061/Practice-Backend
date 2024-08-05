import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
        if(!incomingRefreshToken){
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

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    if(user){
        throw new ApiError(500,"Internal Server Error, Not able to locate User")
    }
    const isPassworCorrect =await user.isPassworCorrect(oldPassword)
    if(!isPassworCorrect){
        throw new ApiError(401,"Invalid Credentials")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(
        new ApiResponse(200,{},"Password changed Successfully")
    )
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    const currentUser = req.user.select("-_id -refreshToken")
   return res.status(200).json(
    new ApiResponse(
        200,
        currentUser,
        "Current User fetched Successfully"
    )
   )
})

const updateAccountDetails = asyncHandler(async (req,res) => {
    const { fullName, email } =req.body
    if(!fullName || !email){
        throw new ApiResponse(400,"All fileds are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { fullName,email: email }  //both ways are sam e as key is same both sides
        },
        {new:true}
    ).select("-password") 

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Account Updated Successfully"
        )
    )
})

const updateUserAvatar =asyncHandler(async (req,res) => {
    const avatarLocalPath =  req.file?.path 
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar?.url){
        throw new ApiError(400,"Error while uploading on cloudinary")
    }
    const user = await User.findByIdAndUpdate(req?.user._id,
        {
            $set: {avatar:avatar.url}
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(
            200,
            user ,
            "Avatar Updated Successfully"
        )
    )
})

const updateUserCoverImage =asyncHandler(async (req,res) => {
    const coverImageLocalPath =  req.file?.path 
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage?.url){
        throw new ApiError(400,"Error while uploading on cloudinary")
    }
    const user = await User.findByIdAndUpdate(req?.user._id,
        {
            $set: {coverImage:coverImage.url}
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Cover Image Updated Successfully"
        )
    )
})
//aggregation Pipelines

const getUserChannelProfile = asyncHandler(async (req,res) => {
    const { username } = req.params;
    if(!username?.trim()){
        throw new ApiError(400,"Username is missing")
    }
     const channel = await User.aggregate([
        {
            $match:{                            //It filter out data based on the field given(Like "Where")
            username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",   //table model name(plural) for Subscribers Table
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{                       //it's like JOINS where we mix data from table mentioned
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        //We have now collected the data and now we are ready for performing the operations
        {
            $addFields:{   //will keep the fields that it has and then add the rest fields to single object
                subscribersCount:{
                    $size: "$subscribers"  //use $ because now subscribers are fileds, $size will count the number of field(subscribers)
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $condition:{
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"],  //$in -> check present h ya nhi iske andar
                            then:true,
                            else:false
                        }
                    }
                }
            }  
        //after %addFields Pipeline, these three fields will get added to the User Table(not in database) so that we can work on it

        },
        {
            $project:{    // $project will give us projection that we will not project all fields that are present, we will only 
                //give selected fields 
                fullName:1,
                username:1,    //give 1 to the fields you want to select, ignore rest
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                email:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel doesn't exits")
    }
    return res.status(200).json(
        new ApiResponse(
            200,
            channel[0],
            "User channel fetched Successfully"
        )
    )
})
const getWatchHistory = asyncHandler(async (req,res) =>{
    const user = await User.aggregate(
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{  
                            owner:{  //using owner because by using this new field will not get created and the existing 'owner' 
                                //field with array value will get replaced with object
                                $first:"$owner"  //pick first element of an array field
                            }
                        }
                    }
                ]
            }
        }
    )

    return res.status(200).json(
        new ApiResponse(
            200,
            user[0]?.watchHistory,
            "Watch History fetched Successfully"
        )
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};