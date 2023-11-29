const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const User = require('../models/userModel')
const Address= require('../models/addressModel')
const Product=require('../models/productsModel');
const Category=require('../models/categoryModel')
const Cart=require('../models/cartModel');
const Coupen=require('../models/coupenModel');
const Order=require('../models/orderModel');
const nodemailer = require('nodemailer')
const config = require('../config/config')
const otpGenerator= require('otp-generator');
const Razorpay=require('razorpay')
const crypto=require('crypto');

 let otpStorage={};

 var instance= new Razorpay({
    key_id:'rzp_test_actyaWU6qykYib',
    key_secret:'y4MeoInYyOUAHit056qb9YI1'

 })


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

const verifyPayment = (details) => {
    return new Promise((resolve, reject) => {
        try {
            const hmac = crypto.createHmac('sha256', 'y4MeoInYyOUAHit056qb9YI1');
            const text = details.paymentDetails.razorpay_order_id + '|' + details.paymentDetails.razorpay_payment_id;
            hmac.update(text);
            const calculatedSignature = hmac.digest('hex');

            if (calculatedSignature === details.paymentDetails.razorpay_signature) {
                resolve(); // Signature matched, payment verified
            } else {
                reject(new Error('Invalid signature')); // Signature mismatch, payment verification failed
            }
        } catch (error) {
            reject(error); 
        }
    });
};

const changePaymentStatus = async (orderId, userId) => {
    try {
        let order = await Order.findOne({ userId: userId });
        if (order) {
            await Order.findByIdAndUpdate(orderId, { deliveryStatus: "Placed" });
            return { status: "Delivery status updated successfully." };
        } else {
            return { error: "Order not found." };
        }
    } catch (error) {
        console.error('Error updating delivery status:', error);
        throw new Error("Failed to update delivery status.");
    }
};




async function getSingleProduct(productId) {
    try {
        const singleProduct = await Product.findById(productId);
        return singleProduct;
    } catch (error) {
        throw error;
    }
}


async function getCategoryById(categoryId) {
    try {
        const category = await Category.findById(categoryId);
        return category;
    } catch (error) {
        throw error;
    }
}

async function getCheckoutData(userId) {
    try {
        const defaultAddress = await Address.findOne({ user_id: userId, 'address.isDefault': true });
        const defaultAddressNotFound = "Default address not found. Please add an address before proceeding to checkout.";

        const userDocument = await Address.find({ user_id: userId });
        const addressArray = userDocument.map(addressDocument => addressDocument.address);

        const filteredAddressess=  addressArray.map(userAddresses=> userAddresses.filter(address=> !address.isDefault));

        const cart = await Cart.findOne({ user_id: userId });
        const cartTotal = cart.cartTotal;
        
        async function getProductName(productId) {
            const productInfo = await Product.findById(productId);
            return productInfo ? productInfo.name : 'Product not found';
        }

        const productDetails = [];
        for (const product of cart.products) {
            const productName = await getProductName(product.productId);
            productDetails.push({
                productName,
                subtotal: product.subtotal,
            });
        }

        
        return {
            defaultAddress: defaultAddress || { defaultAddressNotFound },
            filteredAddressess,
            cartTotal,
            productDetails,
        };
    } catch (error) {
        throw error;
    }
}

async function generateRazorpay(orderId, total) {
    try {
        const options = {
            amount: total*100,
            currency: "INR",
            receipt: orderId
        };

        return new Promise((resolve, reject) => {
            instance.orders.create(options, function (err, order) {
                if (err) {
                    reject(err);
                } else {
                    resolve(order);
                }
            });
        });
    } catch (error) {
        throw error;
    }
}


module.exports ={

    insertUser,
    sendVerifyMail,
    otpStorage,
    userAddress,
    getSingleProduct,
    getCategoryById,
    getCheckoutData,
    generateRazorpay,
    verifyPayment,
    changePaymentStatus

}