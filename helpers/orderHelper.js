const mongoose=require('mongoose');
const Order=require('../models/orderModel');
const { getTotalToPay } = require('./cartHelpers');


const orderSummaryData= async(orderId)=>{

    try {
        const order= await Order.findOne({_id:orderId});
        
        const orderedDate=order.date;
        const address=order.addressDetails;
        const paymentMethod=order.paymentMethod;
        const coupenDiscount=order.couponDiscount;
        const offerDiscount=order.offerDiscount;
        const getTotalToPay=order.totalToPay;
        const deliveryStatus=order.deliveryStatus;
        const orderedProducts=order.products;
        

        const orderSummary={
            orderedDate,
            address,
            paymentMethod,
            coupenDiscount,
            offerDiscount,
            getTotalToPay,
            deliveryStatus,
            orderedProducts,
            


        }
        return orderSummary



    } catch (error) {
        console.error("error")
    }
}



module.exports={

    orderSummaryData
}