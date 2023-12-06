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
        const cancellationStatus=order.cancelRequest.status;
        

        const orderSummary={
            
            orderedDate,
            address,
            paymentMethod,
            coupenDiscount,
            offerDiscount,
            getTotalToPay,
            deliveryStatus,
            orderedProducts,
            cancellationStatus
        }
        return orderSummary

    } catch (error) {
        console.error("error")
    }
}

const getOrderDataOfUser=async(userId)=>{
    try {
        const getOrderList=await Order.find({userId:userId});
  
        if(getOrderList){

            const orderList=getOrderList.map(order=>({
                date:order.date,
                orderId:order._id,
                total:order.totalToPay,
                paymentMethod:order.paymentMethod,
                status:order.deliveryStatus
            }))
            return orderList;

        }else{
        
            return "no orderes"
    }
 }
  catch (error) {
        console.error(error);

        throw error;
    }
}

const orderCanceling=async(orderId,cancelReason,userId)=>{
    try {
        const order= await Order.findOne({_id:orderId});
        
        if(order){
            order.cancelRequest.requestedBy=userId;
            order.cancelRequest.requestedAt=new Date();
            order.cancelRequest.reason = String(cancelReason);
            order.cancelRequest.status="Requested";
            await order.save();
            return true;
        }else{
            console.log("Order not found");
        }
        
        
    } catch (error) {
        console.error("Error occurred while cancelling order:", error);
    }
}


const getCancellationDetails=async(orderId)=>{
    try {
        
        const order= await Order.findOne({_id:orderId});
        if(order.cancelRequest){
           
            let cancellationDetails= order.cancelRequest;
            console.log("cancellationDetails:",cancellationDetails);
            return cancellationDetails
        }
    } catch (error) {
        console.log(error.message);
    }
    
   
}

const cancellingOrder=async(orderId)=>{
     try {
        const order=await Order.findOne({_id:orderId})
        console.log(order);
    
    if(order){
        
        order.deliveryStatus = 'Cancelled';
        order.cancelRequest.status = 'Cancelled';
        order.cancelledOrder=true;
        await order.save();
        return {success:true,paymentMethod:order.paymentMethod,userId:order.userId,total:order.totalToPay};
    }else{
        throw new Error('Order not found');
    }
     } catch (error) {
        console.error('Error cancelling order:', error);
     }
    
}

const rejectCancellationRequest = async (orderId) => {
    try {
        const order = await Order.findOne({ _id: orderId });
        if (order) {
            order.cancelRequest.status = 'Rejected';
            await order.save();
            return true;
        } else {
            throw new Error('Order not found')
        }

    } catch (error) {
        console.error('Error Rejecting:',error)
    }
}


const updateStatus= async(orderId,status)=>{
    try {
        const order= await Order.findOne({_id:orderId});
        if(order){
            if(status==='cancelled'){
                order.deliveryStatus=status;
                order.cancelledOrder=true;
                order.cancelRequest.status='Cancelled'
                await order.save();
                return true;
            }
            order.deliveryStatus=status;
            await order.save();
            return true;
        }else{
            throw new Error('Order not found')
        }
    
    } catch (error) {
        console.error('Error',error);
    }
}

   



module.exports={

    orderSummaryData,
    getOrderDataOfUser,
    orderCanceling,
    getCancellationDetails,
    cancellingOrder,
    rejectCancellationRequest,
    updateStatus
}