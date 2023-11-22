let User=require("../models/userModel");
const Product=require("../models/productsModel");
const Category= require("../models/categoryModel");
const Admin = require('../models/adminModel')
const bcrypt=require('bcrypt');
const randomstring= require('randomstring');
const config= require("../config/config")
const nodemailer= require("nodemailer");
const productHelper=require('../helpers/productHelpers');
const adminHelper= require("../helpers/adminHelpers")



const securePassword= async(password)=>{

    try {
        
        const passwordHash=await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }

} 

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
            html:'<p> Hii '+name+', please click here to <a href="http://127.0.0.1:3000/admin/forget-password?token='+ token +' "> Reset </a>Your Password</p>'

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

const loadLogin=async(req,res)=>{
    try {
        await adminHelper.loadingLogin(req,res)
    
    } catch (error) {
        console.log(error.message);
    }
}


const verifyLogin=async(req,res)=>{
    try {
        await adminHelper.verifyingLogin(req,res)
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard=async(req,res)=>{

    try {
        await adminHelper.loadingDashboard(req,res)
        
    } catch (error) {
        console.log(error.message);
    }
}

const logout=async(req,res)=>{
       
    try {
        
        delete req.session.admin_id;
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");

        res.redirect('/admin');
    } catch (error) {
        
        console.log(error.message);
    }
}
const forgetLoad=async(req,res)=>{
    try {

        res.render('forget');
        
    } catch (error) {
        
        console.log(error.message);
    }
}
const forgetVerify= async(req,res)=>{

    try {
        
        const email=req.body.email;
      const userData = await User.findOne({email:email});
        if(userData){
            if(userData.is_admin===0){

                res.render('forget',{message:'Email is incorrect'});
            }
            else{
                 const randomString= randomstring.generate();
                 const  updatedData= await User.updateOne({email:email},{$set:{token:randomString}});
                 sendResetPasswordMail(userData.name,userData.email,randomString);
                 res.render('forget',{message:'please check your mail to reset your password'});
            }
        }
        else{
            res.render('forget',{message:'Email is incorrect'});
        }


    } catch (error) {
        
        console.log(error.message); 
    }
}

const forgetPasswordLoad = async(req,res)=>{
    try {
       
        const token=req.query.token;
        const tokenData=await User.findOne({token:token});
        if(tokenData){
           res.render('forget-password',{user_id:tokenData._id})

        }else{
            res.render('404',{message:"Invalid link"});
        }

    } catch (error) {
        console.log(error.message);

    }
}
const resetPassword= async(req,res)=>{
    try {

        const password= req.body.password;
        const user_id= req.body.user_id;

        const securePass= await securePassword(password);

       const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:securePass,token:''}})
        
       res.redirect('/login');

    } catch (error) {
        console.log(error.message);     
    }
}
const adminDashboard= async(req,res)=>{
    try {
       const usersData = await User.find({is_admin:0})
        res.render('dashboard',{users:usersData});
    } catch (error) {
        console.log(error.message);
    }
}
const userManagement= async(req,res)=>{
    try {
        const userData= await User.find()
       
        res.render('usersList',{users:userData});
        
    } catch (error) {
        console.log(error.message);
    }
}

const productManagement = async (req,res)=>{
   try {
    const productData= await Product.find()
    console.log("productData:",productData);
    
    res.render('productIndex',{products:productData});
   
   } catch (error) {
    console.log(error.message);
   }
}

const categoryManagement=async(req,res)=>{
    try {
        const categoryData= await Category.find({}) 
        

        res.render('category',{categories:categoryData})
    } catch (error) {
        console.log(error.message);
    }
}

const loadProduct = async(req,res)=>{
    try {
        const categoryData= await Category.find()
        res.render('add-product' ,{category:categoryData});
        
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


const categoryLoad= async(req,res)=>{
    try {
        res.render('add-category');
    } catch (error) {
        console.log(error.message);
    }
}
const addCategory= async(req,res)=>{
    try {
        
        const categoryData= await productHelper.addCategory(req.body);
        console.log("categoryDataa:",categoryData);

        if(categoryData.categoryExist){

            res.json({categoryAlreadyExist:true});

        }else{

            res.json({categoryAlreadyExist:false});
        }
     

    } catch (error) {
        console.log(error.message);
        res.status(500).send("internal server error");
    }
}


const blockUser= async(req,res)=>{
       try {
        
         const userId=req.query.uid;
         const updateInfo= await User.updateOne({_id:userId},{ $set: {block:true}});
        
         res.redirect('/admin/usersList');
         
         
       } catch (error) {
         console.log(error.message);
       }
}
const unblockUser= async(req,res)=>{
    try{
        console.log('unblock',req.query.uid);
        const userId=req.query.uid;
        const updateInfo= await User.updateOne({_id:userId},{$set:{block:false}});
       
       res.redirect('/admin/usersList');
    }catch(error){
        console.log(error.message);
    }
}

const unlistProduct= async(req,res)=>{
    try {
        const productId=req.query.pid;
        const updateInfo= await Product.updateOne({_id:productId},{$set:{unlist:true}});
        res.redirect('/admin/productIndex');
    } catch (error) {
        console.log(error.message);
    }
}

const listProduct= async(req,res)=>{
    try {
        const productId=req.query.pid;
        const updateInfo= await Product.updateOne({_id:productId},{$set:{unlist:false}});
        console.log(updateInfo);
        res.redirect('/admin/productIndex');
    } catch (error) {
        console.log(error.message);
    }
}

const editProductLoad= async(req,res)=>{
    try {
        const productId=req.query.pid;
        console.log("productId:",productId);
        const editProduct=await Product.findById(productId);
        
        if(editProduct){
            res.render('editProduct',{product:editProduct});
        }
       } catch (error) {
        console.log(error.message);
      }
    }


const editProduct= async(req,res)=>{
        
        try {
        

            let updateFields={
                name:req.body.name,
                price:req.body.price,
                stock:req.body.stock ,
                description:req.body.description,
                
            };
            
            let productId=req.body.productId;
            
            let productAlreadyExist = await Product.findOne({ 
                name: updateFields.name, 
                _id: { $ne: productId } 
            });
            console.log("productalready:",productAlreadyExist);
            if(productAlreadyExist){
                const response={productNameAlreadyExist:true};
                return res.json(response);
            }else{
                
                console.log("elseiddd:",productId);
                console.log("updateFields:",updateFields);
            console.log("productAlreadyExist:",productAlreadyExist);
        let productData= await Product.findByIdAndUpdate(
            productId,
            {$set:updateFields},
            {new:true}
            
        );
        console.log('productdata:',productData);
        if(!productData){
            return res.status(404).json({error:"product not found"});
        }
            return res.redirect("/admin/productIndex");
            }
        } catch (error) {
            console.log(error.message);
        }
    }

const notActiveCategory= async(req,res)=>{
   try{
    const categoryId=req.query.cid;
    
    const updateInfo=await Category.updateOne({_id:categoryId},{$set:{IsActive:true}});
    
    res.redirect('/admin/category');
} catch(error){
    console.log(error.message);
}
}

const ActiveCategory= async(req,res)=>{
    try {
        const categoryId=req.query.cid;
        const updateInfo=await Category.updateOne({_id:categoryId},{$set:{IsActive:false}});
        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
    }
}

const editCategoryLoad=async(req,res)=>{
    const categoryId=req.query.cid;
    console.log("categoryId:",categoryId);
    
    const categoryData= await Category.findOne({_id:categoryId});
    console.log("categoryData:",categoryData);
    if(categoryData){
        res.render('edit-category',{category:categoryData});
    }

}

const updateCategory= async(req,res)=>{
    try {
        console.log("req.body:",req.body);
        let updateFields={
            Name:req.body.name,
            Description:req.body.description,
            Discount:req.body.discount
        };

      let  categoryId=req.body.categoryId
        console.log("categoryIdddddd:",categoryId);
        
        let categoryAlreadyExist=await Category.findOne({
            Name:updateFields.Name,
            _id:{$ne:categoryId}
        });
        console.log("alreadyyy:",categoryAlreadyExist);

        if(categoryAlreadyExist){
            res.json({categoryAlreadyExist:true});
        }
        else{
            let categoryData= await Category.findByIdAndUpdate(
                categoryId,
                {$set:updateFields},
                {new:true}
            )
            return res.json({categoryAlreadyExist:false})
            return res.redirect('/admin/category')
        }

    } catch (error) {
        
    }
}








module.exports={
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
    updateCategory


}