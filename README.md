# Feedback Widget

An embeddable feedback collection widget that can be easily integrated into any website to collect user feedback.

## Features

- 🚀 **Easy Integration** - Just add a script tag and initialize
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Customizable** - Colors, position, text, and field visibility
- 🌙 **Dark Theme Support** - Automatically adapts to user's theme preference
- ♿ **Accessible** - Keyboard navigation and screen reader friendly
- 🔒 **Isolated** - CSS namespace prevents conflicts with host site
- ⚡ **Lightweight** - Self-contained with no external dependencies

## Quick Start

### 1. Include the Widget Script

```html
<!-- Add before closing </body> tag -->
<script src="path/to/widget.js"></script>
<script>
  FeedbackWidget.init();
</script>
```

### 2. Customize (Optional)

```html
<script>
  FeedbackWidget.init({
    position: 'bottom-right',
    primaryColor: '#00C2A8',
    title: 'Feedback',
    placeholder: 'Share your feedback...',
    showName: true,
    showEmail: true
  });
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | string | `'bottom-right'` | Widget position: `'bottom-right'`, `'bottom-left'`, `'top-right'`, `'top-left'` |
| `primaryColor` | string | `'#00C2A8'` | Primary color for buttons and accents |
| `title` | string | `'Feedback'` | Widget title text |
| `placeholder` | string | `'Share your feedback...'` | Placeholder text for comment field |
| `showName` | boolean | `true` | Show/hide the name field |
| `showEmail` | boolean | `true` | Show/hide the email field |
| `apiUrl` | string | `'https://user-comments-backend.onrender.com/submit_comment'` | Backend API endpoint |

## API Methods

### `FeedbackWidget.init(options)`
Initialize the widget with optional configuration.

```javascript
FeedbackWidget.init({
  position: 'bottom-left',
  primaryColor: '#ff6b6b'
});
```

### `FeedbackWidget.open()`
Programmatically open the feedback panel.

```javascript
FeedbackWidget.open();
```

### `FeedbackWidget.close()`
Programmatically close the feedback panel.

```javascript
FeedbackWidget.close();
```

## Form Fields

The widget collects the following data:

- **Comment** (required) - User's feedback text
- **Name** (optional) - User's name
- **Email** (optional) - User's email address
- **Company** (auto-detected) - Website domain name
- **Website URL** (auto-detected) - Full website URL

## Data Submission

The widget automatically detects the website domain and submits feedback to your backend API with the following structure:

```json
{
  "comment": "User's feedback text",
  "name": "User's name (optional)",
  "email": "user@example.com (optional)",
  "company": "example.com",
  "website_url": "https://example.com"
}
```

## Styling

The widget includes comprehensive CSS that:

- Uses CSS custom properties for easy theming
- Includes a CSS reset to prevent host site interference
- Supports both light and dark themes
- Is fully responsive across all device sizes
- Uses high z-index values to appear above host content

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Demo

Open `demo.html` in your browser to see the widget in action and test different configurations.

## Integration Examples

### Basic Integration
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Your website content -->
    
    <!-- Feedback Widget -->
    <script src="widget.js"></script>
    <script>
        FeedbackWidget.init();
    </script>
</body>
</html>
```

### Custom Configuration
```html
<script>
FeedbackWidget.init({
    position: 'bottom-left',
    primaryColor: '#6366f1',
    title: 'Send Feedback',
    placeholder: 'How can we improve?',
    showName: false,
    showEmail: true
});
</script>
```

### Programmatic Control
```html
<button onclick="FeedbackWidget.open()">Give Feedback</button>
<button onclick="FeedbackWidget.close()">Close Feedback</button>
```

## Next Steps

This widget implements **Steps 1 & 2** of the feedback widget development plan:

✅ **Step 1: Create the Widget JavaScript File**
- Self-contained JavaScript with namespace isolation
- Widget initialization function
- Basic HTML structure injection

✅ **Step 2: Build the Basic Widget Structure**
- Floating feedback button
- Slide-out feedback form panel
- Form fields (comment, name, email)
- Submit and close buttons
- Loading states and success/error messages

### Upcoming Steps:
- **Step 3**: Toggle functionality (partially implemented)
- **Step 4**: Enhanced responsive styling
- **Step 5**: Form submission to backend API
- **Step 6**: Advanced form validation
- **Step 7**: AJAX integration
- **Step 8**: Enhanced error handling
- **Step 9**: Advanced customization options

## License

MIT License - feel free to use in your projects!
