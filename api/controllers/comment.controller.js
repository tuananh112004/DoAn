const Comment = require("../../models/comment.model");
const Product = require("../../models/product.model");
const User = require("../../models/user.model");
const { commentLimiter } = require("../../middlewares/rateLimiter");

// Hàm kiểm tra comment có vi phạm hay không
function checkCommentViolation(content) {
  // Danh sách từ khóa cấm
  const bannedWords = [
    // 🔞 Chửi tục tiếng Việt (có dấu)
    'địt', 'đụ', 'lồn', 'cặc', 'đéo', 'đcm', 'vãi l*n', 'vãi lồn', 'vcl', 'loz', 'clgt',
    'má mày', 'mẹ mày', 'đồ ngu', 'óc chó', 'não chó', 'ngu vãi', 'ngu như bò', 'ngu như lợn',
  
    // 🔞 Chửi tục tiếng Việt (không dấu/lách luật)
    'dit', 'du', 'lon', 'cac', 'deo', 'dcm', 'vl', 'loz', 'oc cho', 'oc lon', 'oc heo', 'dm', 'cl',
  
    // 🔞 Chửi tục tiếng Anh
    'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard', 'slut', 'faggot', 'moron',
  
    // 🚫 Spam, lừa đảo, gian lận
    'spam', 'scam', 'lừa đảo', 'lừa gạt', 'gian thương', 'bịp bợm', 'treo đầu dê', 'bán thịt chó', 'hàng fake', 'hàng giả', 'đạo nhái',
  
    // 👎 Chê bai sản phẩm nặng
    'rác', 'rác rưởi', 'đồ bỏ đi', 'phế phẩm', 'đồ đểu', 'hàng lởm', 'tệ', 'quá tệ', 'cực kỳ tệ', 
    'kém chất lượng', 'không ra gì', 'không xứng đáng', 'rẻ tiền', 'không đáng tiền', 'phí tiền',
    'dở ẹc', 'chán', 'vớ vẩn', 'xấu vãi', 'xấu vãi l', 'xấu như chó', 'xấu như cc', 'xấu kinh tởm',
    'buồn nôn', 'thảm họa', 'thiết kế như đùa', 'đỉnh cao của tệ hại', 'sản phẩm của trò đùa',
    'mua 1 lần chừa cả đời', 'tiền mất tật mang', 'như cức', 'như cứt', 'như cc', 'như loz', 'như l',
    'hãm l', 'hãm vãi', 'thất vọng', 'cực kỳ thất vọng', 'khác mô tả', 'khác xa thực tế',
  
    // 🤡 Mỉa mai, châm biếm
    'siêu phẩm phế phẩm', 'best vãi', 'đỉnh thật sự', 'đỉnh của chóp (mỉa mai)', 'đỉnh cao thất bại', 
    'trò hề', 'cạn lời', 'ai mua là dại', 'đúng là trò hề', 'bán cho ai vậy trời', 'nhìn phát ói'
  ];
  
  const lowerContent = content.toLowerCase();
  let hasViolation = false;
  let violationType = null;
  
  // Kiểm tra từ khóa cấm
  for (const word of bannedWords) {
    if (lowerContent.includes(word)) {
      hasViolation = true;
      violationType = 'inappropriate_language';
      break;
    }
  }
  
  // Kiểm tra spam patterns
  if (lowerContent.length > 500 || lowerContent.split(' ').length > 100) {
    hasViolation = true;
    violationType = 'spam';
  }
  
  // Kiểm tra lặp lại ký tự
  if (/(.)\1{5,}/.test(content)) {
    hasViolation = true;
    violationType = 'spam';
  }
  
  // Kiểm tra URL spam
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlPattern);
  if (urls && urls.length > 3) {
    hasViolation = true;
    violationType = 'spam';
  }
  
  return {
    isViolation: hasViolation,
    violationType,
    flagged: hasViolation,
    categories: {},
    scores: {},
    source: 'manual_check'
  };
}

// [POST] /api/comments/create
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

    // Kiểm tra comment có vi phạm hay không
    const violationCheck = checkCommentViolation(content);
    
    // Tạo comment mới với kết quả kiểm tra vi phạm
    const newComment = new Comment({
      content,
      product_id,
      user_id,
      rating: rating || 5,
      parent_id: parent_id || null,
      status: violationCheck.isViolation ? "inactive" : "active",
      aiModeration: {
        isChecked: true,
        isViolation: violationCheck.isViolation,
        violationType: violationCheck.violationType,
        flagged: violationCheck.flagged,
        categories: violationCheck.categories,
        scores: violationCheck.scores,
        moderatedAt: new Date(),
        source: violationCheck.source
      }
    });

    await newComment.save();

    // Populate thông tin user
    const commentWithUser = await Comment.findById(newComment._id)
      .populate('user_id', 'fullName');

    // Kiểm tra nếu comment bị từ chối
    if (violationCheck.isViolation) {
      res.status(201).json({
        success: true,
        message: "Bình luận đã được tạo nhưng đang chờ kiểm duyệt do phát hiện nội dung không phù hợp",
        comment: commentWithUser,
        isModerated: true,
        violationType: violationCheck.violationType,
        moderationSource: violationCheck.source
      });
    } else {
      res.status(201).json({
        success: true,
        message: "Bình luận đã được tạo thành công",
        comment: commentWithUser,
        moderationSource: violationCheck.source
      });
    }

  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tạo bình luận",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// [GET] /api/comments/product/:product_id
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

// [PUT] /api/comments/:id
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

// [DELETE] /api/comments/:id
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

// [GET] /api/comments/replies/:parent_id
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

// Các hàm AI moderation đã được loại bỏ:
// - getStats
// - resetStats  
// - cleanupCache
