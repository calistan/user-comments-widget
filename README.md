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
<script src="https://your-widget-url.vercel.app/widget.js"></script>
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
| `apiUrl` | string | `'https://user-comments.onrender.com/submit_comment'` | Backend API endpoint |

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

## Deployment to Vercel

### Step 1: Prepare for Deployment

1. Make sure your widget files are ready:
   - `widget.js` (main widget file)
   - `index.html` (demo page and entry point)

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from widget directory
cd widget
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: user-comments-widget (or your preferred name)
# - Directory: ./
# - Override settings? N
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Set the root directory to `widget/`
5. Click "Deploy"

### Step 3: Update Integration Code

Once deployed, your widget will be available at:
```
https://your-project-name.vercel.app/widget.js
```

Update your integration code:
```html
<script src="https://your-project-name.vercel.app/widget.js"></script>
<script>
  FeedbackWidget.init();
</script>
```

## Local Development

### Environment Auto-Detection

The widget automatically detects whether it's running locally or in production:

- **Local Development**: Uses `http://localhost:5000/submit_comment`
- **Production**: Uses `https://user-comments.onrender.com/submit_comment`

### Running Locally

1. **Start the Backend Server** (in a separate terminal):
   ```bash
   cd backend
   # Activate virtual environment if needed
   .\.venv\Scripts\activate  # Windows
   # source .venv/bin/activate  # macOS/Linux

   # Install dependencies
   pip install -r requirements.txt

   # Start the server
   python app.py
   ```

2. **Start the Widget Demo**:
   ```bash
   cd widget

   # Option 1: Use the development script
   ./dev.sh        # macOS/Linux
   dev.bat         # Windows

   # Option 2: Use npm script
   npm run dev

   # Option 3: Manual server
   python -m http.server 8000

   # Then visit http://localhost:8000 or http://localhost:8000/index.html
   ```

3. **Check Environment**: The demo page will show whether you're in LOCAL or PRODUCTION mode

### Demo

Open `index.html` in your browser to see the widget in action and test different configurations. When deployed to Vercel, this will be the main page visitors see.

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
