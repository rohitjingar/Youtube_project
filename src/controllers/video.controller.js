import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {v2 as cloudinary} from 'cloudinary';
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description} = req.body
    if(!title && !description){
         throw new ApiError(400, "title or description is required")
    }

    let videoFileLocalPath;
    let thumbnailLocalPath;

    if(req.files && req.files.videoFile && req.files.videoFile[0].path){
        videoFileLocalPath = req.files.videoFile[0].path
    }
    else{
        throw new ApiError(400,"videoFile is required")
    }

    if(req.files && req.files.thumbnail && req.files.thumbnail[0].path){
        thumbnailLocalPath = req.files.thumbnail[0].path
    }
    else{
        throw new ApiError(400,"thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
    if(!videoFile){
        throw new ApiError(400,"videoFile is required")
    }
    else if(!thumbnail){
        throw new ApiError(400,"thumbnail is required")
    }
    
    
    const video = await Video.create({
          videoFile: videoFile.url,
          thumbnail: thumbnail.url,
          title,
          description,
          time: videoFile.duration,
          owner: req.user?._id
    })

    const createdVideo = await Video.findById(video._id)
    if(!createdVideo){
        throw new ApiError(500, "Something went wrong while creating the video")
    }

    return res.status(201).json(new ApiResponse(200,createdVideo,"Video created Successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}