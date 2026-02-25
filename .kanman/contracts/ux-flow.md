# User Experience Flow - FeedbackPulse v2

## Overview

This document defines the complete user experience flows for FeedbackPulse v2, covering both the customer-facing widget experience and the dashboard user flows. All interactions are designed to be intuitive, accessible, and performant.

## Widget User Experience

### 1. Widget Loading & Initialization

#### Flow: Website Visitor Encounters Widget
```
Website loads → Widget script initializes → Floating button appears
```

**Interaction Sequence:**
1. Customer website loads with FeedbackPulse script tag
2. Widget initializes with project configuration (300ms delay for non-blocking)
3. Floating button fades in with subtle animation (500ms duration)
4. Button shows custom label and color based on project settings

**Visual States:**
- **Loading**: Invisible during initialization
- **Idle**: Floating button visible with custom styling
- **Hover**: Button scales 1.1x with color transition (200ms)
- **Disabled**: Grayed out if project is inactive

**Error Handling:**
- Script load failure → No widget shown (graceful degradation)
- Invalid project ID → Button disabled with tooltip
- Network error → Retry mechanism (3 attempts, exponential backoff)

### 2. Feedback Form Interaction

#### Flow: Customer Provides Feedback
```
Button click → Form slides in → User fills form → Submits → Thank you message
```

**Detailed Interaction Sequence:**

**Step 1: Opening Form**
1. User clicks floating button
2. Form container slides in from button position (300ms ease-out animation)
3. Overlay darkens background (opacity 0.3)
4. Focus moves to rating component
5. Floating button transforms to close (×) icon

**Step 2: Rating Selection**
1. User sees 5 star rating component
2. Stars highlight on hover (gold color, 150ms transition)
3. Click sets rating, stars fill with animation
4. Rating value updates form state
5. Comment textarea becomes available with subtle highlight

**Step 3: Comment Input**
1. User clicks into textarea
2. Placeholder text fades out
3. Character counter appears (max 1000 characters)
4. Auto-resize textarea as user types
5. Real-time validation feedback

**Step 4: Email Input (Optional)**
1. Email field available below comment
2. Placeholder: "Your email (optional, for follow-up)"
3. Email validation on blur with immediate feedback
4. Invalid email shows inline error message

**Step 5: Form Submission**
1. Submit button enables when rating and comment provided
2. Click triggers form validation
3. Success → Loading spinner on button (750ms)
4. API call with feedback data
5. Success response → Transform to thank you screen
6. Error response → Show error message, keep form open

**Visual States:**
- **Form Opening**: Slide-in animation from button position
- **Active Input**: Focus rings and subtle highlighting
- **Validation Error**: Red border, error message below field
- **Submitting**: Submit button shows spinner, form disabled
- **Success**: Form transforms to thank you message
- **Network Error**: Error banner at top of form

### 3. Post-Submission Experience

#### Flow: Feedback Submitted Successfully
```
Submit success → Thank you animation → Auto-close after 3 seconds
```

**Interaction Sequence:**
1. Form content fades out (200ms)
2. Thank you message fades in with checkmark icon
3. "Thank you! Your feedback helps us improve." message
4. Subtle pulse animation on checkmark (1 second)
5. Auto-close countdown (3 seconds) with visual timer
6. Form slides out and floating button returns
7. Button shows brief "Thanks!" state (2 seconds) before returning to normal

**Customization Options:**
- Thank you message text (project setting)
- Auto-close delay (3-10 seconds)
- Success animation style

### 4. Widget Accessibility Flow

#### Keyboard Navigation
1. Tab to floating button → Button focused with outline
2. Enter/Space opens form → Focus moves to rating
3. Arrow keys navigate rating stars
4. Tab through comment → email → submit
5. Escape closes form at any point

#### Screen Reader Experience
1. Button announced as "Provide feedback"
2. Form announced as "Feedback form dialog"
3. Rating announced as "Rating, 3 out of 5 stars selected"
4. Form submission announced with result

## Dashboard User Experience

### 1. Authentication Flow

#### Flow: New User Registration
```
Landing page → Sign up → Email verification → Dashboard onboarding
```

**Detailed Steps:**
1. **Landing Page Visit**
   - Hero section with value proposition
   - CTA button: "Start collecting feedback"
   - Login link for existing users

2. **Registration Form**
   - Email, password, confirm password fields
   - Real-time validation (password strength, email format)
   - Terms acceptance checkbox
   - Submit triggers Supabase signup

3. **Email Verification**
   - Success message: "Check your email for verification link"
   - Resend option available after 60 seconds
   - Progress indicator showing verification pending

4. **First Login & Onboarding**
   - Email verified → Automatic login
   - Welcome modal with quick tour option
   - Create first project prompt

#### Flow: Returning User Login
```
Login page → Credentials → Dashboard (with existing projects)
```

**Steps:**
1. **Login Form**
   - Email and password fields
   - "Remember me" checkbox
   - Forgot password link
   - Social login options (future enhancement)

2. **Authentication**
   - Form validation before submission
   - Loading state on submit button
   - Success → Redirect to dashboard
   - Error → Show inline error message

### 2. Dashboard Navigation Flow

#### Flow: Main Dashboard Experience
```
Login → Projects overview → Select project → Feedback/Analytics views
```

**Navigation Structure:**
1. **Top Navigation**
   - Logo (home link)
   - Main navigation: Dashboard, Projects, Account
   - User menu: Profile, Settings, Logout
   - Project selector (when in project context)

2. **Sidebar Navigation** (Project Context)
   - Overview
   - Feedback (with unread count)
   - Analytics
   - Widget Setup
   - Project Settings

3. **Breadcrumb Navigation**
   - Shows current location in hierarchy
   - Clickable path back to parent sections

### 3. Project Management Flow

#### Flow: Creating New Project
```
Dashboard → New Project → Project setup → Widget configuration → Integration
```

**Step-by-Step Process:**

**Step 1: Project Details**
1. Click "Create Project" button
2. Modal opens with project setup form
3. Required fields: Project name, Website URL
4. Optional: Description, Industry
5. Form validation on each field

**Step 2: Widget Customization**
1. Preview section shows live widget preview
2. Button label input (default: "Feedback")
3. Color picker for button color (default: #3B82F6)
4. Position selector (bottom-right default)
5. Real-time preview updates

**Step 3: Integration Setup**
1. Generated embed code displayed
2. Copy-to-clipboard functionality
3. Installation instructions for different platforms
4. Testing section with preview URL

**Step 4: Project Activation**
1. Review project settings
2. Confirm creation
3. Success message with next steps
4. Redirect to project dashboard

#### Flow: Project Settings Management
```
Project → Settings → Update configuration → Save changes
```

**Settings Categories:**
1. **Basic Information**
   - Project name, URL, description
   - Industry/category selection
   - Active/inactive toggle

2. **Widget Appearance**
   - Button customization options
   - Position and behavior settings
   - Mobile responsiveness options

3. **Data Collection**
   - Required/optional fields configuration
   - Data retention settings
   - Export options

### 4. Feedback Management Flow

#### Flow: Viewing and Managing Feedback
```
Project → Feedback list → Apply filters → View details → Take actions
```

**Feedback List Interface:**
1. **Default View**
   - Paginated table (25 items per page)
   - Columns: Date, Rating, Comment preview, Source, Actions
   - Sort by: Date (newest first), Rating, Source

2. **Filtering System**
   - Date range picker (last 30 days default)
   - Rating filter (All, 1-2 stars, 3 stars, 4-5 stars)
   - Source filter (All, specific URLs)
   - Search box for comment text

3. **Individual Feedback Actions**
   - Click row → Expand full comment
   - Mark as read/unread
   - Add internal notes
   - Export individual feedback

4. **Bulk Actions**
   - Select multiple feedback items
   - Bulk export to CSV
   - Bulk mark as read
   - Bulk archive

### 5. Analytics & Reporting Flow

#### Flow: Analytics Dashboard
```
Project → Analytics → Select date range → View charts → Export data
```

**Analytics Sections:**

**1. Overview Cards**
- Total feedback count
- Average rating (with trend indicator)
- Response rate (if tracking page views)
- Most recent feedback timestamp

**2. Rating Distribution Chart**
- Horizontal bar chart showing 1-5 star distribution
- Percentage and absolute numbers
- Hover tooltips with details

**3. Feedback Timeline**
- Line chart showing feedback volume over time
- Configurable date ranges (7d, 30d, 90d, custom)
- Hover shows exact counts per day/week

**4. Sentiment Analysis**
- Pie chart with positive/neutral/negative segments
- Based on keyword analysis of comments
- Click segments to see related feedback

**5. Source Analysis**
- Table showing feedback by referrer URL
- Helps identify which pages generate most feedback
- Click-through to filter main feedback view

### 6. Widget Setup & Testing Flow

#### Flow: Widget Integration Testing
```
Project → Widget Setup → Copy code → Test widget → Verify data
```

**Setup Process:**
1. **Code Generation**
   - JavaScript snippet with project ID
   - Multiple integration options (script tag, npm package)
   - Framework-specific examples (React, Vue, etc.)

2. **Installation Verification**
   - Live widget preview on test page
   - Network request monitoring
   - Real-time feedback test form

3. **Testing & Validation**
   - Submit test feedback through widget
   - Verify feedback appears in dashboard
   - Test different configurations
   - Mobile responsiveness check

## Loading States & Transitions

### Progressive Loading Strategy
1. **Initial Page Load**
   - Skeleton screens for data-heavy components
   - Progressive enhancement as data loads
   - Critical content first, secondary data after

2. **Navigation Transitions**
   - Immediate route change with loading state
   - Preserve scroll position where appropriate
   - Breadcrumb updates immediately

3. **Data Updates**
   - Optimistic UI updates where possible
   - Loading indicators for longer operations
   - Error states with retry options

### Animation Guidelines
- **Micro-interactions**: 150-300ms duration
- **Page transitions**: 200-400ms duration
- **Modal/overlay**: 250-350ms duration
- **Data loading**: Skeleton → fade-in transition

## Error States & Recovery

### Error Categories & Handling

#### 1. Network Errors
- **Symptoms**: API requests timeout or fail
- **User Experience**: 
  - Retry button with exponential backoff
  - Offline indicator when network unavailable
  - Cached data shown when possible

#### 2. Authentication Errors
- **Symptoms**: Token expired, unauthorized access
- **User Experience**:
  - Automatic token refresh attempt
  - Graceful logout with session restoration
  - Clear error messages without technical jargon

#### 3. Validation Errors
- **Symptoms**: Form submission with invalid data
- **User Experience**:
  - Real-time field validation
  - Clear, actionable error messages
  - Focus management to error fields

#### 4. Rate Limiting
- **Symptoms**: Too many requests from widget/dashboard
- **User Experience**:
  - Clear messaging about rate limits
  - Automatic retry with appropriate delays
  - Graceful degradation of functionality

### Error Recovery Patterns
1. **Automatic Retry**: Network requests with exponential backoff
2. **Manual Retry**: User-triggered retry buttons for failed actions
3. **Fallback Content**: Cached or placeholder content when fresh data unavailable
4. **Graceful Degradation**: Core functionality preserved when enhancements fail

## Mobile Experience

### Responsive Design Strategy
1. **Widget Mobile Behavior**
   - Floating button scales appropriately
   - Form overlays full screen on mobile
   - Touch-friendly button sizes (44px minimum)

2. **Dashboard Mobile Layout**
   - Hamburger menu for navigation
   - Stacked cards instead of complex tables
   - Swipe gestures for navigation
   - Bottom navigation for primary actions

3. **Touch Interactions**
   - Tap targets minimum 44x44px
   - Hover states adapted for touch
   - Pull-to-refresh on data lists
   - Swipe actions for common tasks

## Performance Targets

### Widget Performance
- **Initial load**: < 100KB bundle size
- **Time to interactive**: < 500ms
- **Form submission**: < 2 seconds response time
- **Animation smoothness**: 60fps on modern devices

### Dashboard Performance
- **First contentful paint**: < 1.5 seconds
- **Page navigation**: < 300ms route change
- **Data loading**: < 3 seconds for initial data
- **Chart rendering**: < 1 second for complex visualizations

## Accessibility Standards

### WCAG 2.1 AA Compliance
1. **Color Contrast**: 4.5:1 minimum for normal text
2. **Keyboard Navigation**: All functionality accessible via keyboard
3. **Screen Reader Support**: Proper semantic markup and ARIA labels
4. **Focus Management**: Logical focus order and visible focus indicators

### Specific Accessibility Features
- **Widget**: Keyboard navigation, screen reader announcements
- **Dashboard**: Skip links, landmark navigation, table headers
- **Forms**: Associated labels, error identification, help text
- **Charts**: Alternative text descriptions, data tables for screen readers