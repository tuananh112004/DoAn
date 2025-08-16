const Comment = require("../../models/comment.model");
const Product = require("../../models/product.model");
const User = require("../../models/user.model");
const { moderateComment } = require("../../helper/aiModeration");

// [POST] /comments/create
module.exports.create = async (req, res) => {
  console.log("Body nhận được:", req.body);
  try {
    const { content, product_id, rating, parent_id } = req.body;
    console.log("User ID:", req.body);
    const user_id = req.user._id; // Lấy từ middleware auth

    console.log("Product ID received:", product_id); // Debug log
    
    // Kiểm tra tất cả sản phẩm có ID này (không phân biệt status)
    const allProducts = await Product.find({ _id: product_id });
    console.log("All products with this ID:", allProducts.length);
    allProducts.forEach(p => {
      console.log("Product:", p.title, "Status:", p.status, "Deleted:", p.deleted);
    });
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findOne({
      _id: product_id,
      deleted: false,
      status: "active"
    });

    console.log("Product found:", product ? product.title : "Not found"); // Debug log

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại"
      });
    }

    // Kiểm duyệt comment bằng AI
    const moderationResult = await moderateComment(content);
    
    // Tạo comment mới với kết quả kiểm duyệt
    const newComment = new Comment({
      content,
      product_id,
      user_id,
      rating: rating || 5,
      parent_id: parent_id || null,
      status: moderationResult.isViolation ? "inactive" : "active",
      aiModeration: {
        isChecked: true,
        isViolation: moderationResult.isViolation,
        violationType: moderationResult.violationType,
        flagged: moderationResult.flagged,
        categories: moderationResult.categories,
        scores: moderationResult.scores,
        moderatedAt: new Date()
      }
    });

    await newComment.save();

    // Populate thông tin user
    const commentWithUser = await Comment.findById(newComment._id)
      .populate('user_id', 'fullName');

    // Kiểm tra nếu comment bị từ chối
    if (moderationResult.isViolation) {
      res.status(201).json({
        success: true,
        message: "Bình luận đã được tạo nhưng đang chờ kiểm duyệt do phát hiện nội dung không phù hợp",
        comment: commentWithUser,
        isModerated: true,
        violationType: moderationResult.violationType
      });
    } else {
      res.status(201).json({
        success: true,
        message: "Bình luận đã được tạo thành công",
        comment: commentWithUser
      });
    }

  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tạo bình luận"
    });
  }
};

// [GET] /comments/product/:product_id
module.exports.getByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    // Lấy comments của sản phẩm (chỉ comment cha, không lấy reply)
    const comments = await Comment.find({
      product_id,
      parent_id: null,
      deleted: false,
      status: "active"
    })
    .populate('user_id', 'fullName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Lấy replies cho mỗi comment
    for (let comment of comments) {
      const replies = await Comment.find({
        parent_id: comment._id,
        deleted: false,
        status: "active"
      })
      .populate('user_id', 'fullName')
      .sort({ createdAt: 1 });
      
      comment.replies = replies;
    }

    // Đếm tổng số comments
    const total = await Comment.countDocuments({
      product_id,
      parent_id: null,
      deleted: false,
      status: "active"
    });

    res.json({
      success: true,
      comments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error("Error getting comments:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy danh sách bình luận"
    });
  }
};

// [PUT] /comments/:id
module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, rating } = req.body;
    const user_id = req.user._id;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Bình luận không tồn tại"
      });
    }

    // Kiểm tra quyền sửa (chỉ người viết comment mới được sửa)
    if (comment.user_id.toString() !== user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền sửa bình luận này"
      });
    }

    // Cập nhật comment
    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      {
        content,
        rating: rating || comment.rating
      },
      { new: true }
    ).populate('user_id', 'fullName');

    res.json({
      success: true,
      message: "Cập nhật bình luận thành công",
      comment: updatedComment
    });

  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi cập nhật bình luận"
    });
  }
};

// [DELETE] /comments/:id
module.exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user._id;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Bình luận không tồn tại"
      });
    }

    // Kiểm tra quyền xóa (chỉ người viết comment mới được xóa)
    if (comment.user_id.toString() !== user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa bình luận này"
      });
    }

    // Xóa mềm comment và tất cả replies
    await Comment.updateMany(
      { $or: [{ _id: id }, { parent_id: id }] },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: {
          user_id,
          deletedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: "Xóa bình luận thành công"
    });

  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa bình luận"
    });
  }
};

// [GET] /comments/replies/:parent_id
module.exports.getReplies = async (req, res) => {
  try {
    const { parent_id } = req.params;

    const replies = await Comment.find({
      parent_id,
      deleted: false,
      status: "active"
    })
    .populate('user_id', 'fullName')
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      replies
    });

  } catch (error) {
    console.error("Error getting replies:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy danh sách phản hồi"
    });
  }
}; 