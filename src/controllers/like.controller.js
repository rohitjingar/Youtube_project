import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }
    if(!isValidObjectId(videoId)){
         throw new ApiError(400, "Invalid Video")
    }
    
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video not found")
    }
    let likevideo = await Like.findOne({
        video:videoId,
        likedBy: req.user?._id
    });
    
    if(likevideo){
        const deletelikeVideo = await Like.findByIdAndDelete(likevideo._id);
        if(!deletelikeVideo){
             throw new ApiError(500, "Error while deleting a liked video")
        }
        return res.status(200).json(new ApiResponse(200, {}, "video unliked successfully"))
    }
    likevideo = await Like.create({
        video:videoId,
        likedBy: req.user?._id
    })
    if(!likevideo){
        throw new ApiError(500, "Error while liking a video")
    }
    return res.status(200).json(new ApiResponse(200, likevideo, "video liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId){
        throw new ApiError(400, "commentId is required")
    }
    if(!isValidObjectId(commentId)){
         throw new ApiError(400, "Invalid Comment")
    }
    
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400, "Comment not found")
    }
    let likecomment = await Like.findOne({
        comment:commentId,
        likedBy: req.user?._id
    });
    
    if(likecomment){
        const deletelikeComment = await Like.findByIdAndDelete(likecomment._id);
        if(!deletelikeComment){
             throw new ApiError(500, "Error while deleting a liked comment")
        }
        return res.status(200).json(new ApiResponse(200, {}, "Comment unliked successfully"))
    }
    likecomment = await Like.create({
        comment:commentId,
        likedBy: req.user?._id
    })
    if(!likecomment){
        throw new ApiError(500, "Error while liking a Comment")
    }
    return res.status(200).json(new ApiResponse(200, likecomment, "Comment liked successfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(400, "tweetId is required")
    }
    if(!isValidObjectId(tweetId)){
         throw new ApiError(400, "Invalid tweet")
    }
    
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400, "tweet not found")
    }
    let likeTweet = await Like.findOne({
        tweet:tweetId,
        likedBy: req.user?._id
    });
    
    if(likeTweet){
        const deletelikeTweet = await Like.findByIdAndDelete(likeTweet._id);
        if(!deletelikeTweet){
             throw new ApiError(500, "Error while deleting a liked tweet")
        }
        return res.status(200).json(new ApiResponse(200, {}, "Tweet unliked successfully"))
    }
    likeTweet = await Like.create({
        tweet:tweetId,
        likedBy: req.user?._id
    })
    if(!likeTweet){
        throw new ApiError(500, "Error while liking a Tweet")
    }
    return res.status(200).json(new ApiResponse(200, likeTweet, "Tweet liked successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    const likedVideos = await Like.aggregate([
        {
          $match:{
            likedBy: new mongoose.Types.ObjectId(userId),
            video: {
                $exists: true
            }
          }
        },
        {
          $sort:{
               createdAt: -1
          }
        },
        {
          $lookup:{
             from: "videos",
             foreignField: "_id",
             localField: "video",
             as: "videoDetails"
          }
        },
        {
            $addFields:{
                videoDetails:{
                    $first: "$videoDetails"
                }
            }
        },
        {
            $project: {
              _id: 1,
              video: 1,
              likedBy: 1,
              createdAt: 1,
              videoDetails: 1
            }
        }
    ])
    if (likedVideos.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, {}, "user has not liked any video"));
      }
    
      return res
        .status(200)
        .json(
          new ApiResponse(200, likedVideos, "liked videos fetched successfully")
        );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}