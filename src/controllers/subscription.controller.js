import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    
    if(!channelId){
        throw new ApiError(400, "channelId is required")
    }
    if(!isValidObjectId(channelId)){
         throw new ApiError(400, "Invalid channel Id")
    }

    let subscriptionDoc = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if(subscriptionDoc){
         const deleteSubscriptionDoc = await Subscription.findByIdAndDelete(subscriptionDoc._id)
         if(!deleteSubscriptionDoc){
            throw new ApiError(500, "Error while deleting the subscriptionDoc")
         }
         return res.status(200).json(new ApiResponse(200,{},"Unsubscribe successfully"))
    }
    subscriptionDoc = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })
    if(!subscriptionDoc){
         throw new ApiError(500, "Error While creating the subscriptionDoc")
    }
    return res.status(200).json(new ApiResponse(200,subscriptionDoc,"Subscribe successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400, "channelId is required")
    }
    if(!isValidObjectId(channelId)){
         throw new ApiError(400, "Invalid channel Id")
    }

    const userSubscribers = await Subscription.find({channel:channelId}, {channel:0})
    if(userSubscribers.length ===0){
        return res.status(200).json(new ApiResponse(200, {}, "No Subscriber found"))
    }
    return res.status(200).json(new ApiResponse(200, userSubscribers, "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId){
        throw new ApiError(400, "subscriberId is required")
    }
    if(!isValidObjectId(subscriberId)){
         throw new ApiError(400, "Invalid subscriber Id")
    }

    const subscribedChannels = await Subscription.find({subscriber:subscriberId}, {subscriber:0})
    if(subscribedChannels.length ===0){
        return res.status(200).json(new ApiResponse(200, {}, "No Subscribed channel found"))
    }
    return res.status(200).json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}