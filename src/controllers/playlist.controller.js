import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!name || !description){
        throw new ApiError(400, "name and description are required")
    }
    const createdPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })
    if(!createdPlaylist){
        throw new ApiError(500, "Something went wrong while creating the playlist")
    }
    return res.status(200).json(new ApiResponse(200, createPlaylist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId){
        throw new ApiError(400, "userId is required")
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "userId is not valid")
    }

    const allUserPlaylist = await Playlist.find({owner: userId})
    if(!allUserPlaylist ||  allUserPlaylist.length ===0){
        return res.status(200).json(new ApiResponse(200, {}, "User do not have any playlist"))
    }
    return res.status(200).json(new ApiResponse(200, allUserPlaylist, "All Playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400, "playlistId is required")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlistId is not valid")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Playlist not found")
    }
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId){
        throw new ApiError(400, "playlistId and videoId are required")
    }
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"playlistId or videoId are invalid")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video not found")
    }
    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        {
           $push:{
              videos: videoId
           }
        },
        {
            new: true
        }
        )
    if(!playlist){
        throw new ApiError(400, "Playlist not found")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"Video added successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId || !videoId){
        throw new ApiError(400, "playlistId and videoId are required")
    }
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"playlistId or videoId are invalid")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video not found")
    }
    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        {
           $pull: {
              videos: videoId
           }
        },
        {
            new: true
        }
        )
    if(!playlist){
        throw new ApiError(400, "Error while removing the video")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"Video removed successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new ApiError(400, "playlistId is required")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlistId is not valid")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId)
    if(!playlist){
        throw new ApiError(400, "playlist not found")
    }
    return res.status(200).json(new ApiResponse(200, {}, "playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!name || !description){
        throw new ApiError(400, "name and description both are required")
   }
    if(!playlistId){
        throw new ApiError(400, "playlistId is required")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set:{
                name: name,
                description:description
            }
        },
        {
            new: true
        }
        )
    if(!playlist){
        throw new ApiError(400, "Playlist not found")
    }
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"))
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}