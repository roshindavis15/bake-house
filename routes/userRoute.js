const express=require("express");
const path=require("path");
const user_route=express();
const session= require("express-session");
const bodyParser=require('body-parser')

const config=require("../config/config");
const userController= require("../controllers/userController");
const coupenController= require("../controllers/coupenController");

user_route.use(session({
    secret:config.sessionSecret,
    resave:true,
    saveUninitialized:false   
}));

const auth=require("../middleware/auth")

user_route.set('view engine','ejs');    
user_route.set('views','./views/users');




user_route.use(bodyParser.urlencoded({extended:true}));
user_route.use(bodyParser.json());


const multer=require("multer");


const storage=multer.diskStorage({
    destination:function(req,file,cb){
     cb(null,'public/frutika-master/userImages');
    },
    filename:function(req,file,cb){
        const uniqueSuffix=Date.now()+'-'+file.originalname
     cb(null,uniqueSuffix);
    }
});
    const upload=multer({storage:storage});




user_route.get('/',auth.isLogout,userController.homeLoad);

user_route.get('/signup',auth.isLogout,userController.loadRegister);

user_route.post('/signup',userController.insertUser)



user_route.get('/login',auth.isLogout,userController.loadLogin);


user_route.get('/verifyMail',userController.verifyMail);
user_route.post('/login',userController.verifyLogin)

user_route.get('/home',auth.isLogin,userController.loadHome)
user_route.get('/logout',auth.isLogin,userController.userLogout)

user_route.get('/forget',auth.isLogout,userController.forgetLoad)
user_route.post('/forget',userController.forgetVerify);

user_route.get('/forget-password',auth.isLogout,userController.forgetPasswordLoad);
user_route.post('/forget-password',userController.resetPassword);

user_route.get('/profile',auth.isLogin,userController.loadprofile);

user_route.get('/edit', auth.isLogin, userController.editLoad);

user_route.get('/shop',userController.shopLoad); 

user_route.get('/singleProduct',auth.isLogin,userController.singleProductView);

user_route.get('/cart',auth.isLogin,userController.loadCart);

user_route.post('/addtoCart',auth.isLogin,userController.addToCart);

user_route.post('/updateQuantity',auth.isLogin,userController.updateQuantity);

user_route.post('/producutRemovingFromCart',auth.isLogin,userController.removeProductFromCart);

user_route.get('/checkout',auth.isLogin,userController.checkoutLoad)

user_route.post('/addAddressInCheckout',auth.isLogin,userController.addAddressInCheckout)

user_route.post('/applyCoupen',auth.isLogin,coupenController.applyingCoupen);

user_route.post('/removeCoupen',auth.isLogin,coupenController.removeCoupenByUSer)

user_route.post('/place-order',auth.isLogin,userController.orderPlacing);

user_route.get('/orderSuccess',auth.isLogin,userController.orderSucccessLoad);

user_route.get('/orderSummary',auth.isLogin,userController. orderSummaryDetails);

user_route.get('/orderSummaryPage',auth.isLogin,userController.orderSummaryPageLoad);

user_route.get('/orders',auth.isLogin,userController.viewOrders);






user_route.post('/edit',userController.updateProfile);

user_route.post('/otpverify',userController.otpverify);

user_route.get('/addressManagement',auth.isLogin,userController.addressManagement);
user_route.get('/addAddress',auth.isLogin,userController.addAddress);

user_route.post('/submitAddress',auth.isLogin,userController.submitAddress);

user_route.get('/editAddress',auth.isLogin,userController.editAddress);
user_route.post('/updateAddress',auth.isLogin,userController.updateAddress);

user_route.get('/deleteAddress',auth.isLogin,userController.deleteAddress);

user_route.get('/setasDefault',auth.isLogin,userController.setasDefault);






module.exports=user_route;