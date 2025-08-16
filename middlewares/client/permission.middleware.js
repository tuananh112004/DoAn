// Middleware kiểm tra quyền truy cập
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Chưa đăng nhập"
        });
      }

      // Kiểm tra quyền
      if (!user.permission || !user.permission.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập chức năng này"
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: "Lỗi kiểm tra quyền truy cập"
      });
    }
  };
};

// Middleware kiểm tra quyền sản phẩm
module.exports.checkProductPermission = (action) => {
  const permissionMap = {
    'view': 'products_view',
    'create': 'products_create',
    'edit': 'products_edit',
    'delete': 'products_delete'
  };
  
  return checkPermission(permissionMap[action]);
};

// Middleware kiểm tra quyền danh mục sản phẩm
module.exports.checkCategoryPermission = (action) => {
  const permissionMap = {
    'view': 'products-category_view',
    'create': 'products-category_create',
    'edit': 'products-category_edit',
    'delete': 'products-category_delete'
  };
  
  return checkPermission(permissionMap[action]);
};

// Middleware kiểm tra quyền bình luận
module.exports.checkCommentPermission = (action) => {
  const permissionMap = {
    'moderate': 'comments_moderate',
    'delete': 'comments_delete',
    'remoderate': 'comments_remoderate'
  };
  
  return checkPermission(permissionMap[action]);
};

// Middleware kiểm tra quyền chat
module.exports.checkChatPermission = checkPermission('chat_use');

// Middleware kiểm tra quyền bán hàng QR
module.exports.checkSalesQRPermission = checkPermission('sales_qr_scan');

// Middleware kiểm tra quyền nhóm quyền
module.exports.checkRolePermission = (action) => {
  const permissionMap = {
    'view': 'roles_view',
    'create': 'roles_create',
    'edit': 'roles_edit',
    'delete': 'roles_delete',
    'permissions': 'roles_permissions'
  };
  
  return checkPermission(permissionMap[action]);
};

// Middleware kiểm tra quyền tài khoản
module.exports.checkAccountPermission = (action) => {
  const permissionMap = {
    'view': 'accounts_view',
    'create': 'accounts_create',
    'edit': 'accounts_edit',
    'delete': 'accounts_delete'
  };
  
  return checkPermission(permissionMap[action]);
};

// Middleware kiểm tra quyền chung
module.exports.checkPermission = checkPermission;
