// Middleware kiểm tra quyền truy cập view
const checkViewPermission = (permission) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.redirect('/admin/auth/login');
      }

      // Kiểm tra quyền
      if (!user.permission || !user.permission.includes(permission)) {
        return res.status(403).render('admin/pages/error/403', {
          title: 'Không có quyền truy cập',
          message: 'Bạn không có quyền truy cập chức năng này'
        });
      }

      next();
    } catch (error) {
      console.error('View permission check error:', error);
      res.status(500).render('admin/pages/error/500', {
        title: 'Lỗi hệ thống',
        message: 'Có lỗi xảy ra khi kiểm tra quyền truy cập'
      });
    }
  };
};

// Middleware kiểm tra quyền sản phẩm cho view
module.exports.checkProductViewPermission = (action) => {
  const permissionMap = {
    'view': 'products_view',
    'create': 'products_create',
    'edit': 'products_edit',
    'delete': 'products_delete'
  };
  
  return checkViewPermission(permissionMap[action]);
};

// Middleware kiểm tra quyền danh mục sản phẩm cho view
module.exports.checkCategoryViewPermission = (action) => {
  const permissionMap = {
    'view': 'products-category_view',
    'create': 'products-category_create',
    'edit': 'products-category_edit',
    'delete': 'products-category_delete'
  };
  
  return checkViewPermission(permissionMap[action]);
};

// Middleware kiểm tra quyền bình luận cho view
module.exports.checkCommentViewPermission = (action) => {
  const permissionMap = {
    'moderate': 'comments_moderate',
    'delete': 'comments_delete',
    'remoderate': 'comments_remoderate'
  };
  
  return checkViewPermission(permissionMap[action]);
};

// Middleware kiểm tra quyền chat cho view
module.exports.checkChatViewPermission = checkViewPermission('chat_use');

// Middleware kiểm tra quyền bán hàng QR cho view
module.exports.checkSalesQRViewPermission = checkViewPermission('sales_qr_scan');

// Middleware kiểm tra quyền nhóm quyền cho view
module.exports.checkRoleViewPermission = (action) => {
  const permissionMap = {
    'view': 'roles_view',
    'create': 'roles_create',
    'edit': 'roles_edit',
    'delete': 'roles_delete',
    'permissions': 'roles_permissions'
  };
  
  return checkViewPermission(permissionMap[action]);
};

// Middleware kiểm tra quyền tài khoản cho view
module.exports.checkAccountViewPermission = (action) => {
  const permissionMap = {
    'view': 'accounts_view',
    'create': 'accounts_create',
    'edit': 'accounts_edit',
    'delete': 'accounts_delete'
  };
  
  return checkViewPermission(permissionMap[action]);
};

// Middleware kiểm tra quyền chung cho view
module.exports.checkViewPermission = checkViewPermission;
