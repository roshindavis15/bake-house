const Admin= require("../models/adminModel");
const Product= require("../models/productsModel");
const bcrypt= require('bcrypt');
const randomstring= require('randomstring');
const config= require("../config/config")
const nodemailer= require("nodemailer");
const Category = require('../models/categoryModel'); 


