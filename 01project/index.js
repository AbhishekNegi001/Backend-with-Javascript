//import express from "express"
const express = require('express')
require('dotenv').config() // for using .env variables, before that npm i dotenv 
const app = express()
const port = 3000;

const data = {
  'name' : 'Abhishek Negi',
  'age' : 21
}

// respond with "hello world" when a GET request is made to the homepage
//when we make any change in backend we must restart the server
app.get('/', (req, res) => {
  res.send('hello world')
})

app.get('/twitter', (req,res)=>{
    res.send('Twitter')
})

app.get('/login', (req,res)=>{
  res.send('<h1>Login</h1>')
})

app.get('/info', (req,res)=>{
  res.json(data)
})

app.listen(process.env.PORT, () => {
    console.log(`Project1 is listening port no. ${port}`)
})