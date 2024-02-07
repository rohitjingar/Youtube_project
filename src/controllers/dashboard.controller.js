import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const totalUserVideoAndViews = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $group:{
                _id: "$owner",
                totalViews: {
                    $sum: "$views",
                },
                totalVideos: {
                    $sum: 1,
                },
            }
        }
    ])
    const userSubscribersCount = await Subscription.aggregate([
        {
          $match: {
            channel: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $group: {
            _id: "$channel",
            totalSubscribers: {
              $sum: 1,
            }
          }
        }
      ])
    
      const userChannelStats = {
        totalUserVideoAndViews,
        userSubscribersCount
      }
    
      
    
      return res
        .status(200)
        .json(
          new ApiResponse(200, userChannelStats, "User channel stats fetched successfully")
        )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id 
    const channelVideos = await Video.aggregate([
        {
          $match:{
             owner: new mongoose.Types.ObjectId(userId)
          }
        }
    ])
    if(channelVideos.length ===0){
        return res.status(200).json(new ApiResponse(200, {}, "User has not uploaded any video"));
    }
    return res.status(200).json(new ApiResponse(200, channelVideos, "Channel Videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
}