import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User}  from "../models/user.model.js"   // this is responsible for the intracting with the db
import {uploadOnCloudinary}  from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
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
               await User.findByIdAndDelete(
                    req.user._id,
                    {
                       $set:{
                            refreshToken:undefined
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
                 throw new ApiError(401, "unauthorized request")
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
          .cokkie("accessToken", accessToken, options)
          .cokkie("refreshToken", newRefreshToken, options)
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
export {registerUser,loginUser,logoutUser,refreshAccessToken}