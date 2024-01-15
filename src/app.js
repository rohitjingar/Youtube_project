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

// routes declaration
app.use("/api/v1/users", userRouter)

export default app;