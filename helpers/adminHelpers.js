const Admin= require("../models/adminModel");
const Product= require("../models/productsModel");
const bcrypt= require('bcrypt');
const randomstring= require('randomstring');
const config= require("../config/config")
const nodemailer= require("nodemailer");
const Category = require('../models/categoryModel'); 
const User=require('../models/userModel')


const verifyingLogin=async(req,res)=>{
        try {
        const email=req.body.email;
        const password=req.body.password;
        const adminData= await Admin.findOne({email:email})
        
              if(adminData){
                    console.log("adminpass:",adminData.password);
         
        const PasswordMatch= await bcrypt.compare(password,adminData.password)
          
             if(PasswordMatch){
         
             if(adminData.is_admin===0){

                res.render('login',{message:"Email and Password is incorrect"});
             
          }else{
                   req.session.admin_id = adminData._id;
                   
                   res.redirect("/admin/home");
                    }

           }else{
            
                   res.render('login',{message:"Email and Password is incorrect"});

                }

          }
          else{
            res.render('login',{message:"Email and Password is incorrect"});
              }
    
    } catch (error) {
        console.log(error.message);
    }
}

const loadingLogin= async(req,res)=>{
      try {
        res.render('login');
      } catch (error) {
        console.log(error.message);
      }

}   

const loadingDashboard= async(req,res)=>{
    try {
        const userData= await User.find().select('name email mobile');
        
        res.render('index',{users:userData});
    } catch (error) {
        console.log(error.message);
    }
}



    module.exports={
        verifyingLogin,
        loadingLogin,
        loadingDashboard
    };