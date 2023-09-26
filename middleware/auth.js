const User= require("../models/userModel");
const session = require("express-session");




const isLogin= async(req,res,next)=>{
    try {
        if(req.session.user_id){

            const userData= await User.findOne({_id:req.session.user_id})

            if(userData.block){
                
               return res.render('login',{message:"you are blocked by admin please contact admin"})
            }
            
            next(); 
        }
        else{
             res.redirect('/')
        }
        

        


    } catch (error) {
        console.log(error.message);
    }
}

const isLogout= async(req,res,next)=>{
    try {
        if(req.session.user_id){
           return  res.redirect('home');
        }
        next(); 
    
    } catch (error) {
        console.log(error.message);
    }
}

//middleware for checking the user is blocked..

const checkBlockedStatus= async(req,res,next)=>{
    try{
            const userId=req.session.user_Id;
            
            const user= await User.findOne({_id:userId});
            if(user && user.block===true){
                return res.redirect('/users/blocked');

            }
            next();
    }catch(error){
        console.error(error);
        res.status(500).send('server error');
}
}
module.exports={
    isLogin,
    isLogout,
    checkBlockedStatus
}