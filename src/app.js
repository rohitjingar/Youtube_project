import express from "express"
import cors from "cors"
// for the CRUD opertions on the user cookies from our server
import cookieParser from "cookie-parser";
const app =  express();
// this is for the request from our frontend for the data request from this backend 
app.use(cors({
      origin: process.env.CORS_ORIGIN,
      credentials:true
}))
// for the json data
app.use(express.json({
     limit: "16kb"
}))
// for the url data
app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))
// for the static data like images to store in public
app.use(express.static("public"))
// access the cookie to app or req
app.use(cookieParser())


// routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"


// routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

export default app;