const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const User = require('../models/userModel')
const Address= require('../models/addressModel')
const nodemailer = require('nodemailer')
const config = require('../config/config')
const otpGenerator= require('otp-generator');

 let otpStorage={};


const securedPassword= async(password)=>{

    try {
        
        const passwordHash=await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }

}

const  sendVerifyMail=async(name,email,user_id)=>{
    try {
        const otp = otpGenerator.generate(6, { digits: true, upperCase: false, specialChars: false, alphabets: false });
        otpStorage.generatedOtp=otp;
       
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
            subject:"for verfication mail",
            html: `
            <p>Hi ${name}, this is the OTP for you:${otp}</p>
            <a href="http://localhost:3000/verifyMail?email=${email}&otp=${otp}&id=${user_id}">Verify Email</a>

          `,
        }
        
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }
            else{
                console.log(" OTP has been sent:-",info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}


const insertUser = (userDatas, res) => {
    return new Promise(async (resolve, reject) => {
        
        const spassword = await securedPassword(userDatas.password);

        const user = new User({
            name: userDatas.name,
            email: userDatas.email,
            mobile: userDatas.mobile,
            password: spassword,
            is_admin: 0
        });

        const existingUser = await User.findOne({ email: userDatas.email });
        const existingMob= await User.findOne({mobile:userDatas.mobile});

        if (existingUser) {
            const message='Email already exists. Please use a different email.';
            console.log(message);
            res.render('signup', { message});
        }else if(existingMob) {
            const message='Mobile number already exist. Please use a different mobile number';
            res.render('signup', { message});
        } else {
            const userData = await user.save();

            if (userData) {
                resolve(userData);
            } else {
             
               }   reject("No data");
            }
            
        
    });
}
const userAddress= (addressDatas,res,userId)=>{
    
    return new Promise(async(resolve,reject)=>{
        
        const{name,mobile,homeAddress,district,place,pincode}=addressDatas;
        const address= new Address({
            user_id:userId,
            address:{
            name:name,
            mobile:mobile,
            homeAddress:homeAddress,
            district:district,
            place:place,
            pincode:pincode,
            isDefault:false
        }
        });

        
        try {
            const addressData= await address.save();
            
            resolve(addressData)
        } catch (error) {
            reject(error.message);
        }
    })
  
}


module.exports ={

    insertUser,
    sendVerifyMail,
    otpStorage,
    userAddress

}