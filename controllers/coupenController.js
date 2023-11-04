const mongoose = require('mongoose')
const User= require('../models/userModel');
const Category=require('../models/categoryModel');
const Product=require('../models/productsModel');
const Coupen=require('../models/coupenModel');
const adminHelper=require('../helpers/adminHelpers');
const userHelper=require('../helpers/userHelpers');
const coupenHelper=require('../helpers/coupenHelpers');



const coupenManagementLoad=async(req,res)=>{
    try {
        const coupenData= await Coupen.find();
        res.render('coupenManagement',{
            coupens:coupenData
        });
    } catch (error) {
        console.log(error.message);
    }
}



const addCoupenLoad=async(req,res)=>{
    try {
        res.render('add-coupen');
    } catch (error) {
        console.log(error.message);
    }
}


const addCoupen=async(req,res)=>{
    try {
         console.log("req.bodyyyy:",req.body);
        const coupenData= await coupenHelper.addCoupen(req.body);
        
        res.redirect('/admin//CoupenManagment');
        
    } catch (error) {
        console.log(error.message)
    }
}


const activatingCoupen=async(req,res)=>{

    coupenId=req.query.cid;
    
    const coupenData=await coupenHelper.activateCoupen(coupenId);

    if(coupenData){

        res.redirect("/admin/CoupenManagment");

    }else{

        console.error(error.message)

    }  

}


const deactivatingCoupen=async(req,res)=>{

    coupenId=req.query.cid;
    console.log(coupenId);
    
    const coupenData=await coupenHelper.deactivateCoupen(coupenId);

    if(coupenData){
        res.redirect("/admin/CoupenManagment");
    }else{
        console.error(error.messsage);
    }
    

}

const applyingCoupen=async(req,res)=>{
    try {
        
        coupenCode=req.body.coupenCode;
        userId=req.session.user_id;
        console.log("coupenCode:",coupenCode);
        
        const result= await coupenHelper.applyCoupenToUser(coupenCode,userId);
        
        if(result=== "CouponApplied"){

            res.json({ result: "CouponApplied"})

        }else if(result === "CouponAlreadyUsed"){

            res.json({ result: "CouponAlreadyUsed" });
        }else{

            res.json({ result: "CouponError" });
        }

    } catch (error) {

        console.error(error);
       res.json({ result: "CouponError" });
          
    }
}









module.exports={
    coupenManagementLoad,
    addCoupenLoad,
    addCoupen,
    activatingCoupen,
    deactivatingCoupen,
    applyingCoupen
}