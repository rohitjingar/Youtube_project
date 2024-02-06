import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    const userId = req.user?._id;
    
    if(!content){
        throw new ApiError(400, "tweet content is required")
    }
    
    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }
    const tweet = await Tweet.create({
         content,
         owner: userId
    })
    if(!tweet){
         throw new ApiError(500, "Something went wrong while creating the tweet")
    }
    return res.status(200).json(new ApiResponse(200,tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!userId){
          throw new ApiError(400, "userId not found")
    }
    if(!isValidObjectId(userId)){
          throw new ApiError(400, "userId is not valid ")
    }
    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(400, "user not found")
    }
    const userTweet = await Tweet.find({owner: userId})
    if (userTweet.length === 0) {
        throw new ApiError(400, "No tweets found for this user");
    }    
    return res.status(200).json(new ApiResponse(200, userTweet, "Tweet fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {tweetId} = req.params
    const {content} = req.body 
    
    if(!content){
        throw new ApiError(400, "updated content is required")
    }
    else if(!tweetId){
        throw new ApiError(400, "tweetId is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet updation")
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId,
        {
           $set:{
              content: content
           }
        },
        {
           new:  true
        }
    )

    if(!tweet){
          throw new ApiError(500, "Somthing went worng while updating the tweet")
    }
    return res.status(200).json(new ApiResponse(200, tweet, "tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400, "tweetId is required")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet updation")
    }
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    // Check if the tweet was found and deleted
    if (!deletedTweet) {
        throw new ApiError(404, "Tweet not found");
    }

    res.status(200).json(new ApiResponse(200, null, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}