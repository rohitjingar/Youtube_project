import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true, // effiecient search function
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true, // effiecient search function
        },
        avatar:{
            type:String, // cloudinary url we use 
            required:true,
        },
        coverImage:{
            type:String,
        },
        watchHistory:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password:{
            type:String,
            required:[true,'Password is required'],
            
        },
        refreshToken:{
             type:String
        }
    }
,{timestamps:true});

// here we have to use the  function that function is not call back because in call back we do not have a access of this  keyword as we use password...
// this is middleware hook , its just run before the save the data
userSchema.pre("save",  async function(next){
    if(!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password,10);
    next();
})

// Custom method on userSchema for check the user password 

userSchema.methods.isPasswordCorrect = async function(password){
       return await bcrypt.compare(password,this.password);
}

//JWT is just like key , if anyone has that key I can send the data to that perticular thing

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email:this.email,
            username:this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
};
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};
userSchema.methods.generateRefreshToken = function(){};
export const User = mongoose.model("User",userSchema);