# Comment System for React.js

## Overview
This comment system provides a complete commenting functionality for products, similar to the Pug template implementation but built with React.js and Bootstrap. **The system includes automatic comment violation checking to ensure content quality.**

## Features

### ✅ Core Functionality
- **Create Comments**: Users can create comments with ratings (1-5 stars)
- **Reply to Comments**: Users can reply to existing comments
- **Edit Comments**: Comment owners can edit their own comments
- **Delete Comments**: Comment owners and admins can delete comments
- **Pagination**: Comments are paginated for better performance
- **Real-time Updates**: Comments update immediately after actions

### ✅ Content Moderation
- **Automatic Violation Detection**: Checks for inappropriate language, spam, and violations
- **Keyword Filtering**: Filters banned words in Vietnamese and English
- **Spam Detection**: Identifies spam patterns, excessive URLs, and repetitive characters
- **Moderation Status**: Shows clear status for each comment (approved/pending review)
- **Violation Types**: Categorizes violations (inappropriate_language, spam)
- **Manual Review Queue**: Flagged comments are marked for admin review

### ✅ User Experience
- **Authentication Required**: Only logged-in users can comment
- **User Avatars**: Display user profile pictures
- **Rating System**: Visual star ratings for products
- **Responsive Design**: Works on all device sizes
- **Loading States**: Shows loading indicators during operations
- **Success/Error Messages**: Clear feedback for user actions
- **Moderation Feedback**: Users see immediate feedback on comment status

### ✅ Admin Features
- **Moderation**: Admins can see all comments and manage them
- **Status Management**: Comments can be marked as active/inactive
- **User Management**: Admins have full control over all comments
- **Violation Review**: Review and approve/reject flagged comments

## Components Structure

```
CommentSection/
├── CommentForm (for new comments with moderation feedback)
├── CommentItem (individual comment display with moderation status)
│   ├── CommentEditForm (inline editing)
│   └── CommentReply (reply display with moderation status)
└── CommentReply (nested replies)
```

## API Endpoints Used

- `POST /api/comments/create` - Create new comment/reply (with automatic moderation)
- `GET /api/comments/product/:product_id` - Get comments for product
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `GET /api/comments/replies/:parent_id` - Get replies for comment

## Content Moderation Rules

### 🚫 Banned Content Types
- **Inappropriate Language**: Profanity in Vietnamese and English
- **Spam**: Excessive length (>500 chars), too many words (>100), repetitive characters
- **URL Spam**: More than 3 URLs in a single comment
- **Product Bashing**: Overly negative product reviews with inappropriate language

### ✅ Moderation Process
1. **Automatic Check**: Every comment is automatically scanned
2. **Violation Detection**: System identifies potential violations
3. **Status Assignment**: Comments are marked as active or inactive
4. **User Notification**: Users receive immediate feedback on comment status
5. **Admin Review**: Flagged comments await admin approval

## Usage

### 1. Add to Product Detail Page
```jsx
import CommentSection from '../../shared/CommentSection';

// In your product detail component
<CommentSection productId={product._id} />
```

### 2. User Authentication
The system automatically checks if users are logged in:
- **Logged in users**: Can create, edit, delete their own comments
- **Guest users**: See login prompt to access comment features

### 3. Comment Actions
- **Reply**: Click "Trả lời" button on any comment
- **Edit**: Click "Sửa" button on your own comments
- **Delete**: Click "Xóa" button on your own comments

### 4. Moderation Feedback
- **Success**: Green checkmark for approved comments
- **Warning**: Yellow alert for comments pending review
- **Violation Details**: Shows specific violation type and source

## Styling

The comment system uses:
- **Bootstrap 5** for responsive layout and components
- **Custom CSS** for enhanced visual appeal and moderation status
- **Responsive design** that works on mobile and desktop
- **Moderation alerts** with appropriate colors and icons

## State Management

- Uses React Context for user authentication state
- Local state for comment forms and UI interactions
- Moderation result state for immediate feedback
- Optimistic updates for better user experience

## Security Features

- **Authentication Required**: All comment actions require login
- **Ownership Validation**: Users can only modify their own comments
- **Admin Override**: Admins have full control over all comments
- **Input Validation**: Content validation before submission
- **Content Moderation**: Automatic violation detection and filtering

## Performance Optimizations

- **Pagination**: Loads comments in batches (5 per page)
- **Lazy Loading**: Replies are loaded with parent comments
- **Debounced Updates**: Prevents excessive API calls
- **Optimistic UI**: Immediate feedback for user actions
- **Efficient Moderation**: Fast keyword checking without external API calls

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: iOS Safari, Chrome Mobile
- **Progressive Enhancement**: Works without JavaScript (basic functionality)

## Future Enhancements

- [x] **Content Moderation**: Automatic violation detection ✅
- [x] **Spam Protection**: Basic spam pattern detection ✅
- [ ] Advanced AI moderation integration
- [ ] Comment moderation queue for admins
- [ ] Comment search and filtering
- [ ] Comment notifications
- [ ] Rich text editor for comments
- [ ] Comment analytics and reporting
- [ ] Enhanced spam protection and rate limiting

## Troubleshooting

### Common Issues

1. **Comments not loading**
   - Check if product ID is correctly passed
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Authentication errors**
   - Ensure user is logged in
   - Check if token is valid
   - Verify API authentication middleware

3. **Moderation issues**
   - Check if comment contains banned keywords
   - Verify comment length and content
   - Review spam detection patterns

4. **Styling issues**
   - Ensure Bootstrap CSS is loaded
   - Check if custom CSS file is imported
   - Verify responsive breakpoints

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## Contributing

When modifying the comment system:
1. Maintain the existing component structure
2. Follow React best practices
3. Test moderation functionality thoroughly
4. Update moderation rules as needed
5. Test on multiple devices and browsers
6. Update this documentation
7. Ensure accessibility standards are met

## Moderation Configuration

The system can be easily configured by modifying the `checkCommentViolation` function in `api/controllers/comment.controller.js`:

- **Banned Words**: Add/remove words from the `bannedWords` array
- **Spam Rules**: Adjust character limits and pattern detection
- **Violation Types**: Modify violation categorization logic
- **Moderation Source**: Change the source identifier for tracking
