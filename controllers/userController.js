const User=require('../models/userModel');
const bcrypt= require('bcrypt');
const mongoose = require('mongoose')
const userHelper = require('../helpers/userHelpers')
const Product=require("../models/productsModel");
const Category=require('../models/categoryModel');
const Address=require('../models/addressModel');
const nodemailer=require('nodemailer')

const config=require("../config/config");
const randomstring= require('randomstring')
const otpGenerator= require('otp-generator');




const securedPassword= async(password)=>{

    try {
        
        const passwordHash=await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }

}


//for reset password send mail
const sendResetPasswordMail=async(name,email,token)=>{
    try {
       
     
       
       const transporter= nodemailer.createTransport({
            host:'smtp.ethereal.email',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
              user: config.emailUser,
              pass:config.emailPassword
            }

        });
        const mailOptions={
            from:"roshin@gmail.com",
            to:email,
            subject:"for reset password",
           html: `<p>Hi ${name}, please click here to <a href="http://localhost:3000/forget-password?token=${token}">Reset</a> your password</p>`


        }
        
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }
            else{
                console.log("Email has been sent:-",info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister=async(req,res)=>{
    try {
        res.render('signup')
    } catch (error) {
        console.log(error.message);
    }
}



const insertUser = async (req, res) => {
    try {
        
        
        userHelper.insertUser(req.body,res).then((data)=>{
        
        userHelper.sendVerifyMail(req.body.name, req.body.email, data._id);
        res.render('otpVerify', { messages: "Your registration has been successfully, please verify your mail" });
        },
        (err)=>{
            res.render('signup', { messages: "Your registration has been failed" });
        })
       
    } catch (error) {
        console.log(error.message);
    }
}
const otpverify= async(req,res)=>{
    try {
        let userOtp= req.body.otp;
        
        const user_id = req.query.id;
        

        if(userHelper.otpStorage.generatedOtp==userOtp){
            
            const updateInfo = await User.updateOne({ _id: user_id }, { $set: { is_varified: 1 } })

            res.render('signup');
            
        }
        else{
            console.log("otp is not correct");
        }
    } catch (error) {
        console.log(error.message);
    }
}







const loadLogin = async (req, res) => {
    try {
        
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}



const homeLoad=async(req,res)=>{
    try {
        res.render('home')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyMail = async (req, res) => {
    try {
        const user_id = req.query.id; 
        console.log(user_id);
       
        
        
        const updateInfo = await User.updateOne({ _id: user_id }, { $set: { is_varified: 1 } });

        
        res.render("email-verified");
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        

        const userData = await User.findOne({ email: email });
        
        
      if(userData){
       const passwordMatch=await bcrypt.compare(password,userData.password);
       
       
       if(passwordMatch){
        if(userData.is_varified===0){
            
         res.render('login',{message:"please verify your mail"})
        }
        else{
            req.session.user_id=userData._id;
            console.log(req.session.user_id);
            
          res.redirect('home');    //here check
        }

       }
       else{
        res.render('login',{message:"Email and password is incorrect"});
       }
      }
      else{
        res.render('login',{message:"Email and password is incorrect"});
      }

     } catch (error) {
        console.log(error.message);
     }
}



const loadHome = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id });
        console.log("userData:",userData);
        
        res.render('home', { user: userData});
        
    } catch (error) {
        console.log(error.message);
    }
}
const shopLoad=async(req,res) =>{
    try {
        const productData= await Product.find({unlist:false});
        const categoryData= await Category.find({IsActive:false});
        

        res.render('shop',{product:productData,category:categoryData});
    } catch (error) {
        console.log(error.message);
    }
}


const userLogout=async(req,res)=>{
    try {
        
        req.session.destroy();  
        

    } catch (error) {
        console.log(error.message);
    }
}

//forget passord code start

const forgetLoad= async(req,res)=>{
    try {
        res.render('forget');
    } catch (error) {
        console.log(error.message);
    }
}

const forgetVerify= async(req,res)=>{
    try {
        const email=req.body.email;
        const userData=await User.findOne({email:email});
        console.log(userData);
        if(userData){
                     
            if(userData.is_varified===0){
                res.render('forget',{message:"please verify your mail"});
            }
            else{
                const randomString=randomstring.generate();
               const updatedData= await User.updateOne({email:email},{$set:{token:randomString}})
               console.log(updatedData);
               sendResetPasswordMail(userData.name,userData.email,randomString);
               res.render('forget',{message:"please check your mail to reset your password"})

            }
        }
        else{
            res.render('forget',{message:"user email is incorrect"})
        }
    } catch (error) {
        console.log(error.message);
        
    }
}

const forgetPasswordLoad=async(req,res)=>{
     try {
        
        const token=req.query.token;
       const tokenData=await User.findOne({token:token});
       if(tokenData){
        res.render('forget-password',{user_id:tokenData._id});
       }
       else{
        res.render('404',{message:"Token is invalid"})
       }
     } catch (error) {
        console.log(error.message);
     }
}

const resetPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const user_id = req.body.user_id; 

        const secure_password = await securedPassword(password);

        // Update user's password and clear the token
        const updatedData = await User.findByIdAndUpdate(user_id, {
            $set: { password: secure_password, token: '' }
        });

        res.redirect("/");
    } catch (error) {
        console.log(error.message);
    }
}

const loadprofile= async(req,res)=>{
    try {
        const userData= await User.findById(req.session.user_id);
        res.render('userprofile',{user:userData});
    } catch (error) {
        console.log(error.message);
    }
}

//user profile edit & update

const editLoad = async (req, res) => {
    try {
        const id = req.query.id;
       
        const userData = await User.findById(id);
       

        if (userData) {
            res.render('edit', { user: userData });
        } else {
            res.redirect('/home');
        }
    } catch (error) {
        console.log(error.message);
    }
};

const updateProfile = async (req, res) => {
    try {

        
        let updateFields = {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile
        };
        console.log(updateFields);

        

        const userData = await User.findByIdAndUpdate(
            req.body.user_id,
            { $set: updateFields },
            { new: true }
        );
        

        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.render('home');
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const addressManagement= async(req,res)=>{
    try {
        const userId = req.session.user_id;
        const addressData= await Address.find({user_id: userId});

        res.render('addressManagment',{addressData});
        } catch (error) {
        console.log(error.message);
    }
}

const addAddress= async(req,res)=>{
    try {
        res.render('addAddress');
    } catch (error) {
        console.log(error.message);
    }
}
const submitAddress= async(req,res)=>{
    try {
       userId= req.session.user_id;
        userHelper.userAddress(req.body,res,userId).then((data)=>{
            res.redirect('http://localhost:3000/addressManagement');
        });
    } catch (error) {
        console.log(error.message);
    }
}

const editAddress=async(req,res)=>{
    try {
        const addressId=req.query.id;
        
        const addressData= await Address.findOne({_id:addressId});
        console.log(addressData);

        if(addressData){
            res.render('editAddress',{address:addressData})
        }else{
            res.redirect('/addressManagement');
        }
        } catch (error) {
        console.log(error.message);
    }
}
const updateAddress = async (req, res) => {
    try {
      const sessionUserId = req.session.user_id;
      const addressId = req.body.addressid;
      
  
      // Find the user's address based on the session user_id
      const userAddress = await Address.find({ user_id: sessionUserId });
      
    
  
      if (!userAddress) {
        return res.status(404).json({ error: 'User address not found' });
      }
  
      const specificAddress=userAddress.find(addr=>addr._id.equals(addressId));
       console.log(specificAddress);
      if (!specificAddress) {
        return res.status(404).json({ error: 'Address not found' });
      }else{
        specificAddress.address[0].name=req.body.name;
        specificAddress.address[0].mobile=req.body.mobile;
        specificAddress.address[0].homeAddress=req.body.homeAddress;
        specificAddress.address[0].place=req.body.place;
        specificAddress.address[0].pincode=req.body.pincode

      }
      await specificAddress.save();
      return res.redirect('/addressManagement')
    } catch (error) {
      console.error('Error updating address:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
};
  
const deleteAddress= async(req,res)=>{
    try {
        const addressIdToDelete=req.query.id;
        const addressData= await Address.findOne({_id:addressIdToDelete});
        const sessionUserId = req.session.user_id;
        
        if(addressData){
            await Address.deleteOne({_id:addressData._id});
            
            if(addressData.address[0].isDefault){
                const nextAddress= await Address.findOne({user_id:sessionUserId});
                
                if(nextAddress){
                    nextAddress.address[0].isDefault=true;
                    await nextAddress.save();
                }
            }
            
            return res.redirect('/addressManagement');
            
        }else{
            console.log('Address data not found.');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const setasDefault= async(req,res)=>{
    try{
        const addressId=req.query.id;
        const sessionUserId = req.session.user_id;
        const currentDefaultAddress= await Address.findOne({user_id:sessionUserId,'address.0.isDefault': true});
        if(currentDefaultAddress){
            currentDefaultAddress.address[0].isDefault = false;
            await currentDefaultAddress.save();
        }
        console.log("currentDefaultAddress:",currentDefaultAddress);
        const addressDataToUpdate= await Address.findOneAndUpdate({_id:addressId},{$set:{"address.0.isDefault": true}});
        console.log("addressDataToUpdate:",addressDataToUpdate);
        

        return res.redirect('/addressManagement') 


} catch (error){
    console.log(error.message);
}
}
    
module.exports={
    loadRegister,
    insertUser,
    loadLogin,
    homeLoad,
    securedPassword,
    verifyMail,
    verifyLogin,
    loadHome,
    userLogout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    loadprofile,
    editLoad,
    updateProfile,
    otpverify,
    shopLoad,
    addressManagement,
    addAddress,
    submitAddress,
    editAddress,
    updateAddress,
    deleteAddress,
    setasDefault
}
