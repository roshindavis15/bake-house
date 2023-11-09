
const mongoose= require("mongoose");

const cartSchema=new mongoose.Schema({
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
        quantity:{
            type:Number,
            required:true,
            default:1
        },
     
        total:{
            type:Number,
            default:0
        },
        subtotal:{
            type:Number,
            default:0
        }
    }
    ],
    cartTotal:{
        type:Number,
        default:0
    },
    usedCoupens:{
        
            type:mongoose.Schema.Types.ObjectId,
            ref:'Coupen',
            default:null
        }
        
    
});

module.exports=mongoose.model('Cart',cartSchema);
