# React Components Structure - SaleWeb

This document describes the React components created to replace the client-side views from the `manage_product` project.

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.js          # Navigation header with search and user menu
│   │   └── Footer.js          # Footer with links and contact info
│   ├── pages/
│   │   ├── home/
│   │   │   └── HomePage.js    # Home page with featured and new products
│   │   ├── products/
│   │   │   ├── ProductsPage.js      # Products listing with filters
│   │   │   └── ProductDetailPage.js # Individual product detail page
│   │   ├── cart/
│   │   │   └── CartPage.js    # Shopping cart management
│   │   ├── user/
│   │   │   ├── LoginPage.js   # User login form
│   │   │   └── RegisterPage.js # User registration form
│   │   └── search/
│   │       └── SearchPage.js  # Product search functionality
│   └── shared/
│       └── ProductItem.js     # Reusable product card component
├── configs/
│   ├── Apis.js               # API endpoints configuration
│   └── Contexts.js           # React context definitions
└── App.js                    # Main app with routing
```

## Component Mapping

### Original Pug Views → React Components

| Original Pug View | React Component | Description |
|------------------|-----------------|-------------|
| `views/client/pages/home/index.pug` | `HomePage.js` | Home page with featured and new products |
| `views/client/pages/products/index.pug` | `ProductsPage.js` | Products listing with category filters |
| `views/client/pages/products/detail.pug` | `ProductDetailPage.js` | Individual product detail view |
| `views/client/pages/cart/index.pug` | `CartPage.js` | Shopping cart management |
| `views/client/pages/user/login.pug` | `LoginPage.js` | User authentication |
| `views/client/pages/user/register.pug` | `RegisterPage.js` | User registration |
| `views/client/pages/search/index.pug` | `SearchPage.js` | Product search functionality |

### Shared Components

| Original Pug Mixin | React Component | Description |
|-------------------|-----------------|-------------|
| `views/client/mixins/product-item.pug` | `ProductItem.js` | Reusable product card |

## Key Features Implemented

### 1. HomePage Component
- **API Integration**: Fetches featured and new products from `/api/home`
- **Responsive Grid**: Displays products in responsive grid layout
- **Loading States**: Shows spinner during data fetching
- **Error Handling**: Displays error messages for failed requests

### 2. ProductsPage Component
- **Category Filtering**: Filter products by category
- **Pagination**: Navigate through product pages
- **URL State**: Maintains filter and page state in URL
- **Responsive Design**: Adapts to different screen sizes

### 3. ProductDetailPage Component
- **Image Gallery**: Multiple product images with thumbnail navigation
- **Quantity Selection**: Add products to cart with quantity
- **Price Display**: Shows original and discounted prices
- **Product Information**: Detailed product specs and description

### 4. CartPage Component
- **Cart Management**: Add, update, remove items
- **Quantity Controls**: Increment/decrement item quantities
- **Price Calculation**: Real-time total calculation
- **Checkout Integration**: Proceed to checkout flow

### 5. LoginPage Component
- **Form Validation**: Client-side validation with error messages
- **API Integration**: Authenticates with `/api/user/login`
- **Token Management**: Stores authentication token in cookies
- **User Context**: Updates global user state

### 6. RegisterPage Component
- **Comprehensive Validation**: Email, password, phone validation
- **API Integration**: Registers user via `/api/user/register`
- **Success Handling**: Shows success message and redirects
- **Error Display**: Shows server validation errors

### 7. SearchPage Component
- **Search Functionality**: Search products by keyword
- **URL Parameters**: Maintains search query in URL
- **Pagination**: Navigate through search results
- **No Results Handling**: Shows appropriate message for empty results

### 8. Header Component
- **Navigation**: Links to all major pages
- **Search Bar**: Global search functionality
- **User Menu**: Login/logout and user profile dropdown
- **Cart Badge**: Shows cart item count

## API Integration

All components use the centralized API configuration in `src/configs/Apis.js`:

```javascript
const BASE_URL = 'http://localhost:3000/api/';

export const endpoints = {
    'home': '/home',
    'products': '/products',
    'product-detail': '/products',
    'search': '/search',
    'login': '/user/login',
    'register': '/user/register',
    // ... more endpoints
}
```

## State Management

### Context Usage
- **MyUserContext**: Manages user authentication state
- **MyCartContext**: Manages shopping cart state

### Local State
- **Loading States**: For API request feedback
- **Form Data**: For form inputs and validation
- **Error States**: For error message display

## Responsive Design

All components use Bootstrap 5 classes for responsive design:
- **Grid System**: `Row`, `Col` components with responsive breakpoints
- **Responsive Images**: `Image` component with `fluid` prop
- **Mobile Navigation**: Collapsible navbar for mobile devices

## Error Handling

### API Errors
- **Try-Catch Blocks**: Wrapped around all API calls
- **User-Friendly Messages**: Translated error messages
- **Loading States**: Prevents multiple requests

### Form Validation
- **Client-Side Validation**: Real-time validation feedback
- **Server Validation**: Displays server-side validation errors
- **Error Clearing**: Clears errors when user starts typing

## Performance Optimizations

### Code Splitting
- **Route-Based Splitting**: Each page component is loaded separately
- **Lazy Loading**: Components load only when needed

### State Optimization
- **Context Usage**: Avoids prop drilling
- **Local State**: Minimizes unnecessary re-renders
- **Memoization**: React.memo for expensive components

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: Responsive design for mobile devices
- **JavaScript ES6+**: Uses modern JavaScript features

## Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## API Requirements

The React components expect the following API endpoints to be available:

- `GET /api/home` - Home page data
- `GET /api/products` - Products listing
- `GET /api/products/:slug` - Product detail
- `GET /api/search` - Product search
- `POST /api/user/login` - User login
- `POST /api/user/register` - User registration
- `GET /api/cart` - Cart data
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update` - Update cart
- `DELETE /api/cart/delete` - Remove from cart

## Future Enhancements

1. **Additional Pages**: Checkout, user profile, order history
2. **Real-time Features**: Chat, notifications
3. **Advanced Search**: Filters, sorting options
4. **Wishlist**: Save favorite products
5. **Reviews**: Product reviews and ratings
6. **Payment Integration**: Payment gateway integration

## Notes

- All components are designed to work with the API endpoints created in the `manage_product` project
- The components follow React best practices and modern JavaScript conventions
- Bootstrap 5 is used for styling and responsive design
- React Router is used for client-side routing
- Axios is used for HTTP requests
- React Cookies is used for token management
