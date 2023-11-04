
const mongoose = require('mongoose')
const User = require('../models/userModel')
const Address = require('../models/addressModel')
const Product = require('../models/productsModel');
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const config = require('../config/config')



async function addToCart(userId, productId) {
    try {
        let cart = await Cart.findOne({ user_id: userId });

        if (!cart) {
            cart = new Cart({ user_id: userId, products: [] });
        }

        const existingProductIndex = cart.products.findIndex(product => product.productId.toString() === productId);

        let product; 

        if (existingProductIndex === -1) {
            product = await Product.findById(productId); 

            if (product.stock > 0) {
                cart.products.push({
                    productId: productId,
                    quantity: 1,
                    total: product.price,
                });
                product.stock -= 1; // Decrease the stock of the product
                await product.save();
            } else {
                return { stock: product.stock, addToCart: false };
            }
        } else {
            product = await Product.findById(productId); 

            if (product.stock <= 0) {
                return { stock: product.stock, addToCart: false };
            }
            cart.products[existingProductIndex].quantity += 1;
            cart.products[existingProductIndex].total += product.price;
            product.stock -= 1;
            await product.save();
        }

        // Calculate the cart's total
        cart.total = cart.products.reduce((total, product) => total + product.total, 0);

        await cart.save();

        return { stock: product.stock, addToCart: true };
    } catch (error) {
        throw error;
    }
}


async function loadCart(userId) {
    try {
        const userCart = await Cart.findOne({ user_id: userId }).populate({
            path: 'products.productId',
            populate: { path: 'category', select: 'Discount' }
        });

        if (!userCart) {
            return { message: "Your Cart Is Empty" };
        }

        const products = userCart.products.map((product) => {
            const total = Number(product.quantity) * Number(product.productId.price);
            const categoryOfferPercentage = product.productId.category.Discount;
            const productOfferPercentage = product.productId.productOffer;
            const categoryDiscountAmount = (total * categoryOfferPercentage) / 100;
            const productDiscountAmount = (total * productOfferPercentage) / 100;
            const finalAmount = total - productDiscountAmount - categoryDiscountAmount;
                  product.subtotal=finalAmount;

            return {
                _id: product.productId._id.toString(),
                name: product.productId.name,
                categoryOffer: product.productId.category.Discount,
                image: product.productId.image,
                price: product.productId.price,
                description: product.productId.description,
                finalAmnt: finalAmount,
                discountAmount: categoryDiscountAmount + productDiscountAmount,
                productOffer: product.productId.productOffer,
                quantity: product.quantity,
                total: total,
                user_id: userId,
                totalDiscountPercentage: productOfferPercentage + categoryOfferPercentage
            };
        });

        let total = products.reduce((sum, product) => sum + Number(product.total), 0);

        let totalProductDiscountAmount = 0;
        userCart.products.forEach((item) => {
            let quantity = item.quantity;
            let price = item.productId.price;
            let productOffer = item.productId.productOffer;
            let discountAmount = (quantity * price * productOffer) / 100;
            totalProductDiscountAmount += discountAmount;
        });

        let totalCategoryDiscountAmount = 0;
        userCart.products.forEach((item) => {
            let actualProductAmount = item.productId.price * item.quantity;
            let categoryOffer = item.productId.category.Discount;
            let categoryDiscountAmount = (actualProductAmount * categoryOffer) / 100;
            totalCategoryDiscountAmount += categoryDiscountAmount;
        });

        let totalAmount = total - totalProductDiscountAmount - totalCategoryDiscountAmount;
        userCart.cartTotal = totalAmount;
        await userCart.save();

        let totalCount = products.length;

        return {
            products,
            total,
            totalCount,
            subTotal: total,
            totalAmount,
        };
    } catch (error) {
        throw error;
    }
}

async function updateQuantity(userId, productId, newQuantity) {
    try {
        const cartFind = await Cart.findOne({ user_id: userId }).populate({
            path: 'products.productId',
            populate: {
                path: 'category'
            }
        });

        const cartItem = cartFind.products.find((product) => product.productId._id.toString() === productId);

        let product = await Product.findById(productId);

        if (newQuantity > product.stock) {
            const response = { outOfStock: true, updatedProductStock: product.stock };
            return response;
        }

        const stockDifference = newQuantity - cartItem.quantity;

        cartItem.quantity = newQuantity;

        if (stockDifference > 0) {
            product.stock -= stockDifference;
        } else if (stockDifference < 0) {
            product.stock += stockDifference;
        }

        await product.save();
        await cartFind.save();

        const updatedProduct = cartFind.products.find(product => product.productId._id.toString() === productId);
        console.log("updatedProduct:",updatedProduct);
        let updatedProductId = updatedProduct.productId;
        const updatedProductPrice = await Product.findOne({ _id: updatedProductId }).select('price');
        const productPrice = updatedProductPrice.price;

        updatedProduct.total = productPrice * updatedProduct.quantity;

        // Calculate the new subtotal
        const categoryOfferPercentage = updatedProduct.productId.category.Discount;
        const productOfferPercentage = updatedProduct.productId.productOffer;
        const categoryDiscountAmount = (updatedProduct.total * categoryOfferPercentage) / 100;
        const productDiscountAmount = (updatedProduct.total * productOfferPercentage) / 100;
        const finalAmount = updatedProduct.total - productDiscountAmount - categoryDiscountAmount;
        console.log("sub:",finalAmount);
        updatedProduct.subtotal = finalAmount;

        //calculate the new cart total

        console.log(cartFind);
        newCartTotal= cartFind.products.reduce((total,product)=>total+product.subtotal,0);
        cartFind.cartTotal=newCartTotal;
        await cartFind.save();

        if (updatedProduct.quantity <= 0) {
            cartFind.products = cartFind.products.filter(product => !product.productId._id.equals(productId));
            console.log(updatedProduct.subtotal);
            await cartFind.save();
            const response = { deleteProduct: true };
            return response;
        }

        let cartTotalAmount = 0;
        cartFind.products.forEach(product => {
            const price = product.productId.price;
            const categoryOffer = product.productId.category.Discount;
            const productOffer = product.productId.productOffer;
            const reducedPrice = price - (price * (categoryOffer / 100)) - (price * (productOffer / 100));
            cartTotalAmount += (reducedPrice * product.quantity);
        });

        let totalProductDiscountAmount = 0;
        cartFind.products.forEach(item => {
            const quantity = item.quantity;
            const findCartItemPrice = cartFind.products.find(product => product.productId._id.toString() === productId);
            const productPrice = findCartItemPrice.productId.price;
            const productOffer = findCartItemPrice.productId.productOffer;
            const discountAmount = (quantity * productPrice * productOffer) / 100;
            totalProductDiscountAmount = discountAmount;
        });

        let totalCategoryDiscountAmount = 0;
        cartFind.products.forEach(item => {
            const quantity = item.quantity;
            const findCartItemPrice = cartFind.products.find(product => product.productId._id.toString() === productId);
            const productPrice = findCartItemPrice.productId.price;
            const categoryOffer = findCartItemPrice.productId.category.Discount;
            const categoryDiscountAmount = (quantity * productPrice * categoryOffer) / 100;
            totalCategoryDiscountAmount = categoryDiscountAmount;
        });

        const eachProdutSubtotal = cartFind.products.map(product => product.total);
        const grandSubtotal = eachProdutSubtotal.reduce((acc, currentTotal) => acc + currentTotal);
        const totalAmount = updatedProduct.total - totalProductDiscountAmount - totalCategoryDiscountAmount;
        const grandTotal = cartFind.products.reduce((sum, product) => sum + Number(product.total), 0);

        return {
            quantity: updatedProduct.quantity,
            totalAmount: totalAmount,
            grandTotal: grandTotal,
            grandSubTotal: grandSubtotal,
            cartTotalAmount: cartTotalAmount,
        };
    } catch (error) {
        throw error;
    }
}


async function removeProductFromCart(userId, productId) {
    try {
       const cart=await Cart.findOne({user_id:userId});
       const productToRemove=cart.products.find(product=>product.productId.toString()===productId);
       console.log("productToRemove:",productToRemove);
       const removedSubtotal=productToRemove.subtotal;
        console.log("removedSubtotal:",removedSubtotal);
       //remove the product from the cart
       cart.products=cart.products.filter(product=>product.productId.toString() !== productId)

       cart.cartTotal-= removedSubtotal;
       await cart.save();

       return { productRemovingFromCart: true };
    } catch (error) {
        throw error;
    }
}


module.exports = {
    addToCart,
    loadCart,
    updateQuantity,
    removeProductFromCart
}
