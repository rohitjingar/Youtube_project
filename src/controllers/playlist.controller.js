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
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
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
              videos: [videoId]
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

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
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