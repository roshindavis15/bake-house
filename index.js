const mongoose = require("mongoose");
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URL).then((data)=>{
    console.log('connected success');
}).catch((err)=>{
console.log(err.message);
})

const nocache = require('nocache')
const express=require("express");
const app=express();

app.use(nocache())

app.use(express.static('public'));

//for user routes
const userRoute=require('./routes/userRoute');
app.use('/',userRoute);

// for admin routes
const adminRoute=require('./routes/adminRoute');
app.use('/admin',adminRoute);

app.listen(5000,function(){
    console.log("server is running..");
})

