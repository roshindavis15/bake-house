
const mongoose= require("mongoose");

const categorySchema= new mongoose.Schema({
    Name:{
        type: String,
        require: true
    },

    Description :{
        type: String,
        default:0
    },

    Discount:{
        type:String,
        default:0
    },
    IsActive:{
        type:Boolean,
        default:false
    }

});



module.exports=mongoose.model('Category', categorySchema)