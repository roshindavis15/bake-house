const mongoose = require('mongoose')


const ordersSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  date:{
    type:Date,
    require:true
  },
  
  paymentMethod:{
    type:String,
    require:true
  },
  couponCode:{
    type:String,
   
  },
  couponDiscount:{
    type:Number,
    default:0
  },
  offerDiscount:{
    type:Number,
    default:0
  },
  orderStatus:{
    type:String,
    require:true
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Product"
      },
      productName:{
        type:String,
        required:true,
      },
      productPrice:{
        type:Number,
        required:true
      },
      productDescription:{
        type:String,
        required:true
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      },
      total:{
        type:Number,
        default:0
      }
    }
  ],
  addressDetails: {
    
      name: {
        type:String,
        require:true
      
      },
      mobile:{
        type:String,
        require:true
      },
      homeAddress:{
        type:String,
        require:true
      },
      place:{
        type:String,
        require:true
      },
      pincode:{
        type:String,
        require:true
      },
     


},
  
  cancellationStatus:{
    type:String,
    default:"Not requested"
    
  },
  cancelledOrder:{
    type:Boolean,
    default:false
  },
  deliveryStatus:{
    type:String,
    default:'Pending'
  }

})

module.exports = mongoose.model('Order',ordersSchema )