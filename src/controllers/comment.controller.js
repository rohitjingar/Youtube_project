import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!videoId){
        throw new ApiError(400,"videoId is required")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid VideoId")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "video does not found")
    }
    const videoComments = await Comment.aggregate([
        {
          $match:{
            video: new mongoose.Types.ObjectId(videoId)
          }
        },
        {
          $sort:{
             createdAt: -1
          }
        }
    ])
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }
    const requiredVideoComments = await Comment.aggregatePaginate(
        videoComments,
        options
    )
    if(requiredVideoComments.totalDocs===0){
        return res.status(200).json(new ApiResponse(200, {}, "No Comment found"))
    }
    return res.status(200).json(new ApiResponse(200, requiredVideoComments, "Video Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;
    if(!content){
        throw new ApiError(400,"Comment is required")
    }
    else if(!videoId){
        throw new ApiError(400,"videoId is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid VideoId")
    }
    const video = await Video.findById(videoId);
    if(!video){
         throw new ApiError(400, "Video not found")
    }
    const comment = await Comment.create({
         content,
         video: videoId,
         owner: req.user?._id
    })

    if(!comment){
         throw new ApiError(500, "Error while Creating the comment")
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment created successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params 
    const {content} = req.body

    if(!content){
        throw new ApiError(400,"Comment is required")
    }
    else if(!commentId){
        throw new ApiError(400,"commentId is required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId")
    }

    const comment = await Comment.findByIdAndUpdate(commentId,
        {
            $set:{
                content:content
            }
        },
        {
            new: true
        }
        )
    if(!comment){
        throw new ApiError(400, "Error while updating comment")
    }

    return res.status(400).json(new ApiResponse(400, comment, "Comment updated successfully"))
     
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params 
    if(!commentId){
        throw new ApiError(400,"commentId is required")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid commentId")
    }

    const comment = await Comment.findByIdAndDelete(commentId)

    if(!comment){
        throw new ApiError(400, "comment not found")
    }

    return res.status(400).json(new ApiResponse(400, null, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}