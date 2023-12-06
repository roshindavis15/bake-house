const mongoose = require('mongoose')
let User = require("../models/userModel");
const Product = require("../models/productsModel");
const Category = require("../models/categoryModel");
const Admin = require('../models/adminModel')
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const config = require("../config/config")
const nodemailer = require("nodemailer");
const productHelper = require('../helpers/productHelpers');
const orderHelper= require('../helpers/orderHelper');
const adminHelper = require("../helpers/adminHelpers");
const { OrderedBulkOperation } = require("mongodb");



const securePassword = async (password) => {

    try {

        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }

}

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
            html: '<p> Hii ' + name + ', please click here to <a href="http://127.0.0.1:3000/admin/forget-password?token=' + token + ' "> Reset </a>Your Password</p>'

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

const loadLogin = async (req, res) => {
    try {
        await adminHelper.loadingLogin(req, res)

    } catch (error) {
        console.log(error.message);
    }
}


const verifyLogin = async (req, res) => {
    try {
        await adminHelper.verifyingLogin(req, res)

    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async (req, res) => {

    try {
        
        const chartData= await adminHelper.getChartData();
        console.log("chartData:",chartData);
        const placedOrderCount= await adminHelper.getTotalPlacedOrderCount();
        const cancelledOrderCount= await adminHelper.getTotalCancelledOrderCount();
        const deliveredOrderCount= await adminHelper.getTotalDeliveredOrderCount()
        console.log("placedOrderCount:",placedOrderCount);
        console.log("cancelledOrderCount:",cancelledOrderCount);
        console.log("deliveredOrderCount:",deliveredOrderCount);
        res.render('index',{placedOrderCount:placedOrderCount,cancelledOrderCount:cancelledOrderCount,deliveredOrderCount});

    } catch (error) {
        console.log(error.message);
    }
}



const logout = async (req, res) => {

    try {

        delete req.session.admin_id;
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");

        res.redirect('/admin');
    } catch (error) {

        console.log(error.message);
    }
}


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
            if (userData.is_admin === 0) {

                res.render('forget', { message: 'Email is incorrect' });
            }
            else {
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } });
                sendResetPasswordMail(userData.name, userData.email, randomString);
                res.render('forget', { message: 'please check your mail to reset your password' });
            }
        }
        else {
            res.render('forget', { message: 'Email is incorrect' });
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
            res.render('forget-password', { user_id: tokenData._id })

        } else {
            res.render('404', { message: "Invalid link" });
        }

    } catch (error) {
        console.log(error.message);

    }
}
const resetPassword = async (req, res) => {
    try {

        const password = req.body.password;
        const user_id = req.body.user_id;

        const securePass = await securePassword(password);

        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: securePass, token: '' } })

        res.redirect('/login');

    } catch (error) {
        console.log(error.message);
    }
}
const adminDashboard = async (req, res) => {
    try {
        const usersData = await User.find({ is_admin: 0 })
        res.render('dashboard', { users: usersData });
    } catch (error) {
        console.log(error.message);
    }
}
const userManagement = async (req, res) => {
    try {
        const userData = await User.find()

        res.render('usersList', { users: userData });

    } catch (error) {
        console.log(error.message);
    }
}

const productManagement = async (req, res) => {
    try {
        const productData = await Product.find()
        console.log("productData:", productData);

        res.render('productIndex', { products: productData });

    } catch (error) {
        console.log(error.message);
    }
}

const categoryManagement = async (req, res) => {
    try {
        const categoryData = await Category.find({})


        res.render('category', { categories: categoryData })
    } catch (error) {
        console.log(error.message);
    }
}


const orderManagmentLoad = async (req, res) => {
    try {

        const orderData = await adminHelper.getOrderData();
        if (orderData) {
            res.render('orderManagment',{orders:orderData});
        }

    } catch (error) {
       console.log(error.message);
    }

}

const viewOrderDetails=async(req,res)=>{
    try {
        const orderId = req.params.orderId;
        let orderDetails= await orderHelper.orderSummaryData(orderId);
        if (orderDetails) {
              orderDetails.orderId=orderId;
            if (orderDetails.cancellationStatus === "Requested") {
                
                const cancellationDetails = await orderHelper.getCancellationDetails(orderId);

                orderDetails = { ...orderDetails, cancellationDetails };
                
            }
            res.render('orderDetail', { orderDetails });
        }
    } catch (error) {
       console.log(error.message);
    }
}

const orderCanceling=async(req,res)=>{
    try {
        
        const orderId = req.body.orderId;
        const cancelOrderResult= await orderHelper.cancellingOrder(orderId) ;
        console.log("cancellingOrder:",cancelOrderResult);
        if(cancelOrderResult.success){
            
        
        if(cancelOrderResult.paymentMethod==="wallet"){
            const amountReturningToWallet= await adminHelper.amountReturningToWallet(cancelOrderResult.paymentMethod,cancelOrderResult.userId,cancelOrderResult.total);
            return res.json({orderCancelled:true});
        }
        return res.json({orderCancelled:true});
    }
        else{
            res.json({orderCancelled:false})
        }
    } catch (error) {
        console.log(error.message);
    }
}

const rejectCancellation=async(req,res)=>{
    try {
        const orderId=req.body.orderId;
        console.log("reached here with orderId:",orderId);
        const rejectCancelling=await orderHelper.rejectCancellationRequest(orderId);
        console.log("rejecting cancel:",rejectCancelling);
        return res.json({rejectCancelRequest:true})
    } catch (error) {
        console.log(error.message);
    }
}

const updateOrderStatus=async(req,res)=>{
    try {
    
        const orderId=req.body.orderId;
        const status=req.body.status;
        const updatingStatus= await orderHelper.updateStatus(orderId,status);
        console.log("updatingStatus",updatingStatus);
        if(updatingStatus){
            return res.json({updated:true});
        }
    } catch (error) {
        console.log(error.message);
    }
}


    const setasPreparing= async(req,res)=>{
        try {
            const orderId=req.body.orderId;
            const changeStatus= await adminHelper.changeStatus(orderId)
            if(changeStatus){
                return res.json({success:true})
            }
        } catch (error) {
            console.log(error.message);
        }
    }




const loadProduct = async (req, res) => {
    try {
        const categoryData = await Category.find()
        res.render('add-product', { category: categoryData });

    } catch (error) {
        console.log(error.message);
    }
}

const addProduct = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.json({ success: false, message: 'No image uploaded' });
        }

        const allowFileTypes = ['image/jpeg', 'image/png'];
        for (const file of req.files) {
            if (!allowFileTypes.includes(file.mimetype)) {
                return res.json({ fileType: false, message: 'Invalid file type' });
            }
        }

        const imagePaths = req.files.map(file => file.filename);
        productHelper.addProduct(req.body, imagePaths)
            .then((productData) => {
                res.json({ success: true });
            })
            .catch((err) => {
                res.json({ success: false });
            });

    } catch (error) {
        console.log(error.message);

    }
};


const categoryLoad = async (req, res) => {
    try {
        res.render('add-category');
    } catch (error) {
        console.log(error.message);
    }
}


const addCategory = async (req, res) => {
    try {

        const categoryData = await productHelper.addCategory(req.body);
        console.log("categoryDataa:", categoryData);

        if (categoryData.categoryExist) {

            res.json({ categoryAlreadyExist: true });

        } else {

            res.json({ categoryAlreadyExist: false });
        }


    } catch (error) {
        console.log(error.message);
        res.status(500).send("internal server error");
    }
}


const blockUser = async (req, res) => {
    try {

        const userId = req.query.uid;
        const updateInfo = await User.updateOne({ _id: userId }, { $set: { block: true } });

        res.redirect('/admin/usersList');


    } catch (error) {
        console.log(error.message);
    }
}


const unblockUser = async (req, res) => {
    try {
        console.log('unblock', req.query.uid);
        const userId = req.query.uid;
        const updateInfo = await User.updateOne({ _id: userId }, { $set: { block: false } });

        res.redirect('/admin/usersList');
    } catch (error) {
        console.log(error.message);
    }
}


const unlistProduct = async (req, res) => {
    try {
        const productId = req.query.pid;
        const updateInfo = await Product.updateOne({ _id: productId }, { $set: { unlist: true } });
        res.redirect('/admin/productIndex');
    } catch (error) {
        console.log(error.message);
    }
}


const listProduct = async (req, res) => {
    try {
        const productId = req.query.pid;
        const updateInfo = await Product.updateOne({ _id: productId }, { $set: { unlist: false } });
        console.log(updateInfo);
        res.redirect('/admin/productIndex');
    } catch (error) {
        console.log(error.message);
    }
}


const editProductLoad = async (req, res) => {
    try {
        const productId = req.query.pid;
        console.log("productId:", productId);
        const editProduct = await Product.findById(productId);

        if (editProduct) {
            res.render('editProduct', { product: editProduct });
        }
    } catch (error) {
        console.log(error.message);
    }
}


const editProduct = async (req, res) => {
    try {
        let updateFields = {
            name: req.body.name,
            price: req.body.price,
            stock: req.body.stock,
            description: req.body.description,
        };

        let productId = req.body.productId;

        const result = await adminHelper.updateProduct(updateFields, productId);

        if (result.productNameAlreadyExist === true) {
            return res.json({ productNameAlreadyExist: true });
        } else if (result.success) {
            return res.json({ success: true, message: "Product updated successfully", redirectTo: "/productIndex" });
        } else {
            return res.status(404).json({ error: "Product not found" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};


const notActiveCategory = async (req, res) => {
    try {
        const categoryId = req.query.cid;

        const updateInfo = await Category.updateOne({ _id: categoryId }, { $set: { IsActive: true } });

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
    }
}

const ActiveCategory = async (req, res) => {
    try {
        const categoryId = req.query.cid;
        const updateInfo = await Category.updateOne({ _id: categoryId }, { $set: { IsActive: false } });
        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
    }
}

const editCategoryLoad = async (req, res) => {
    const categoryId = req.query.cid;
    console.log("categoryId:", categoryId);

    const categoryData = await Category.findOne({ _id: categoryId });
    console.log("categoryData:", categoryData);
    if (categoryData) {
        res.render('edit-category', { category: categoryData });
    }

}

const updateCategory = async (req, res) => {
    try {
        let updateFields = {
            Name: req.body.name,
            Description: req.body.description,
            Discount: req.body.discount
        };

        let categoryId = req.body.categoryId;

        const result = await adminHelper.updateCategory(updateFields, categoryId);

        if (result.categoryAlreadyExist === true) {
            return res.json({ categoryAlreadyExist: true });
        } else if (result.error) {
            return res.status(404).json({ error: "Category not found" });
        } else {
            return res.json({ categoryAlreadyExist: false });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};


const salesLoad =async (req,res)=>{
    try {
       
            res.render('sales');
        
    } catch (error) {
        console.log(error.message);
    }
}


const getChartData=async(req,res)=>{
    try {

        console.log("reached hereree");
        const chartData= await adminHelper.getChartData();
        console.log(chartData);
        if(chartData){
            res.json({chartData});
        }
    } catch (error) {
        console.log(error.message);
    }
}





module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    adminDashboard,
    userManagement,
    productManagement,
    loadProduct,
    addProduct,
    blockUser,
    unblockUser,
    categoryManagement,
    addCategory,
    categoryLoad,
    unlistProduct,
    listProduct,
    notActiveCategory,
    ActiveCategory,
    editProductLoad,
    editProduct,
    editCategoryLoad,
    updateCategory,
    orderManagmentLoad,
    setasPreparing,
    viewOrderDetails,
    orderCanceling,
    rejectCancellation,
    updateOrderStatus,
    salesLoad,
    getChartData


}