const Comment = require("../../models/comment.model");
const Product = require("../../models/product.model");
const User = require("../../models/user.model");
const { moderateComment } = require("../../helper/aiModeration");



// [GET] /admin/comments/violations
module.exports.getViolationComments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      "aiModeration.isViolation": true,
      deleted: false
    })
    .populate('user_id', 'fullName email')
    .populate('product_id', 'title')
    .sort({ "aiModeration.moderatedAt": -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Comment.countDocuments({
      "aiModeration.isViolation": true,
      deleted: false
    });

    res.render("admin/pages/comments/violations", {
      pageTitle: "Danh sách comment vi phạm",
      comments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error("Error getting violation comments:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy danh sách comment vi phạm"
    });
  }
};



// [PUT] /admin/comments/:id/approve
module.exports.approveComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment không tồn tại"
      });
    }

    // Duyệt comment
    await Comment.findByIdAndUpdate(id, {
      status: "active"
    });

    res.json({
      success: true,
      message: "Duyệt comment thành công"
    });

  } catch (error) {
    console.error("Error approving comment:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi duyệt comment"
    });
  }
};

// [PUT] /admin/comments/:id/reject
module.exports.rejectComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment không tồn tại"
      });
    }

    // Từ chối comment
    await Comment.findByIdAndUpdate(id, {
      status: "inactive"
    });

    res.json({
      success: true,
      message: "Từ chối comment thành công"
    });

  } catch (error) {
    console.error("Error rejecting comment:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi từ chối comment"
    });
  }
};

// [DELETE] /admin/comments/:id/delete-permanent
module.exports.deletePermanent = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment không tồn tại"
      });
    }

    // Xóa vĩnh viễn comment và tất cả replies
    await Comment.deleteMany({
      $or: [{ _id: id }, { parent_id: id }]
    });

    res.json({
      success: true,
      message: "Xóa vĩnh viễn comment thành công"
    });

  } catch (error) {
    console.error("Error deleting comment permanently:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa vĩnh viễn comment"
    });
  }
};

// [POST] /admin/comments/:id/remoderate
module.exports.remoderateComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment không tồn tại"
      });
    }

    // Kiểm duyệt lại comment
    const moderationResult = await moderateComment(comment.content);

    // Cập nhật kết quả kiểm duyệt
    await Comment.findByIdAndUpdate(id, {
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

    res.json({
      success: true,
      message: "Kiểm duyệt lại comment thành công",
      moderationResult
    });

  } catch (error) {
    console.error("Error remoderating comment:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi kiểm duyệt lại comment"
    });
  }
}; 