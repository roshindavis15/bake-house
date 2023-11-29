const mongoose = require('mongoose')
let User = require('../models/userModel');
const bcrypt = require('bcrypt');
const userHelper = require('../helpers/userHelpers')
const cartHelper = require('../helpers/cartHelpers');
const coupenHelper = require('../helpers/coupenHelpers');
const addressHelper = require('../helpers/addressHelper')
const orderHelper = require('../helpers/orderHelper')
const ProductHelper = require('../helpers/productHelpers');
const Product = require("../models/productsModel");
const Category = require('../models/categoryModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel')
const nodemailer = require('nodemailer');
const config = require("../config/config");
const randomstring = require('randomstring')
const otpGenerator = require('otp-generator');




const securedPassword = async (password) => {

    try {

        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }

}

//for reset password send mail
const sendResetPasswordMail = async (name, email, token) => {
    try {

        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }

        });
        const mailOptions = {
            from: "roshin@gmail.com",
            to: email,
            subject: "for reset password",
            html: `<p>Hi ${name}, please click here to <a href="http://localhost:3000/forget-password?token=${token}">Reset</a> your password</p>`


        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent:-", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}



const loadRegister = async (req, res) => {
    try {
        res.render('signup')
    } catch (error) {
        console.log(error.message);
    }
}



const insertUser = async (req, res) => {
    try {


        userHelper.insertUser(req.body, res).then((data) => {

            userHelper.sendVerifyMail(req.body.name, req.body.email, data._id);
            res.render('otpVerify', { messages: "Your registration has been successfully, please verify your mail" });
        },
            (err) => {
                res.render('signup', { messages: "Your registration has been failed" });
            })

    } catch (error) {
        console.log(error.message);
    }
}


const otpverify = async (req, res) => {
    try {
        let userOtp = req.body.otp;

        const user_id = req.query.id;


        if (userHelper.otpStorage.generatedOtp == userOtp) {

            const updateInfo = await User.updateOne({ _id: user_id }, { $set: { is_varified: 1 } })

            res.render('signup');

        }
        else {
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


const homeLoad = async (req, res) => {
    try {

        const productData = await Product.find({ unlist: false });


        const categoryData = await Category.find({ IsActive: false });


        res.render('home', { product: productData, category: categoryData, user: req.session.user_id })
    } catch (error) {
        console.log(error.message);
    }
}

const verifyMail = async (req, res) => {
    try {
        const user_id = req.query.id;

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

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_varified === 0) {

                    res.render('login', { message: "please verify your mail" })
                }
                else {
                    req.session.user_id = userData._id;

                    res.redirect('home');
                }

            }
            else {
                res.render('login', { message: "Email and password is incorrect" });
            }
        }
        else {
            res.render('login', { message: "Email and password is incorrect" });
        }

    } catch (error) {
        console.log(error.message);
    }
}



const loadHome = async (req, res) => {
    try {

        const productData = await Product.find({ unlist: false });


        const categoryData = await Category.find({ IsActive: false });


        res.render('home', { product: productData, category: categoryData, user: req.session.user_id })
    } catch (error) {
        console.log(error.message);
    }
}


const shopLoad = async (req, res) => {
    try {
        const productData = await Product.find({ unlist: false });


        const categoryData = await Category.find({ IsActive: false });
        console.log("categoryData:", categoryData);


        res.render('shop', { product: productData, category: categoryData, user: req.session.user_id });
    } catch (error) {
        console.log(error.message);
    }
}

const productsByCategory = async (req, res) => {

    const categoryId = req.query.categoryId;

    const filteredProducts = await ProductHelper.getFilteredProducts(categoryId);

    if (filteredProducts) {
        return res.json({ filteredProducts })
    }
}

const singleProductView = async (req, res) => {
    try {
        const productId = req.query.pid;

        const singleProduct = await userHelper.getSingleProduct(productId);

        if (!singleProduct) {

            return res.status(404).send("Product not found");
        }

        const categoryOfProduct = await userHelper.getCategoryById(singleProduct.category);

        res.render('single-product', { product: singleProduct, category: categoryOfProduct, user: req.session.user_id });
    } catch (error) {
        console.log(error.message);

        res.status(500).send("Internal Server Error");
    }
}


const addToCart = async (req, res) => {
    try {
        const productId = req.query.productId;

        const result = await cartHelper.addToCart(req.session.user_id, productId);

        if (result.addToCart) {
            res.json({ stock: result.stock, addToCart: true });
        } else {
            res.json({ stock: result.stock, addToCart: false });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}


const loadCart = async (req, res) => {
    try {
        const userId = req.session.user_id
        const result = await cartHelper.loadCart(userId);
        const activeCoupens = await coupenHelper.getActiveCoupens()
        const appliedCoupenData = await coupenHelper.getCoupendata(userId);
        console.log("appliedCoupenData:", appliedCoupenData);
        let appliedCoupenCode = '';

        if (Array.isArray(appliedCoupenData) && appliedCoupenData.length > 0) {
            appliedCoupenCode = appliedCoupenData[0].coupenCode;
        }

        console.log("appliedCoupenCodeeeeeeeeeeee:", appliedCoupenCode);



        if (result.message) {
            res.render('cart', { message: result.message });
        } else {
            res.render('cart', {
                products: result.products,
                total: result.total,
                totalCount: result.totalCount,
                subTotal: result.subTotal,
                totalAmount: result.totalAmount,
                user: userId,
                activeCoupens: activeCoupens,
                appliedCoupenCode
            });
        }
    } catch (error) {
        console.log(error.message);
    }
}


const updateQuantity = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.query.productId;
        const newQuantity = req.query.quantity;
        console.log("newQuantity:", newQuantity);

        const result = await cartHelper.updateQuantity(userId, productId, newQuantity);

        res.json(result);
    } catch (error) {
        console.log(error.message);
    }
}

const removeProductFromCart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.query.productId;

        const result = await cartHelper.removeProductFromCart(userId, productId);

        res.json(result);
    } catch (error) {
        console.log(error.message);
    }
};




const checkoutLoad = async (req, res) => {
    try {
        const userId = req.session.user_id;


        const checkoutData = await userHelper.getCheckoutData(userId);

        const coupenData = await coupenHelper.getCoupendata(userId);

        console.log("coupenData:", coupenData);

        checkoutData.coupenData = coupenData;

        let totalDiscount = 0;
        if (checkoutData.coupenData) {
            for (const coupen of checkoutData.coupenData) {

                const discountAmount = (checkoutData.cartTotal * coupen.discount) / 100;

                if (discountAmount > coupen.maxDiscountAmount) {
                    totalDiscount += coupen.maxDiscountAmount;
                } else {
                    totalDiscount += discountAmount;
                }
            }
        }
        const totalToPay = checkoutData.cartTotal - totalDiscount;

        // Add the totalToPay to the checkoutData

        checkoutData.totalToPay = totalToPay;

        savingTotalToPayToCart = await cartHelper.saveTotalPay(userId, totalToPay);

        res.render('checkout', checkoutData);

    } catch (error) {
        console.log(error.message);
    }
};


const addAddressInCheckout = async (req, res) => {
    try {
        const userId = req.session.user_id;
        userHelper.userAddress(req.body, res, userId).then((data) => {
            res.redirect('/checkout')
        })
    } catch (error) {
        console.log(error.message);
    }
}


const orderPlacing = async (req, res) => {
    try {
        let userId = req.session.user_id;

        let paymentMethod = req.body.paymentMethod;



        console.log("paymentMethod:", paymentMethod);

        const { orderedProductDetails, totalOfferDiscount } = await cartHelper.getOrderedProducts(userId);
        console.log("orderedProductDetailstttttt:", orderedProductDetails);
        const appliedCoupenDetails = await coupenHelper.getCoupendata(userId);
        let coupenCode = 0;
        let discount = 0;
        if (appliedCoupenDetails && appliedCoupenDetails.length > 0) {

            coupenCode = appliedCoupenDetails[0].coupenCode;

            discount = appliedCoupenDetails[0].discount;
        }

        const addressDetails = await addressHelper.getDefaultAddress(userId)

        const totalToPay = await cartHelper.getTotalToPay(userId);
        console.log("addressDetails:", addressDetails);

        const order = new Order({
            userId: userId,
            date: new Date(),
            paymentMethod: paymentMethod,
            coupenCode: coupenCode,
            coupenDiscount: discount,
            offerDiscount: totalOfferDiscount,
            products: orderedProductDetails,
            addressDetails: addressDetails,
            totalToPay: totalToPay,
            deliveryStatus:"Placed"

        })


        const saveOrder = await order.save();

        const orderId = saveOrder._id;


        //clear the user's cart after place order

        await cartHelper.clearCart(userId);

        if (req.body.paymentMethod == 'cod') {

            res.json({ success: true, orderId: orderId, message: "Order Placed Successfully" })
        }
        if (req.body.paymentMethod == 'online') {

            const response = await userHelper.generateRazorpay(orderId, totalToPay);
            console.log("response:", response.id);
            res.json(response)
        }




    } catch (error) {
        console.log(error.message);
    }
}


const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user_id;

        console.log("req.bodyyyyy:", req.body);
        const orderId = req.body.orderDetails.receipt;
        console.log("orderIdddddd:", orderId);

        await userHelper.verifyPayment(req.body);

        console.log("payment successFull");

        let paymentStatusChanging = await userHelper.changePaymentStatus(orderId, userId);
        if (paymentStatusChanging) {


            console.log("status changed");
            res.json({ status: true, orderId });
        }

    } catch (error) {
        console.error("Error in verifyPayment:", error);
        res.json({ status: "Order Failed" });
    }
}





const orderSucccessLoad = async (req, res) => {

    const orderId = req.query.orderId

    res.render('order-success', { orderId });
}


const orderSummaryDetails = async (req, res) => {

    const orderId = req.query.orderId;

    let orderSummaryData = await orderHelper.orderSummaryData(orderId);

    orderSummaryData.orderId = orderId;

    res.json(orderSummaryData);
}



const orderSummaryPageLoad = async (req, res) => {

    const encodedData = req.query.data;

    const decodedData = decodeURIComponent(encodedData);

    const orderSummaryData = JSON.parse(decodedData);

    console.log("orderSummaryDataaaaaaaaaaaaaaaaaaa:", orderSummaryData);

    res.render('orderSummary', { orderSummaryData: orderSummaryData });

}


const viewOrderList = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const orderData = await orderHelper.getOrderDataOfUser(userId);

        if (orderData && orderData.length > 0) {

            res.render('orderList', { orders: orderData, user: userId });
        } else {
            res.render('orderList', { user: userId });
        }

    } catch (error) {
        console.log(error.message);
    }
}


const viewOrder = async (req, res) => {
    try {
        const orderId = req.query.orderId;

        let orderSummaryData = await orderHelper.orderSummaryData(orderId);

        if (orderSummaryData) {

            orderSummaryData.orderId=orderId;

            res.render('orderSummary', { orderSummaryData: orderSummaryData });
        }

    } catch (error) {

     console.log(error.message);
    }
}


const orderCancelRequest=async(req,res)=>{
    try {
        console.log("reached here:");
        const userId = req.session.user_id;
        console.log("userId:",userId);
        const cancelReason=req.body;
        const orderId=req.params.orderId;

        console.log("cancelReason:",cancelReason);
        console.log("orderId:",orderId);

        const orderCancelling=await orderHelper.orderCanceling(orderId,cancelReason,userId);
        console.log("orderCancelling:",orderCancelling);
        if(orderCancelling===true){
            res.redirect('/orders');
        }
       
      

    } catch (error) {
        
    }
}

const userLogout = async (req, res) => {
    try {


        delete req.session.user_id
        res.redirect('/')


    } catch (error) {
        console.log(error.message);
    }
}


//forget passord code start

const forgetLoad = async (req, res) => {
    try {
        res.render('forget');
    } catch (error) {
        console.log(error.message);
    }
}

const forgetVerify = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });

        if (userData) {

            if (userData.is_varified === 0) {
                res.render('forget', { message: "please verify your mail" });
            }
            else {
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } })
                console.log(updatedData);
                sendResetPasswordMail(userData.name, userData.email, randomString);
                res.render('forget', { message: "please check your mail to reset your password" })

            }
        }
        else {
            res.render('forget', { message: "user email is incorrect" })
        }
    } catch (error) {
        console.log(error.message);

    }
}

const forgetPasswordLoad = async (req, res) => {
    try {

        const token = req.query.token;
        const tokenData = await User.findOne({ token: token });
        if (tokenData) {
            res.render('forget-password', { user_id: tokenData._id });
        }
        else {
            res.render('404', { message: "Token is invalid" })
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

const loadprofile = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user_id);
        res.render('userprofile', { user: userData });
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

        const userId = req.session.user_id;

        console.log("req.body:", req.body);

        let updateFields = {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile
        };

        const existingUser = await User.findOne({
            $or: [
                { email: req.body.email },
                { mobile: req.body.mobile }
            ],
            _id: { $ne: userId }
        });

        if (existingUser) {
            res.json({ success: false });
        } else {

            const userData = await User.findByIdAndUpdate(
                { _id: req.session.user_id },
                { $set: updateFields },
                { new: true }

            );


            res.json({
                userData,
                success: true
            })




        }


    } catch (error) {
        console.log(error.message);

    }
};


const addressManagement = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const addressData = await Address.find({ user_id: userId });


        res.render('addressManagment', { addressData });
    } catch (error) {
        console.log(error.message);
    }
}

const addAddress = async (req, res) => {
    try {
        res.render('addAddress');
    } catch (error) {
        console.log(error.message);
    }
}
const submitAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        userHelper.userAddress(req.body, res, userId).then((data) => {
            res.redirect('http://localhost:5000/addressManagement');
        });
    } catch (error) {
        console.log(error.message);
    }
}

const editAddress = async (req, res) => {
    try {
        const addressId = req.query.id;

        const addressData = await Address.findOne({ _id: addressId });
        console.log(addressData);

        if (addressData) {
            res.render('editAddress', { address: addressData })
        } else {
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

        const specificAddress = userAddress.find(addr => addr._id.equals(addressId));
        console.log(specificAddress);
        if (!specificAddress) {
            return res.status(404).json({ error: 'Address not found' });
        } else {
            specificAddress.address[0].name = req.body.name;
            specificAddress.address[0].mobile = req.body.mobile;
            specificAddress.address[0].homeAddress = req.body.homeAddress;
            specificAddress.address[0].place = req.body.place;
            specificAddress.address[0].pincode = req.body.pincode

        }
        await specificAddress.save();
        return res.redirect('/addressManagement')
    } catch (error) {
        console.error('Error updating address:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const addressIdToDelete = req.query.id;
        const addressData = await Address.findOne({ _id: addressIdToDelete });
        const sessionUserId = req.session.user_id;

        if (addressData) {
            await Address.deleteOne({ _id: addressData._id });

            if (addressData.address[0].isDefault) {
                const nextAddress = await Address.findOne({ user_id: sessionUserId });

                if (nextAddress) {
                    nextAddress.address[0].isDefault = true;
                    await nextAddress.save();
                }
            }

            return res.redirect('/addressManagement');

        } else {
            console.log('Address data not found.');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const setasDefault = async (req, res) => {
    try {
        const addressId = req.query.id;
        const sessionUserId = req.session.user_id;

        console.log("reached here");

        // Find the current default address and update it
        const currentDefaultAddress = await Address.findOne({ user_id: sessionUserId, 'address.0.isDefault': true });
        if (currentDefaultAddress) {
            currentDefaultAddress.address[0].isDefault = false;
            await currentDefaultAddress.save();
        }

        console.log("currentDefaultAddress:", currentDefaultAddress);

        // Find and update the new default address
        const addressDataToUpdate = await Address.findOneAndUpdate(
            { _id: addressId },
            { $set: { "address.0.isDefault": true } }
        );


        await addressDataToUpdate.save();

        if (req.query.source === 'checkout') {
            return res.json({ message: "Address set as Default Successfully" });
        } else {
            return res.redirect('/addressManagement');
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: error.message });
    }
}





module.exports = {
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
    setasDefault,
    singleProductView,
    addToCart,
    loadCart,
    updateQuantity,
    removeProductFromCart,
    checkoutLoad,
    addAddressInCheckout,
    orderPlacing,
    orderSucccessLoad,
    orderSummaryDetails,
    orderSummaryPageLoad,
    viewOrderList,
    viewOrder,
    verifyPayment,
    productsByCategory,
    orderCancelRequest


}


