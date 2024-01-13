import connectDB from "./db/index.js"
import dotenv from "dotenv"
dotenv.config({
    path: './env'
})
connectDB()
.then(()=>{
     app.listen(process.env.PORT || 8000, ()=>{
            console.log(` Server is running at port:  ${process.env.PORT}`);
     })
})
.catch((error)=>{
        console.log("MONGo db connection failed !!! ", error);
});






/*
const app = express();
(async()=>{
    try{
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      app.on("error",()=>{
           console.log("ERROR", error);
           throw error;
      })
      app.listen(process.env.PORT, ()=>{
           console.log(`App is listening on port ${process.env.PORT}`);
      })
    }
    catch(error){
         console.error("Error:", error);
         throw error;
    }
})()
*/