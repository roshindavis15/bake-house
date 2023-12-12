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
  

const getChartData = async (reportType) => {
  try {
    console.log("reportType:",reportType);
      const orders = await Order.find({ cancelledOrder: { $ne: true } }).lean();
      const salesData = {};

      
      orders.forEach(order => {
          const date = new Date(order.date);
          let timeKey = '';

          
          if (reportType === 'yearly') {
              timeKey = date.getFullYear().toString();
          } else if (reportType === 'monthly') {
              const month = date.toLocaleString('en-US', { month: 'long' });
              timeKey = `${month} ${date.getFullYear()}`;
          } else if (reportType === 'daily') {
              const day = date.toLocaleDateString('en-US');
              timeKey = day;
          }

          const totalPayment = order.totalToPay || 0;

          if (!salesData[timeKey]) {
              salesData[timeKey] = 0;
          }

          salesData[timeKey] += totalPayment;
      });

      // console.log("salesData:", salesData);

      return salesData;

  } catch (error) {
      console.error(error.message);
      throw new Error('Error generating sales data');
  }
};


const getSalesData = async (reportType) => {
  try {
      let salesData;
      const deliveredOrders = await Order.find({ deliveryStatus: 'delivered' });
      console.log("deliveredOrders:",deliveredOrders);
      
      if (reportType === 'yearly') {
          const currentYear = new Date().getFullYear();

          const yearlyOrders = deliveredOrders.filter(order => {
              return new Date(order.date).getFullYear() === currentYear;
          });

          const yearlySales = yearlyOrders.reduce((total, order) => {
              return total + order.totalToPay;
          }, 0);
       
          const orderDetails = yearlyOrders.map(order => {
              return {
                  name: order.addressDetails.name,
                  date: order.date,
                  total: order.totalToPay,
                  paymentMethod: order.paymentMethod
                  
              };
          });
          
          const productDetails = yearlyOrders.reduce((acc, order) => {
              order.products.forEach(product => {
                  if (acc[product.productId]) {
                      acc[product.productId].quantity += 1;
                  } else {
                      acc[product.productId] = {
                        name: product.productName,
                          quantity: 1
                      };
                  }
              });
              return acc;
          }, {});

          salesData = {
              reportType: 'Yearly',
              totalSales: yearlySales,
              orderDetails: orderDetails,
              productDetails: productDetails
              
          };
      } else if (reportType === 'monthly') {
          const currentMonth = new Date().getMonth() + 1;
          
          const monthlyOrders = deliveredOrders.filter(order => {
              return new Date(order.date).getMonth() + 1 === currentMonth;
              
    
          });
          
          const monthlySales = monthlyOrders.reduce((total, order) => {
              return total + order.totalToPay;
          }, 0);
          
          const orderDetails = monthlyOrders.map(order => {
              return {
                  name: order.name,
                  date: order.date,
                  total: order.totalToPay,
                  paymentMethod: order.paymentMethod
              };
          });
        
          const productDetails = monthlyOrders.reduce((acc, order) => {
              order.products.forEach(product => {
                  if (acc[product.productId]) {
                      acc[product.productId].quantity += 1;
                  } else {
                      acc[product.productId] = {
                          name: product.name,
                          quantity: 1
                      };
                  }
              });
              return acc;
          }, {});

          salesData = {
              reportType: 'Monthly',
              totalSales: monthlySales,
              orderDetails: orderDetails,
              productDetails: productDetails
              
          };
      }else if(reportType==='daily'){
        const currentDate=new Date().toISOString().split('T')[0];

        const dailyOrders = deliveredOrders.filter(order => {
          return order.date.toISOString().split('T')[0] === currentDate;
        });

        const dailySales = dailyOrders.reduce((total, order) => {
          return total + order.totalToPay;
        }, 0);

        const orderDetails = dailyOrders.map(order => {
          return {
            name: order.addressDetails.name,
            date: order.date,
            total: order.totalToPay,
            paymentMethod: order.paymentMethod
          };
        });
        const productDetails = dailyOrders.reduce((acc, order) => {
          order.products.forEach(product => {
            if (acc[product.productId]) {
              acc[product.productId].quantity += 1;
            } else {
              acc[product.productId] = {
                name: product.productName,
                quantity: 1
              };
            }
          });
          return acc;
        }, {});
  
        salesData = {
          reportType: 'Daily',
          totalSales: dailySales,
          orderDetails: orderDetails,
          productDetails: productDetails
        };
      }
  
      return salesData;
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw new Error('Failed to fetch sales data');
    }
  };


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
        updateCategory,
        getSalesData
      
    };