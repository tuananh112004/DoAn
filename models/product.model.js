// const mongoose = require("mongoose");
// const slug = require("mongoose-slug-updater");
// mongoose.plugin(slug);
// const productSchema = new mongoose.Schema({
//     title: String,
//     product_category_id:{
//         type: String,
//         default:""
//     },
//     description: String,
//     price: Number,
//     discountPercentage: Number,
//     stock: Number,
//     thumbnail: String,
//     status: String,
//     position: Number,
//     featured: String,
//     slug:{
//         type: String,
//         slug: "title",
//         unique: true
//     },
//     deleted: {
//         type: Boolean,
//         default: false
//     },
//     createdBy: {
//         account_id: String,
//         createdAt: {
//             type: Date,
//             default: Date.now
//         }
//     },
//     updatedBy: [
//         {
//             account_id: String,
//             updatedAt: Date
//         }
//     ],
//     deletedBy:{
//         account_id: String,
//         deletedAt: Date
//     }, 
//     });

// const Product = mongoose.model("Product",productSchema,"products");

// module.exports = Product;
const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);
const productSchema = new mongoose.Schema({
    title: String,
    barcode: String,
    product_category_id:{
        type: String,
        default:""
    },
    description: String,
    price: Number,
    discountPercentage: Number,
    stock: Number,
    thumbnail: String,
    status: String,
    position: Number,
    featured: String,
    slug:{
        type: String,
        slug: "title",
        unique: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    // Optional embeddings vector for semantic search (array of floats)
    embedding: {
        type: [Number],
        default: []
    },
    createdBy: {
        account_id: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    updatedBy: [
        {
            account_id: String,
            updatedAt: Date
        }
    ],
    deletedBy:{
        account_id: String,
        deletedAt: Date
    }, 
    });

const Product = mongoose.model("Product",productSchema,"products");

module.exports = Product;