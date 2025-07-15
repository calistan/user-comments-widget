# Widget Deployment Guide

## Issue Fixed
The widget was not visible because:
1. **Missing widgetId**: The widget requires a `widgetId` parameter during initialization
2. **CSS positioning bug**: Position-specific styles were only applied at 1024px+, causing the widget to be positioned incorrectly on tablet screens (768px-1024px)
3. **Page jumping**: Body scroll prevention was too aggressive on desktop

## Changes Made

### 1. Fixed Widget Initialization
- Added required `widgetId: 'demo-widget-id'` to both initial setup and updateWidget function
- Updated integration code example to show widgetId requirement

### 2. Fixed CSS Positioning
- Moved position-specific button styles from desktop media query (1024px+) to tablet media query (768px+)
- This ensures proper positioning on all screen sizes above mobile

### 3. Reduced Page Jumping
- Modified `preventBodyScroll()` function to only prevent scroll on mobile devices (≤768px)
- This eliminates page jumping when toggling the widget on desktop

## Deployment Steps

### For Vercel (user-comments-widget.vercel.app)
1. Commit and push the changes to your repository
2. Vercel will automatically deploy the updated widget
3. The widget should now be visible at: https://user-comments-widget.vercel.app

### Testing the Widget
1. Visit the deployed URL
2. Look for the feedback button in the bottom-right corner
3. Click "Toggle Widget" to test functionality
4. The widget should appear without page jumping

## Integration Code
When users integrate the widget, they need to include the widgetId:

```html
<script src="https://user-comments-widget.vercel.app/widget.js"></script>
<script>
  FeedbackWidget.init({
    widgetId: 'your-widget-id', // Required: Get from admin dashboard
    position: 'bottom-right',
    primaryColor: '#00C2A8',
    title: 'Feedback',
    placeholder: 'Share your feedback...',
    showName: true,
    showEmail: true
  });
</script>
```

## Backend Configuration
The widget automatically detects the environment:
- **Local development**: Uses `http://localhost:5000/submit_comment`
- **Production**: Uses `https://user-comments-backend-gwos.onrender.com/submit_comment`

## Files Modified
- `index.html`: Added widgetId to initialization
- `widget.js`: Fixed CSS positioning and scroll prevention
- `test-minimal.html`: Created for testing (new file)
