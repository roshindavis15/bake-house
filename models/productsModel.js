const mongoose =  require("mongoose");

const productSchema= new mongoose.Schema({
    name:{
        type:String,
        require:true
    },

    price:{
        type:Number,
        require:true
    },

    description:{
        type:String,
        require:true
    },

    category:{
        type:mongoose.Schema.Types.ObjectId, //use objectid to reference category
        ref:'Category'
    },
    image:[{
        type:String,
        require:true
    }]
    ,
    
    
    productOffer:{
        type:Number,
        default:0
    },

    stock:{
        type:Number,
        default:0
    },
    unlist:{
        type:Boolean,
        default:false
    }
});

module.exports = mongoose.model('Product',productSchema);
