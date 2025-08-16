const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const productsHelper = require("../../helper/product");

//[POST] /add/:productId
module.exports.addPost = async (req,res)=>{
    const cartId = req.cookies.cartId;
    const productId = req.params.productId;
    const quantity = parseInt(req.body.quantity);

    const cart = await Cart.findOne({
        _id: cartId
    })
    const exitProductInCart = cart.products.find(item => item.product_id == productId);
    if(exitProductInCart){
        const newQuantity = quantity + exitProductInCart.quantity;
        await Cart.updateOne(
            {
              _id: cartId,
              'products.product_id': productId
            },
            {
              'products.$.quantity': newQuantity
            }
          );
    } else {
        const objectCart = {
          product_id: productId,
          quantity: quantity
        };
    
        await Cart.updateOne(
          {
            _id: cartId
          },
          {
            $push: { products: objectCart }
          }
        );
      }
    req.flash("success", "Thêm sản phẩm vào giỏ hàng thành công!");    
    res.redirect("back");
}

//[GET] /cart
module.exports.cart = async (req,res)=>{
  const cart = await Cart.findOne({
    _id: req.cookies.cartId
  });
  if(cart.products.length > 0 ){
    // Normalize duplicates by product_id to avoid quantity doubling between pages
    const mergedById = new Map();
    for (const p of cart.products) {
      const prev = mergedById.get(p.product_id) || 0;
      mergedById.set(p.product_id, prev + (Number(p.quantity) || 0));
    }
    cart.products = Array.from(mergedById.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));
    await Cart.updateOne({ _id: cart._id }, { products: cart.products });

    for(const item of cart.products){
      const productInfo = await Product.findOne({
        _id: item.product_id

      });
      productInfo.priceNew = productsHelper.priceNewProduct(productInfo);
      item.productInfo = productInfo;
      item.totalPrice = item.quantity * productInfo.priceNew;
    }
    

  }

  cart.totalPrice = cart.products.reduce((sum,item)=>sum+item.totalPrice,0);
  res.render("client/pages/cart/index",{
    pageTitle: "Giỏ hàng",
    cartDetail: cart
  })

}

//[GET] /cart/delete/:productId
module.exports.delete = async (req,res)=>{
  const cartId = req.cookies.cartId;
  const productId = req.params.productId;
  await Cart.updateOne({
    _id: cartId
  },
  {
    "$pull":{products: { "product_id": productId}}
  });

  req.flash("success", "Đã xóa sản phẩm khỏi giỏ hàng!");
  res.redirect("back");
}

//[GET] /cart/update/:productId/:quantity
module.exports.update = async (req,res)=>{
    const cartId = req.cookies.cartId;
    const productId = req.params.productId;
    const quantity = parseInt(req.params.quantity);

    await Cart.updateOne(
      {
        _id: cartId,
        'products.product_id': productId
      },
      {
        'products.$.quantity': quantity
      }
    );
    req.flash("success","Cập nhật số lượng thành công");
    res.redirect("back");
}