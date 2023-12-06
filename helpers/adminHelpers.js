const Admin= require("../models/adminModel");
const Product= require("../models/productsModel");
const bcrypt= require('bcrypt');
const randomstring= require('randomstring');
const config= require("../config/config")
const nodemailer= require("nodemailer");
const Category = require('../models/categoryModel'); 
const User=require('../models/userModel');
const Order=require('../models/orderModel');
const Wallet=require('../models/walletModel')
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


const updateProduct = async (updateFields, productId) => {
  try {
      let productAlreadyExist = await Product.findOne({
          name: updateFields.name,
          _id: { $ne: productId }
      });

      if (productAlreadyExist) {
          return { productNameAlreadyExist: true };
      } else {
          let productData = await Product.findByIdAndUpdate(
              productId,
              { $set: updateFields },
              { new: true }
          );

          if (!productData) {
              return { error: "Product not found" };
          }

          return { success: true, message: "Product updated successfully", redirectTo: "/productIndex" };
      }
  } catch (error) {
      throw new Error(error.message);
  }
};


const updateCategory = async (updateFields, categoryId) => {
  try {
      let categoryAlreadyExist = await Category.findOne({
          Name: updateFields.Name,
          _id: { $ne: categoryId }
      });

      if (categoryAlreadyExist) {
          return { categoryAlreadyExist: true };
      } else {
          let categoryData = await Category.findByIdAndUpdate(
              categoryId,
              { $set: updateFields },
              { new: true }
          );

          if (!categoryData) {
              return { error: "Category not found" };
          }

          return { categoryAlreadyExist: false };
      }
  } catch (error) {
      throw new Error(error.message);
  }
};


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

  
const amountReturningToWallet= async(paymentMethod,userId,total)=>{
  try {
    console.log("paymentmethod wallet:",paymentMethod);
    console.log("userid Wallet:",userId);
    console.log("total wallet:",total);

    const wallet=await Wallet.findOne({userId:userId});
    console.log("wallet:",wallet);
    if(wallet){
      wallet.walletAmount+=total;
      await wallet.save()
    }
  } catch (error) {
    console.log(error.message);
  }
}
 

const getTotalPlacedOrderCount= async()=>{ 
  try {
    const placedOrderCount=await Order.countDocuments({

      cancelledOrder:false,
      deliveryStatus:"Placed"
    })

    if(placedOrderCount){
      return placedOrderCount
    }
  }
   catch (error) {
    console.log(error.message);
  }
}


const getTotalCancelledOrderCount=async()=>{
  try {
    const cancelledOrderCount= await Order.countDocuments({
      cancelledOrder:true
    })
    if(cancelledOrderCount){
      return cancelledOrderCount
    }
  } catch (error) {
    console.log(error.message)
  }
}


const getTotalDeliveredOrderCount=async()=>{
  try {
    const deliveredOrderCount=await Order.countDocuments({
      deliveryStatus:"delivered"
    })
    if(deliveredOrderCount){
          return deliveredOrderCount
    }
  } catch (error) {
    console.log(error.message);
  }
}
  

const getChartData= async(req,res)=>{
  try {
    const orders = await Order.find({ cancelledOrder: { $ne: true } }).lean();
    
    const salesData={};
     orders.forEach(order=>{
      const date=new Date(order.date);
      const month = date.toLocaleString('en-US', { month: 'long' });
      const totalPayment = order.totalToPay || 0;

      if (!salesData[month]) {
        salesData[month] = 0;
    }

    salesData[month] += totalPayment;
    })
console.log("salesData:",salesData);

return salesData;

  } catch (error) {
    console.log(error.message);
  }
}


    module.exports={
        verifyingLogin,
        loadingLogin,
        getOrderData,
        amountReturningToWallet,
        getTotalPlacedOrderCount,
        getTotalCancelledOrderCount,
        getTotalDeliveredOrderCount,
        getChartData,
        updateProduct,
        updateCategory
      
    };