const mongoose=require("mongoose");

const wishListSchema=new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    products:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product"
            },
            addedAt:{
                type:Date,
                default:Date.now    
            }
        },
        
    ],
    
})

module.exports=mongoose.model('WishList',wishListSchema);