const mongoose = require('mongoose')
const User=require('../models/userModel');
const bcrypt= require('bcrypt');

const userHelper = require('../helpers/userHelpers')
const Product=require("../models/productsModel");
const Category=require('../models/categoryModel');
const Address=require('../models/addressModel');
const Cart= require('../models/cartModel');
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
            
            
          res.redirect('home');   
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
        
        
        res.render('home', { user: userData});
        
    } catch (error) {
        console.log(error.message);
    }
}
const shopLoad=async(req,res) =>{
    try {
        const productData= await Product.find({unlist:false});
        
        const categoryData= await Category.find({IsActive:false});
    
        

        res.render('shop',{product:productData,category:categoryData,user:req.session.user_id});
    } catch (error) {
        console.log(error.message);
    }
}
const singleProductView= async(req,res)=>{
    try {
        const productId=req.query.pid;
        const singleProduct= await Product.findById(productId);
        const categoryIdOfProduct= await Category.findById(singleProduct.category);
        
        const categoryOfProduct= await Category.findById(categoryIdOfProduct);
        
        if(singleProduct){
            res.render('single-product',{product:singleProduct,category:categoryOfProduct,user:req.session.user_id});
        }
        
        
    } catch (error) {
        console.log(error.message);
    }
}

User
const addToCart=async(req,res)=>{
    try {
        const productId=req.query.productId;
        console.log("productId:",productId);
        
        let cart= await Cart.findOne({user_id:req.session.user_id});
        console.log("existcart:",cart);

               if(!cart){
                    let newCart=new Cart({user_id:req.session.user_id,products:[]});
                    await newCart.save();
            
                    cart=newCart;
                   
                  }
                  console.log("newCart:",cart);

        const existingProductIndex=cart.products.findIndex((product)=>{
            return product.productId.toString()===productId;
            
        })
        console.log("existingProductIndex:",existingProductIndex);
        if(existingProductIndex=== -1){
            
            console.log("productIdddd",productId);
             var product= await Product.findById(productId);
            
            
            if(product.stock > 0){
                const total=product.price;
                cart.products.push({
                    productId:productId,
                    quantity:1,
                    total,
                });
                console.log("carteyyyy:",cart);
                await cart.save();
                product.stock-=1; //decrease the stock of the product
                await product.save();
                res.json({stock:0,addToCart:true});
                res.redirect('/shop');
            }else{
                res.json({stock:0,addToCart:false});
            }
            
            
            
        }else{
            
            var product= await Product.findById(productId);

            if(product.stock > 0){
                cart.products[existingProductIndex].quantity+=1;
                cart.products[existingProductIndex].total+=product.price;
                product.stock -=1;
                await product.save();
            }else{
                res.json({stock:product.stock,addToCart:false})
            }
            
        }
        cart.total= cart.products.reduce((total,product)=>{
            return total+product.total;
        },0);
        await cart.save();
        res.json({stock:product.stock,addToCart:true});

        
         } catch (error) {

           console.log(error.message);
    }
}


const loadCart= async(req,res)=>{
      try {
        const UserHaveCart= await Cart.findOne({user_id:req.session.user_id});

        // console.log("UserHaveCart:",UserHaveCart);
        if(UserHaveCart){
           let cart= await Cart.findOne({user_id:req.session.user_id})
           .populate({
             path:'products.productId',
             populate:{path:'category', select: 'Discount'}
           })
        //    console.log("cart:",cart);
          let products=cart.products.map((product)=>{
            //total amount of all product
            let total=Number(product.quantity) * Number(product.productId.price);

            

            //calculating category and product offr

            let categoryOfferPercentage= product.productId.category.Discount;
            // console.log("categoryOfferPercentage:",categoryOfferPercentage);
            let productOfferPercentage=product.productId.productOffer;
            // console.log("productOfferPercentage:",categoryOfferPercentage);

            let categoryDiscountAmount=(total*categoryOfferPercentage)/100;
            // console.log("categoryDiscountAmount",categoryDiscountAmount);
            let productDiscountAmount=(total*productOfferPercentage)/100;
            // console.log("productDiscountAmount",productDiscountAmount);
            let finalAmount=total-productDiscountAmount-categoryDiscountAmount;
            // console.log("finalAmount:",finalAmount);
            return{
                _id:product.productId._id.toString(),
                name:product.productId.name,
                categoryOffer:product.productId.category.Discount,
                image:product.productId.image,
                price:product.productId.price,
                description:product.productId.description,
                finalAmnt:finalAmount,
                discountAmount:categoryDiscountAmount+productDiscountAmount,
                productOffer:product.productId.productOffer,
                quantity:product.quantity,
                total:total,
                user_id:req.session.user_id,
                totalDiscountPercentage:productOfferPercentage+categoryOfferPercentage
            }
          }) ;

          //total value of all product in the cart

          let total=products.reduce(
            (sum,product)=> sum+Number(product.total),0
          );
          

          //calculating total product offer discount amount

          totalProductDiscountAmount=0

            let productDiscounts=cart.products.forEach((item)=>{
            let quantity=item.quantity;
            let price=item.productId.price;
            let productOffer=item.productId.productOffer;

            let discountAmount= (quantity*price*productOffer)/100;
            totalProductDiscountAmount+=discountAmount;

          })

          //calculating total category offer discount amount

          let totalCategoryDiscountAmount=0

          let categoryDiscounts=cart.products.forEach((item)=>{

          let actualProductAmount=item.productId.price * item.quantity;

            let categoryOffer=item.productId.category.Discount

            let categoryDiscountAmount=(actualProductAmount*categoryOffer)/100;

            totalCategoryDiscountAmount+=categoryDiscountAmount;

          })

          let totalAmount=total-totalProductDiscountAmount-totalCategoryDiscountAmount;

          //get the total count of the products
          
          let totalCount=products.length;

          res.render('cart',{
            products,
            total,
            totalCount,
            subTotal:total,
            totalAmount
          });

        }else{
            res.render('cart',{message:"Your Cart Is Empty"});
        }
      } catch (error) {
        console.log(error.message);
        
      }
}

const updateQuantity=async(req,res)=>{
    try {
        
        const userId=req.session.user_id;
        
        const productId=req.query.productId;

        
        const newQuantity=req.query.quantity;
        
        const cartFind= await Cart.findOne({user_id:userId})
        .populate({
           path:'products.productId',
           populate:{
           path: 'category'
           }
   })
        
        // console.log("cartFinddddddd",JSON.stringify(cartFind))
        const cartItem = cartFind.products.find((product)=>{
            return product.productId._id.toString()=== productId
        })
        
        
        var product= await Product.findById(productId);
             let responseUpdate;
            if(newQuantity>product.stock){
                const response= {outOfStock:true};
               return res.json(response);
                
            }else{
            const stockDifference=newQuantity-cartItem.quantity;

            cartItem.quantity=newQuantity;
            if(stockDifference > 0){
                
                product.stock -= stockDifference
                
            }else if(stockDifference < 0){
                
                product.stock +=stockDifference
                
           
    }
        
        await product.save()
        await cartFind.save()

//updating the total of the specific product in the cart

            const updatedProduct= cartFind.products.find(product=>product.productId._id.toString()===productId);
            let updatedProductId=updatedProduct.productId;
            const updatedProductPrice = await Product.findOne({ _id: updatedProductId }).select('price');
            const productPrice=updatedProductPrice.price;
        
            updatedProduct.total=productPrice * updatedProduct.quantity;
            
            
          
       
            await cartFind.save();

        // check if the quantity is 0 or less
           if(updatedProduct.quantity <=0){

       //removing the product from the cart
            cartFind.products= cartFind.products.filter(product=> !product.productId._id.equals(productId));
            await cartFind.save();
            const response={deleteProduct:true}
            return response
        }

        //grandtotal calculating 

           const grandTotal= cartFind.products.reduce(
             (sum,product)=> sum+ Number(product.total),
             0
             );
        //    console.log("grandtotal",grandTotal);
        //calculating total productoffer discount amount
           let totalProductDiscountAmount=0;

            const productDiscounts= cartFind.products.forEach((item)=>{
            const quantity=item.quantity
            
            
            const findCartItemPrice = cartFind.products.find((product)=>{
                return product.productId._id.toString()=== productId
            })
            
            const productPrice=findCartItemPrice.productId.price;
        
            // console.log("productPrice:",productPrice);
           
            const productOffer=findCartItemPrice.productId.productOffer;
            // console.log("productOffer:",productOffer);
            // console.log("itemquantity",quantity);

            const discountAmount=(quantity*productPrice*productOffer)/100;
            // console.log("discountAmount",discountAmount);
            totalProductDiscountAmount = discountAmount;
        })
        //   console.log(" totalProductDiscountAmount", totalProductDiscountAmount);
        //calcualating total categoryOffer discount amt

        let totalCategoryDiscountAmount=0;

        const  categoryDiscounts= cartFind.products.forEach((item)=>{
            const quantity=item.quantity;
            const findCartItemPrice=cartFind.products.find((product)=>{
                return product.productId._id.toString()===productId
            });
           
            const productPrice=findCartItemPrice.productId.price;
            
            const categoryOffer=findCartItemPrice.productId.category.Discount;
            
            
            const categoryDiscountAmount=(quantity*productPrice*categoryOffer)/100;
            
            totalCategoryDiscountAmount=categoryDiscountAmount;
           
        })  
        const eachProdutSubtotal=cartFind.products.map(product=>product.total);
        const grandSubtotal=eachProdutSubtotal.reduce((acc,currentTotal)=>acc+currentTotal)
        console.log("grandSubtotal",grandSubtotal);
        
        const totalAmount=updatedProduct.total-totalProductDiscountAmount-totalCategoryDiscountAmount;
        
        let cartTotalAmount = 0;

// Iterate through each product in the cart
cartFind.products.forEach(product => {
   const price = product.productId.price;
   const categoryOffer = product.productId.category.Discount;
   const productOffer = product.productId.productOffer;

   // Calculate the reduced price for this product
   const reducedPrice = price - (price * (categoryOffer / 100)) - (price * (productOffer / 100));

   // Add the reduced price multiplied by the quantity to the total amount
   cartTotalAmount += (reducedPrice * product.quantity);
});
       console.log("total cart amount:",cartTotalAmount);
        //response for frontend

         responseUpdate={
            quantity:updatedProduct.quantity,
            totalAmount:totalAmount,
            grandTotal:grandTotal,
            grandSubTotal:grandSubtotal,
            cartTotalAmount:cartTotalAmount,
            
            
        }    
        };

           console.log("response:",responseUpdate);
           res.json(responseUpdate);
    

    } catch (error) {
        console.log(error.message);
    }
}

    const producutRemovingFromCart=async(req,res)=>{
        try {
            const userId=req.session.user_id;
            console.log(userId);
            const productId=req.query.productId;
            console.log(productId);
            //find the cart with specific userId and productId

            const cart=await Cart.findOneAndUpdate(
                {user_id:userId},
                {$pull:{products:{productId:productId}}},
                {new:true}
            );
            if(cart){
                
                //product removed from the cart
                const response={productRemovingFromCart:true};
                return res.json(response)   ;
            }
        } catch (error) {
            console.log(error.message);
        }
}

const checkoutLoad= async(req,res)=>{
    try {
        res.render('checkout')
    } catch (error) {
        console.log(error.message);
    }
}

const userLogout=async(req,res)=>{
    try {
        
        
        delete req.session.user_id 
        res.redirect('/')
        

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
    
      const userId = req.body.user_id;
      console.log(req.body);
      
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
           res.json({ success:false });
      } else {
       
          const userData = await User.findByIdAndUpdate(
            {  _id:req.session.user_id},
              { $set: updateFields },
              { new: true }
              
          );
         

          res.json({userData,
          success:true
    })

         
         
           
      }
      

  } catch (error) {
      console.log(error.message);
      
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
      const userId= req.session.user_id;
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
    setasDefault,
    singleProductView,
    addToCart,
    loadCart,
    updateQuantity,
    producutRemovingFromCart,
    checkoutLoad
}

