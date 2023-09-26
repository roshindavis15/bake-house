const mongoose= require("mongoose");

const addressSchema= new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"  //using here for reference for the specific user
    },
    address:[
        {
          name:{
            type:String
          },
          mobile:{
            type:String
          },
          homeAddress:{
            type:String
          },
          district:{
            type:String
          },
          place:{
            type:String
          },
          pincode:{
            type:Number
          },
          isDefault:{
            type:Boolean,
            default:false
          }
        }
    ]
});

module.exports= mongoose.model('Address',addressSchema);