const Admin= require("../models/adminModel");
const Product= require("../models/productsModel");
const bcrypt= require('bcrypt');
const randomstring= require('randomstring');
const config= require("../config/config")
const nodemailer= require("nodemailer");
const Category = require('../models/categoryModel'); 

const   addProduct= (productDatas,imagePaths)=>{
    return new Promise(async(resolve,reject)=>{
        

        const{name,price,description,category,offer,stock}=productDatas;
        
        const existingProduct= await Product.findOne({name:name});

        if(existingProduct){
            reject("This Product is Already Exists")
        } else{

        const products= new Product({
            name:name,
            price:price,
            description:description,
            category:category,
            productOffer:offer,
            stock:stock,
            unlist:false,
            image:[...imagePaths],
            
             });
             try {
                const productData = await products.save();
                
                
                    resolve(productData);
                
            } catch (error) {
                console.error(error);
                reject(error.message);
            }
        }
        });
    }

const addCategory=(categoryDatas)=>{
    return new Promise(async(resolve,reject)=>{
        const{name,description,discount,isActive}= categoryDatas;

        const categories= new Category({
            Name:name,
            Description:description,
            Discount:discount,
            IsActive:isActive

        });
        try {
            const categoryData= await categories.save();
            
            resolve(categoryData);
        } catch (error) {
            console.error(error);
            reject(error.message);
        }
    })
}
module.exports={
    addProduct,
    addCategory
};

        
        


        
            

            