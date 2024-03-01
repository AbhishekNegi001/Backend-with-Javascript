import mongoose,{Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken' //jwt is a bearer token

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)

// pre middleware function are execute just after the function when middleware calls next
userSchema.pre("save", async function(next){
    if(this.isModified("password")){ // run if password field has been modified
        this.password=await bcrypt.hash(this.password, 10) //encrypts the given password with given no. of rounds
        next()
    }
    return
}) // donot use arrow function as callback as it needs reference of current object

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password) // compare the given data with the encrypted data
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.Access_TOKEN_SECRET,
    {
        expiresIn: process.env.Access_TOKEN_EXPIRY
    })//generates the token
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })//generates the token
}

const User = mongoose.model("User", userSchema)

export default User;