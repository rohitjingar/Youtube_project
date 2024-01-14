import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User}  from "../models/user.model.js"   // this is responsible for the intracting with the db
import {uploadOnCloudinary}  from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
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
      if( username===undefined || username==="" ){
           throw new ApiError(400,"username is required")
      }
      else if(fullName=== undefined || fullName===""){
           throw new ApiError(400,"fullname is required")
      }
      else if(email=== undefined || email ===""){
           throw new ApiError(400,"email is required")
      }
      else if(password=== undefined || password===""){
        throw new ApiError(400,"password is required")  
      }
      
      //step3:
      const existedUser  = await  User.findOne({
          $or: [{ username },{ email }]
      })
      
      if(existedUser){
          throw new ApiError(409, "User with this email or username already exists")
      }
      
      //step4:
      const avatarLocalPath = req.files?.avatar[0]?.path;
      let coverImageLocalPath ;

      if(!avatarLocalPath){
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

export {registerUser}