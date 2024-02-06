import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"
import { Playlist } from "../models/playlist.model.js"
import {v2 as cloudinary} from 'cloudinary'
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id");
    }
    if (!query || !sortBy || !sortType) {
        throw new ApiError(404, "All fields are required");
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
        throw new ApiError(404, "user not found");
    }

    const options = {
         page: parseInt(page),
         limit: parseInt(limit)
    }

    let sortoption = {}
    if(sortBy){
        sortoption.sortBy = sortType === "desc" ? -1 :1
    }

    const allVideos = await Video.aggregate([
        {
            $match:{
                $and:[
                    {
                        owner: new mongoose.Types.ObjectId(userId)
                    },
                    {
                        title:{
                            $regex: query,
                            $options: "i"
                        }
                    }
                ]
            }
        },
        {
            $sort: sortoption
        }
    ])

    const requiredVideos = await Video.aggregatePaginate(
        allVideos,
        options
    )

    return res
    .status(200)
    .json(new ApiResponse(200, requiredVideos, "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description} = req.body
    if(!title && !description){
         throw new ApiError(400, "title or description is required")
    }
    const userId = req.user._id;

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
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
          owner: userId
    })

    
    if(!video){
        throw new ApiError(500, "Something went wrong while creating the video")
    }

    return res.status(200).json(new ApiResponse(200,video,"Video created Successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //TODO: get video by id
    if(!videoId){
         throw new ApiError(400, "videoId is required")
    }
    if(!isValidObjectId(videoId)){
         throw new ApiError(400, "Invalid videoId")
    }
    const video = await Video.findByIdAndUpdate(videoId,
        {
            $inc:{views:1}
        },
        {
            new: true
        }
        )
    if(!video){
        throw new ApiError(400, "Video not found")
    }
    // we can fetch all comments , like , subscriber count etc.

    const videoDetails = await Video.aggregate([
        {
          $match:{
             _id: new mongoose.Types.ObjectId(videoId)
          }
        },
        {
          $lookup:{
             from: "subscriptions",
             localField: "owner",
             foreignField: "channel",
             as: "ownerSubscribers"
          }
        },
        {
         $lookup:{
           from: "likes",
           localField: "_id",
           foreignField: "video",
           as: "videoLikes"
         },
        },
        {
            $lookup:{
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "videoComments"
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerInfo",
                pipeline:[
                    {
                        $project:{
                            _id: 1,
                            username: 1,
                            email:1,
                            fullName:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first: "$owner"
                },
                totalLikes:{
                   $size: "$videoLikes"
                },
                totalComments:{
                    $size: "$videoComments"
                },
                totalsubscribers:{
                    $size: "ownerSubscribers"
                },
                isCurrentUserSubscribed:{
                    $cond:{
                        if: {$in: [req.user._id, "$ownerSubscribers"]},
                        then: true,
                        else:false
                    }
                }
            }
        }
    ])
    if(!videoDetails){
        throw new ApiError(500, "Error while fetching the video details")
    } 
    return res.status(200).json(new ApiResponse(200, videoDetails,"Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description} = req.body
    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }
    const thumbnailLocalpath = req.file?.path
    if(!title && !description && !thumbnailLocalpath){
        throw new ApiError(400, "title, description, and thumbnail are not provided")
    }
    

    let updates = {};

    // Update title if provided
    if (title) {
        updates.title = title;
    }

    // Update description if provided
    if (description) {
        updates.description = description;
    }

    // Update thumbnail if provided
    if (thumbnailLocalpath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalpath);
        updates.thumbnail = thumbnail;
    }

    // Update video details based on the updates object
    const video = await Video.findByIdAndUpdate(
        videoId,
        updates,
        { new: true }
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video details updated successfully"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // what will happen when u delete a video, 
// Delete from the Video Database: This step involves removing the video document from the Video collection or database.

// Delete Associated Comments and Likes: Any comments or likes associated with the deleted video should also be removed to maintain data consistency and integrity. This ensures that there are no orphaned records in the database.

// Remove Video from Playlists: If the deleted video is part of any playlists, it should be removed from those playlists to reflect the deletion and maintain the coherence of the playlist data.

    //TODO: delete video

    if(!videoId){
         throw new ApiError(400, "videoId is required")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }
    const video = await Video.findById(videoId)
    if(!video){
         throw new ApiError(400, "video not found")
    }
    
    await Like.deleteMany({video: videoId})
    await Comment.deleteMany({video: videoId})
    // Find all playlists containing the video
    const playlists = await Playlist.find({ videos: videoId });

    // Remove the video ObjectId from the videos array of each playlist
    await Promise.all(playlists.map(async (playlist) => {
        playlist.videos = playlist.videos.filter(playlistVideoId => !playlistVideoId.equals(videoId));
        await playlist.save();
    }));


    // Delete the video document
  const videoFilePublicId = video.videoFile.public_id;
  const thumbnailPublicId = video.thumbnail.public_id;

  if (!videoFilePublicId ||  !thumbnailPublicId) {
    throw new ApiError(400, "video or thumbnail public id not found");
  }

  const removeVideoFromCloudinary = await deleteFromCloudinary(
    videoFilePublicId,
    "video"
  );
  const removethumbnailFromCloudinary =
    await deleteFromCloudinary(thumbnailPublicId);

  if (!removeVideoFromCloudinary || !removethumbnailFromCloudinary) {
    throw new ApiError(400, "Error while deleting file from cloudinary");
  }

  const deletemsg = await Video.deleteOne({_id:videoId})

  if (!deletemsg) {
    throw new ApiError(400, "Error while deleting video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
  if(!videoId){
     throw new ApiError(400, "videoId is required")
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  let videoPublishStatus = video.isPublished;

  if (!videoPublishStatus) {
    video.isPublished = true;
  } else {
    video.isPublished = false;
  }

  const updatedVideo = await video.save();

  if (!updatedVideo) {
    throw new ApiError(400, "error while updating video");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        "video publish status updated successfully"
      )
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}