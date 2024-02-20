# install nodemon for automatic restart of server
npm install dev nodemon

# install prettier for formatting 
npm i -D prettier

npm i mongoose dotenv express 

# for using require('dotenv').config({path:'./env'}) as 
import dotenv from 'dotenv'
dotenv.config({
    path: './env'
})

add  -r dotenv/config --experimental-json-modules in scripts in package.json  

# npm i cookie-parser 

# npm i cors

CORS_ORIGIN=*  (* specifies everything)

# npm i mongoose-aggregate-paginate-v2
It is a Mongoose plugin that adds pagination support to the MongoDB aggregation framework in a Mongoose model.

# npm install bcrypt
it is a library that helps us to hash our passwords

# npm install jsonwebtoken
