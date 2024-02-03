import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User}  from "../models/user.model.js"   // this is responsible for the intracting with the db
import {uploadOnCloudinary}  from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
const generateAccessAndRefereshTokens = async (userId) =>{
       try{

           const user = await User.findById(userId)
           const accessToken= user.generateAccessToken()
           const refreshToken = user.generateRefreshToken()

           user.refreshToken = refreshToken
           await user.save({validateBeforeSave:false})

           return {accessToken,refreshToken}
       }
       catch(error){
           throw new ApiError(500, "Something went wrong while generate refresh and access token")
       }
}
const registerUser = asyncHandler(async (req,res) =>{
      // step1:  get user details from frontend
      // step2:  validation like its should not be empty
      // step3:  check if user already exits: username, email
      // step4:  check for images, check for avatar
      // step5:  upload them to cloudinary , avatar
      // step6:  create user object - create entry in db
      // step7:  remove password and refresh token field from response
      // step8:  check for user creation
      //  return res

      //step1:
      const {username,fullName,email,password} = req.body
      
      //step2:
      if( username==="" ){
           throw new ApiError(400,"username is required")
      }
      else if(fullName===""){
           throw new ApiError(400,"fullname is required")
      }
      else if( email ===""){
           throw new ApiError(400,"email is required")
      }
      else if( password===""){
        throw new ApiError(400,"password is required")  
      }
      //console.log(username);
      //step3:
      const existedUser  = await  User.findOne({
          $or: [{ username },{ email }]
      })
      
      if(existedUser){
          throw new ApiError(409, "User with this email or username already exists")
      }
     // console.log(username);
      //step4:
      let avatarLocalPath ;
      let coverImageLocalPath ;
      
      if(req.files && req.files.avatar && req.files.avatar[0].path){
          avatarLocalPath = req.files.avatar[0].path
      }
      else{
          throw new ApiError(400,"Avatar file is required")
      }
      
      if(req.files && req.files.coverImage && req.files.coverImage[0].path){
              coverImageLocalPath = req.files.coverImage[0].path
      }
      // step5:
      const avatar = await uploadOnCloudinary(avatarLocalPath)
      const coverImage = await uploadOnCloudinary(coverImageLocalPath)

      if(!avatar){
        throw new ApiError(400,"Avatar file is required")
      }
      
      // step6: 

      const user = await User.create({
           fullName,
           avatar:  avatar.url,
           coverImage: coverImage?.url || "",
           email,
           password,
           username: username.toLowerCase()
      })
      
      // step7:
      const createdUser = await User.findById(user._id).select(
           "-password -refreshToken"
      )
      
      // step8:
      if(!createdUser){
          throw new ApiError(500, "Something went wrong while registering the user")
      }
      
      return res.status(201).json(new ApiResponse(200,createdUser,"User registered Successfully"))
})
const loginUser = asyncHandler(async(req,res)=>{
        // req body -> data
        // username or email
        // find thr user
        // password check
        // acces and refresh token
        // send the cookie

        const {email , username, password} = req.body
        if(!username && !email){
              throw new ApiError(400, "username or password is required")
        }
        const user = await User.findOne({
             $or:[{username},{email}]
        })
        if(!user){
              throw new ApiError(404, "User does not exist")
        }

        const isPasswordValid =  await user.isPasswordCorrect(password)

        if(!isPasswordValid){
              throw new ApiError(401,"Invalid user credentials")
        }

        const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
        const options = {
            httpOnly: true,
            secure:true
        }

        return res.status(200).cookie("accessToken", accessToken , options)
        .cookie("refreshToken", refreshToken,options)
        .json(
             new ApiResponse(
                  200,
                  {
                    user:loggedInUser, 
                    accessToken,
                    refreshToken
                  },
                  "User logged In successfully"
             )
        )

})

const logoutUser = asyncHandler(async (req,res)=>{
               await User.findByIdAndUpdate(
                    req.user._id,
                    {
                       $unset:{
                            refreshToken:1
                       }
                    },
                    {
                         new: true
                    }
               )

               const options = {
                    httpOnly: true,
                    secure:true
                }

               return res.status(200).clearCookie("accessToken",options)
               .clearCookie("refreshToken",options)
               .json(new ApiResponse(200,{},"User logged Out"))

})

const refreshAccessToken = asyncHandler(  async(req,res)=>{
     const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
     
     if(!incomingRefreshToken){
          throw new ApiError(401, "unauthorized request")
     }

     try {
          const decodedToken =  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
     
          const user = await User.findById(decodedToken?._id)
     
          if(!user){
                 throw new ApiError(401, "Invalid refresh token")
          }
     
          if(incomingRefreshToken !== user?.refreshToken){
               throw new ApiError(401,  "Refresh token is expired or used")
          }
          
          const options = {
                httpOnly:  true,
                secure:  true
          }
     
          const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
     
          return res.status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", newRefreshToken, options)
          .json(new ApiResponse
               (
                    200,
                    {accessToken, refreshToken:newRefreshToken},
                    "Access token refreshed successfully"
               )
               )
     } catch (error) {
          throw new ApiError(401,  error?.message ||  "Invalid refresh token")
     }
}
)

const changeCurrentPassword = asyncHandler( async (req,res) =>{
       const {oldPassword, newPassword} = req.body
       const user = await User.findById(req.user?._id)
       
       const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
       if(!isPasswordCorrect){
            throw new ApiError(400, "Invalid old password")
       }

       user.password = newPassword
       await user.save({validateBeforeSave:false})
       return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req,res) =>{
     return res.status(200).json(new ApiResponse(200,req.user,"current user fetched successfully"))
})
const updateAccountDetails = asyncHandler(async (req,res)=>{
      const {email,fullName} = req.body
      if(!email && !fullName ){
          throw new ApiError(400,"email or fullName is required")
      }

      const user = await User.findByIdAndUpdate(res.user?._id,
              {
                $set: {
                    fullName:fullName,
                    email:email
                }
              },
              {
                  new:true
              }
          ).select("-password")


       return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))
})
const  updateUserAvatar = asyncHandler(async(req,res)=>{
     const avatarLocalPath = req.file?.path
     if(!avatarLocalPath){
            throw new ApiError(400, "Avatar file is missing")
     }
     const avatar = await uploadOnCloudinary(avatarLocalPath)
     if(!avatar.url){
          throw new ApiError(400, "Error while uploading on avatar")
     }
     const user = await User.findByIdAndUpdate(
           req.user?._id,
           {
              $set: {
                   avatar: avatar.url
              }
           },
           {
              new:true
           }
     ).select("-password")

     return res.status(200).json(new ApiResponse(200, user, "Avatar file update successfully"))
})
const  updateCoverImage = asyncHandler(async(req,res)=>{
     const coverImageLocalPath = req.file?.path
     if(!coverImageLocalPath){
            throw new ApiError(400, "Avatar file is missing")
     }
     const coverImage = await uploadOnCloudinary(coverImageLocalPath)
     if(!coverImage.url){
          throw new ApiError(400, "Error while uploading on avatar")
     }
     const user = await User.findByIdAndUpdate(
           req.user?._id,
           {
              $set: {
               coverImage: coverImage.url
              }
           },
           {
              new:true
           }
     ).select("-password")

     return res.status(200).json(new ApiResponse(200, user, "CoverImage update successfully"))
})
const getUserChannelProfile = asyncHandler( async (req,res)=>{
        

     const {username} = req.params
     if(!username?.trim()){
         throw new ApiError(400, "username is missing")
     }

     const channel =  await  User.aggregate([
          {
              $match : {
                 username: username?.toLowerCase()
              }
          },
          {
             $lookup:{
               from: "subscriptions",
               localField : "_id",
               foreignField: "channel",
               as: "subscribers"
             }
          },
          {
                $lookup:{
                     from: "subscriptions",
                     localField :"_id",
                     foreignField: "subscriber",
                     as: "subscribedTo"
                }
          },
          {
             $addFields: {
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                         if:{$in: [req.user?._id , "$subscribers.subscriber"]},
                         then : true,
                         else:  false
                    }
                }
             }
          },
          {
             $project:{
                 fullName: 1,
                 username:1,
                 subscribersCount:1,
                 channelsSubscribedToCount:1,
                 isSubscribed:1,
                 avatar:1,
                 coverImage:1,
                 email:1
             }
          }
     ])
     if(!channel?.length){
          throw new ApiError(404, "channel does not exists")
     }

     return res.status(200).json(
          new ApiResponse(200, channel[0], "User Channel fetched successfully")
     )
})

const getWatchHistory = asyncHandler( async (req,res)=>{
     const user = await User.aggregate([
           
          {
               $match:{
                    _id: new mongoose.Types.ObjectId(req.user._id)
               }
          },
          {
               $lookup:{
                    from: "videos",
                    localField:"watchHistory",
                    foreignField:"_id",
                    as:"watchHistory",
                    pipeline:[
                         {
                              $lookup:{
                                   from: "users",
                                   localField: "owner",
                                   foreignField:"_id",
                                   as: "owner",
                                   pipeline:[
                                        {
                                             $project:{
                                                  fullName:1,
                                                  username:1,
                                                  avatar:1
                                             }
                                        }
                                   ]
                              }
                         },
                         {
                               $addFields:{
                                    owner:{
                                        $first: "$owner"
                                    }
                               }
                         }
                    ]
               }
          }


     ])

     return res.status(200).json(new ApiResponse(
           200,
           user[0].watchHistory,
           "Watch History fetched successfully"
     ))


})
export 
{    registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     updateUserAvatar,
     updateCoverImage,
     getUserChannelProfile,
     getWatchHistory
}