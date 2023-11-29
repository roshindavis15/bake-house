const mongoose = require('mongoose')


const ordersSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"user"
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
      },
      image:{
        type:Array
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
  
  cancelledOrder:{
    type:Boolean,
    default:false
  },
  deliveryStatus:{
    type:String,
    default:'Pending'
  },
  totalToPay:{
    type:Number,
    default:0
  },
  cancelRequest: {
    requestedBy: {
      type: String,
      default: 'user'
    },
    reason: {
      type: String,
    },
    requestedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: 'Not requested',
    },
  },
});


module.exports = mongoose.model('Order',ordersSchema )