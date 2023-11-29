
const express=require("express");

const admin_route=express();

const session=require("express-session");
const config=require("../config/config")
const adminAuth= require("../middleware/adminAuth");
const adminController=require("../controllers/adminController");
const coupenController=require("../controllers/coupenController")
const multer= require('multer');
const bodyParser=require("body-parser");

admin_route.use(session({
    secret:config.sessionSecret,
    saveUninitialized:false,
    resave:false
}));



admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin');








const storage= multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, 'public/frutika-master/uploads');
    },
    filename: function (req,file,cb){
        const uniqueSuffix=Date.now()+'-'+file.originalname
        cb(null,uniqueSuffix);
    }
});

const upload= multer({ storage: storage});



admin_route.get('/',adminAuth.isLogout,adminController.loadLogin);

admin_route.post('/',adminAuth.isLogout,adminController.verifyLogin);

admin_route.get('/home',adminAuth.isLogin,adminController.loadDashboard);

admin_route.get('/logout',adminAuth.isLogin,adminController.logout);
 
admin_route.get('/forget',adminAuth.isLogout,adminController.forgetLoad);
admin_route.post('/forget',adminController.forgetVerify);

admin_route.get('/forget-password',adminAuth.isLogout,adminController.forgetPasswordLoad);
admin_route.post('/forget-password',adminController.resetPassword);

admin_route.get('/dashboard',adminAuth.isLogin,adminController.adminDashboard)

admin_route.get('/usersList',adminAuth.isLogin,adminController.userManagement);

admin_route.get('/productIndex',adminAuth.isLogin,adminController.productManagement);

admin_route.get('/category',adminAuth.isLogin,adminController.categoryManagement);

admin_route.get('/add-category',adminAuth.isLogin,adminController.categoryLoad)
admin_route.post('/add-category',adminAuth.isLogin,adminController.addCategory)
admin_route.get('/edit-category',adminAuth.isLogin,adminController.editCategoryLoad)
admin_route.post('/updateCategory',adminAuth.isLogin,adminController.updateCategory)
admin_route.get('/add-product',adminAuth.isLogin,adminController.loadProduct);
admin_route.post('/add-product',adminAuth.isLogin,upload.array('productImage'),adminController.addProduct);

admin_route.get('/blockUser',adminAuth.isLogin,adminController.blockUser);
admin_route.get('/unblockUser',adminAuth.isLogin,adminController.unblockUser)

admin_route.get('/unlist',adminAuth.isLogin,adminController.unlistProduct);
admin_route.get('/list',adminAuth.isLogin,adminController.listProduct);

admin_route.get('/edit-product',adminAuth.isLogin,adminController.editProductLoad);
admin_route.post('/editProduct',adminAuth.isLogin,adminController.editProduct);

admin_route.get('/notActive',adminAuth.isLogin,adminController.notActiveCategory);
admin_route.get('/isActive',adminAuth.isLogin,adminController.ActiveCategory);

admin_route.get('/CoupenManagment',adminAuth.isLogin,coupenController.coupenManagementLoad);
admin_route.get('/orderMaanagment',adminAuth.isLogin,adminController.orderManagmentLoad);
admin_route.get('/add-coupen',adminAuth.isLogin,coupenController.addCoupenLoad);
admin_route.post('/addCoupen',adminAuth.isLogin,coupenController.addCoupen);
admin_route.get('/activeCoupen',adminAuth.isLogin,coupenController.activatingCoupen);
admin_route.get('/notActiveCoupen',adminAuth.isLogin,coupenController.deactivatingCoupen);
admin_route.post('/setasPreparing',adminAuth.isLogin,adminController.setasPreparing);
admin_route.get('/viewOrderDetails/:orderId', adminAuth.isLogin, adminController.viewOrderDetails);
admin_route.post('/acceptCancellation', adminAuth.isLogin, adminController.orderCanceling);
admin_route.post('/rejectCancellation',adminAuth.isLogin,adminController.rejectCancellation);
admin_route.post('/updateOrderStatus',adminAuth.isLogin,adminController.updateOrderStatus);





module.exports=admin_route;
