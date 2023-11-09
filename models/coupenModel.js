const mongoose= require("mongoose");

const coupenSchema= new mongoose.Schema({
    coupenCode:{
        type:String,
        required:true,

    },
    description:{
        type:String,
        required:false
    },
    discount:{
        type:Number,
        required:true
    },
    maxDiscountAmount:{
        type:Number,
        required:true
    },
    validFor:{
        type:Number,
        required:true
    },
    activeCoupen:{
        type:Boolean,
        default:false,

    },
    usageCount:{
        type:Number,
        default:0
    },
    usageLimit:{
        type:Number
    },
    createdOn:{
        type:Date,
        require:true
    },
    
})

module.exports=mongoose.model('Coupen',coupenSchema)