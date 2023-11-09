const mongoose = require('mongoose')
const User = require('../models/userModel')
const Address = require('../models/addressModel')
const Product = require('../models/productsModel');
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const Coupen=require('../models/coupenModel');
const config = require('../config/config')


const addCoupen=(coupenDatas)=>{
    return new Promise(async(resolve,reject)=>{
        const{coupenCode,description,discount,maxDiscountAmount,validFor,usageLimit}=coupenDatas;
        
        const parsedMAximumDiscount=parseInt(maxDiscountAmount);
        const parsedValidFor=parseInt(validFor)
        
        
        const coupens= new Coupen({
             coupenCode:coupenCode,
             description:description,
             discount:discount,
             maxDiscountAmount: parsedMAximumDiscount,
             validFor:parsedValidFor,
             createdOn:new Date(),
             usageLimit:usageLimit
        });
        console.log("coupenssssss:",coupens.toObject());
        try {
            const coupenData=await coupens.save();
            resolve(coupenData)
        } catch (error) {
            console.error(error);
            reject(error.message);
        }
    })
}


const activateCoupen=(coupenId)=>{
    return new Promise(async(resolve,reject)=>{
        
        try {
            const updatedCoupen= await Coupen.findByIdAndUpdate(coupenId,{activeCoupen:true},{new:true});
            if(!updatedCoupen){
                reject("Coupen Not Found")
            }else{
                resolve(updatedCoupen);
            }
        } catch (error) {
            reject(error)
        }
    })
}

const deactivateCoupen=(coupenId)=>{
    return new Promise(async(resolve,reject)=>{

        try {
            const updatedCoupen= await Coupen.findByIdAndUpdate(coupenId,{activeCoupen:false},{new:true});
            console.log("updatedCoupen:",updatedCoupen);
            if(!updatedCoupen){
                reject("Coupen Not Found")
            }else{
                resolve(updatedCoupen)
            }
        } catch (error) {
            reject(error)
        }
    })
}

async function getActiveCoupens(){
    try {

        const activeCoupens=await Coupen.find({activeCoupen:true});
        
        return activeCoupens;

    } catch (error) {
        throw error
    }
}


    const applyCoupenToUser= async(coupenCode,userId)=>{
        
        try {
            
            const cart=await Cart.findOne({user_id:userId});
            console.log("cartforapplyCoupeeenennnn:",cart);

            const coupen=await Coupen.findOne({coupenCode})
            
            if(coupen.usageCount >=coupen.usageLimit){
                return "limitExceeds"
            }else{

                // Check if the user has already used this coupon

            if(cart.usedCoupens){
                return "CouponAlreadyUsed"
            }

            // If the coupon is not already used, apply it to the user
            cart.usedCoupens=coupen._id
            coupen.usageCount+=1;

            // Save the updated user document
            await cart.save();

            return "CouponApplied";
            }
            
        

    } catch (error) {
        return "CouponError";
    }
}


const getCoupendata=async(userId)=>{
      
        try {
            
            const cart=await Cart.findOne({user_id:userId});
           
            const coupenId=cart.usedCoupens;
            
            let coupenDetails=[];

           if(coupenId){
            const coupen= await Coupen.findById(coupenId);
            console.log("coupen:",coupen);

            if(coupen){
                coupenDetails.push({
                    coupenCode:coupen.coupenCode,
                    discount:coupen.discount,
                    maxDiscountAmount:coupen.maxDiscountAmount
                })
            }
           }
           console.log("coupenDetails",coupenDetails);
    
            
            
            return coupenDetails
            
        } catch (error) {
            console.error(error);
            return [];
        }


    
}







module.exports={
    addCoupen,
    activateCoupen,
    deactivateCoupen,
    getActiveCoupens,
    applyCoupenToUser,
    getCoupendata
}