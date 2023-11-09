const mongoose = require('mongoose')
const User = require('../models/userModel')
const Address = require('../models/addressModel')



const getDefaultAddress= async(userId)=>{
    try {
        
        const defaultAddressDetails= await Address.findOne({ user_id: userId, 'address.isDefault': true });
        console.log("defaultAddressDetails:",defaultAddressDetails);
        if(defaultAddressDetails){
            console.log("fffajfajfjafjf",defaultAddressDetails.address[0].name);
            const addressDetails={
                name:defaultAddressDetails.address[0].name,
                mobile:defaultAddressDetails.address[0].mobile,
                homeAddress:defaultAddressDetails.address[0].homeAddress,
                place:defaultAddressDetails.address[0].place,
                pincode:defaultAddressDetails.address[0].pincode

            }
            console.log("addressDetailsHelpp:",addressDetails);
            return addressDetails;
        }else{
            return "address not found"
        }
    } catch (error) {
        
    }
}






module.exports={
    getDefaultAddress
}