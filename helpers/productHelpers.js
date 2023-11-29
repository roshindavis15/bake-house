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

        try {
            const existingCategory=await Category.findOne({Name:name});
            if(existingCategory){
                resolve({categoryExist:true});
            }else{
                const newCategory= new Category({
                    Name:name,
                    Description:description,
                    Discount:discount,
                    IsActive:isActive
        
                });

                const savedCategory = await newCategory.save();
                resolve({ categoryAlreadyExist: false, savedCategory });
            }
        } catch (error) {
            console.error(error);
            reject(error.message)
        }

    })
}


const getFilteredProducts=async(categoryId)=>{
    try {
        let filteredProducts= await Product.find({category:categoryId});
        if(filteredProducts){
            return filteredProducts
        }
    } catch (error) {
        console.error(error);
    }
}



module.exports={
    addProduct,
    addCategory,
    getFilteredProducts
};

        
        


        
            

            