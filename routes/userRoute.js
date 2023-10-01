const express=require("express");
const path=require("path");
const user_route=express();
const session= require("express-session");
const bodyParser=require('body-parser')

const config=require("../config/config");
const userController= require("../controllers/userController");

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
    destination:function(){
     cb(null,path.join(__dirname,'../public,userImages'));
    },
    filename:function(req,file,cb){
     const name=Date.now()+'-'+file.originalname;
     cb(null,name);
    }
});
    const upload=multer({storage:storage});




user_route.get('/',auth.isLogout,userController.homeLoad);

user_route.get('/signup',auth.isLogout,userController.loadRegister);

user_route.post('/signup',userController.insertUser)

// user_route.post('/',upload.single('image'),userController.insertUser)

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

user_route.get('/shop',auth.isLogin,userController.shopLoad);     
      
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