# FeedbackPulse Widget

The FeedbackPulse Widget is a standalone JavaScript widget that can be embedded on any website to collect user feedback. It provides a floating feedback button that expands into a feedback form when clicked.

## Features

- **Shadow DOM Isolation**: Widget styles don't conflict with host page styles
- **Customizable Themes**: Match your brand colors with hex color codes
- **Responsive Design**: Works on desktop and mobile devices
- **Star Rating System**: 1-5 star rating collection
- **Comment Collection**: Detailed feedback text collection
- **Optional Email Capture**: Collect user contact information
- **Error Handling**: Graceful fallbacks and error recovery
- **Lightweight**: Minimal impact on page load performance

## Installation

### Basic Installation

Add this script tag to your website where you want the widget to appear:

```html
<script src='https://feedbackpulse.com/widget.js?project_id=YOUR_PROJECT_ID'></script>
```

### Configuration Options

The widget accepts several configuration parameters via URL query parameters:

```html
<script src='https://feedbackpulse.com/widget.js?project_id=YOUR_PROJECT_ID&theme=#FF5733&question=How%20can%20we%20improve%3F&position=bottom-right'></script>
```

#### Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `project_id` | Yes | - | Your project ID from FeedbackPulse dashboard |
| `theme` | No | `#3B82F6` | Widget theme color (hex color code) |
| `question` | No | `How can we improve?` | Custom feedback question text |
| `position` | No | `bottom-right` | Widget position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |

## Architecture

The widget consists of three main components:

### 1. Bootstrap Script (`widget.js`)

The main script that users embed in their websites. It:
- Parses configuration from script tag parameters
- Creates shadow DOM for style isolation
- Loads the widget bundle
- Handles initialization and error cases

### 2. Widget Bundle (`widget-bundle.js`)

The React-based widget component that provides:
- Interactive feedback form
- Star rating component
- Comment and email collection
- API communication with FeedbackPulse backend

### 3. Widget Component (`FeedbackWidget.tsx`)

The main React component with:
- State management for form data
- Form validation and submission
- Success/error handling
- Responsive design

## Development

### File Structure

```
src/widget/
├── FeedbackWidget.tsx     # Main React widget component
├── widget-bundle.tsx      # Bundle entry point
├── widget.css            # Widget styles
├── widget.test.ts        # Unit tests
└── README.md            # This documentation

public/
├── widget.js            # Bootstrap script (main entry point)
├── widget-bundle.js     # Compiled widget bundle
└── widget-demo.html     # Demo page
```

### Building the Widget

To build the widget bundle:

```bash
npm run build:widget
```

This creates the `widget-bundle.js` file in the `public` directory.

### Testing

Run the widget tests:

```bash
npm test src/widget/widget.test.ts
```

### Demo

Open `public/widget-demo.html` in a browser to see the widget in action with different configurations.

## Usage Examples

### Default Configuration

```html
<script src='https://feedbackpulse.com/widget.js?project_id=abc123'></script>
```

### Custom Theme and Question

```html
<script src='https://feedbackpulse.com/widget.js?project_id=abc123&theme=#FF5733&question=Rate%20our%20service'></script>
```

### Different Position

```html
<script src='https://feedbackpulse.com/widget.js?project_id=abc123&position=top-left'></script>
```

## API Integration

The widget submits feedback to the FeedbackPulse API at:

```
POST /api/feedback
```

With the following payload:

```json
{
  "project_id": "string",
  "rating": 1-5,
  "comment": "string",
  "email": "string (optional)",
  "source": "widget"
}
```

## Browser Support

The widget supports all modern browsers:

- Chrome 63+
- Firefox 63+
- Safari 13+
- Edge 79+

## Security & Privacy

- All data transmission uses HTTPS
- Shadow DOM provides style isolation
- Minimal data collection - only user-provided feedback
- No tracking cookies or persistent storage
- GDPR compliant

## Error Handling

The widget includes comprehensive error handling:

- **Network Errors**: Graceful degradation if API is unavailable
- **Script Load Errors**: Fallback error messages
- **Configuration Errors**: Validation and default values
- **Bundle Load Errors**: Basic HTML fallback interface

## Deployment

### Production Deployment

1. Build the widget bundle: `npm run build:widget`
2. Deploy both `widget.js` and `widget-bundle.js` to your CDN
3. Ensure CORS headers allow embedding on customer domains
4. Set up proper cache headers for performance

### CDN Configuration

Recommended cache headers:

```
Cache-Control: public, max-age=3600
Content-Type: application/javascript
Access-Control-Allow-Origin: *
```

## Troubleshooting

### Common Issues

**Widget not appearing:**
- Check browser console for JavaScript errors
- Verify project_id parameter is correct
- Ensure script tag src URL is accessible

**Styles not working:**
- Check if host page has CSP restrictions
- Verify shadow DOM is supported in browser

**Submission errors:**
- Check network tab for API request failures
- Verify CORS configuration on backend
- Check if ad blockers are blocking requests

### Debug Mode

Add `?debug=true` to enable console logging:

```html
<script src='https://feedbackpulse.com/widget.js?project_id=abc123&debug=true'></script>
```

## Contributing

1. Make changes to widget files in `src/widget/`
2. Update tests in `widget.test.ts`
3. Build with `npm run build:widget`
4. Test with demo page `widget-demo.html`
5. Update this documentation as needed