const mongoose= require("mongoose");

const adminSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
     password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Number,
        required:true
    },
    token:{
        type:String,
        default:''
    }

});

module.exports=mongoose.model('admin',adminSchema);