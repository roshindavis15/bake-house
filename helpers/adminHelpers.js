const Admin= require("../models/adminModel");
const Product= require("../models/productsModel");
const bcrypt= require('bcrypt');
const randomstring= require('randomstring');
const config= require("../config/config")
const nodemailer= require("nodemailer");
const Category = require('../models/categoryModel'); 
const User=require('../models/userModel');
const Order=require('../models/orderModel');
const { OrderedBulkOperation } = require("mongodb");
const { orderSucccessLoad } = require("../controllers/userController");


const verifyingLogin=async(req,res)=>{
        try {
        const email=req.body.email;
        const password=req.body.password;
        const adminData= await Admin.findOne({email:email})
        
              if(adminData){
                    console.log("adminpass:",  adminData.password);
         
        const PasswordMatch= await bcrypt.compare(password,adminData.password)
          console.log(PasswordMatch);
             if(PasswordMatch){
         
             if(adminData.is_admin===0){

              return res.render('login',{message:"Email and Password is incorrect"});
             
          }else{

                   req.session.admin_id = adminData._id;
              
                       return res.redirect("/admin/home");
                    }
           }else{
            
                  return res.render('login',{message:"Email and Password is incorrect"});

                }

          }
          else{
            return res.render('login',{message:"Email and Password is incorrect"});
              }
    
    } catch (error) {
        console.log(error.message);
    }
}



const loadingLogin= async(req,res)=>{
      try {
        return res.render('login');
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

  const getOrderData=async()=>{
    try {
      
      const fullOrderData=await Order.find({}).populate('userId','name');
      if(fullOrderData){
        const orderData= fullOrderData.map(order=>({
          orderId:order._id,
          name:order.userId.name,
          paymentMethod:order.paymentMethod,
          total:order.totalToPay,
          date:order.date,
          status:order.deliveryStatus
        }))
        
        return orderData
      }else{
        return
      }
    } catch (error) {
      console.log(error.message);
    }
  }


const changeStatus = async (orderId) => {
  try {

    console.log("reached here with id:", orderId);
    let orderData = await Order.findByIdAndUpdate(orderId, { deliveryStatus: 'preparing' }, { new: true });
    if (orderData) {
      return true;
    } else {
      return false;
    }

  } catch (error) {
    console.log(error.message);
  }
}
    




    module.exports={
        verifyingLogin,
        loadingLogin,
        loadingDashboard,
        getOrderData,
        changeStatus
    };