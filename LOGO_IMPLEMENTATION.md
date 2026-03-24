# Logo Implementation Guide

## Overview
The "Logo with Text T.png" has been integrated across the project as the primary branding element for the Risk Sharing Platform. This logo appears on authentication screens and throughout the application.

## Logo Locations

### Source File
- **Original**: `/public/Images/Pics/Logo with Text T.png`
- **Deployed**: `/public/Images/logo.png` (copy of the original)

## Where the Logo Appears

### 1. Login Page (`src/app/page.tsx`)
- **Location**: Above the login card
- **Dimensions**: 280x100 pixels
- **Features**:
  - Uses Next.js Image component with `priority` for fast loading
  - Drop shadow effect for visual depth
  - Responsive and optimized for performance

```tsx
<Image 
  src="/Images/logo.png" 
  alt="Risk Sharing Platform Logo" 
  width={280} 
  height={100}
  priority
  className="drop-shadow-lg"
/>
```

### 2. Sidebar (`src/components/common/Sidebar.tsx`)
- **Location**: Top of the sidebar navigation
- **Dimensions**: 200x70 pixels
- **Features**:
  - Positioned in a yellow background section (`bg-[#FFF9E5]`)
  - Always visible when navigating through the app
  - Consistent branding across all pages

```tsx
<Image 
  src="/Images/logo.png" 
  alt="Risk Sharing Platform Logo" 
  width={200} 
  height={70} 
  priority 
/>
```

## Styling and Design

### Login Page Logo
- **Container**: Centered with flex layout
- **Margin**: `mb-6` (24px bottom margin)
- **Effect**: Drop shadow for prominence
- **Background**: Gradient background (brand colors)

### Sidebar Logo
- **Container**: Yellow background box (`#FFF9E5`)
- **Height**: Fixed at 80px (`h-20`)
- **Padding**: Horizontal padding for spacing
- **Border**: Bottom border for separation from navigation

## Technical Implementation

### Next.js Image Optimization
Both logo instances use Next.js's `<Image>` component which provides:
- Automatic image optimization
- Lazy loading (except where `priority` is set)
- Responsive image sizing
- WebP format conversion when supported
- Prevents Cumulative Layout Shift (CLS)

### Priority Loading
The `priority` prop is used on both logos to ensure they load immediately without lazy loading, which is important for branding elements that should appear instantly.

## Updating the Logo

To update the logo in the future:

### Option 1: Replace the File
```bash
# Replace the deployed logo
cp "/path/to/new/logo.png" public/Images/logo.png

# Clear build cache
rm -rf .next

# Rebuild
npm run build
```

### Option 2: Update the Source
```bash
# Update the source file
cp "/path/to/new/logo.png" "public/Images/Pics/Logo with Text T.png"

# Copy to deployed location
cp "public/Images/Pics/Logo with Text T.png" public/Images/logo.png

# Rebuild
npm run build
```

## Logo Specifications

### Current Logo
- **Filename**: `Logo with Text T.png`
- **Size**: ~1 MB (980 KB)
- **Dimensions**: Original high resolution
- **Format**: PNG with transparency (if applicable)

### Recommended Specifications for Future Logos
- **Format**: PNG (for transparency) or WebP
- **Dimensions**: At least 800x300 pixels (maintains quality at all sizes)
- **File Size**: < 500 KB (after optimization)
- **Color Mode**: RGB
- **Background**: Transparent preferred

## Responsive Behavior

### Mobile Devices
- Login page logo scales proportionally
- Sidebar logo remains visible on mobile when sidebar is open
- Next.js Image component handles responsive sizing automatically

### Desktop
- Full-size logos displayed
- Sharp and clear at all zoom levels
- Maintains aspect ratio

## Brand Consistency

The logo implementation ensures:
1. **Consistent Appearance**: Same logo across auth and app pages
2. **Professional Look**: Proper sizing and spacing
3. **Fast Loading**: Optimized images with priority loading
4. **Accessibility**: Alt text provided for screen readers
5. **Maintainability**: Single source file for easy updates

## Files Modified

1. `/src/app/page.tsx` - Login page with logo
2. `/src/components/common/Sidebar.tsx` - Sidebar with logo
3. `/public/Images/logo.png` - Deployed logo file

## Testing Checklist

When updating the logo, verify:
- [ ] Logo displays correctly on login page
- [ ] Logo displays correctly in sidebar
- [ ] Logo loads quickly (check Network tab)
- [ ] Logo is sharp on high-DPI displays
- [ ] Logo maintains aspect ratio on all screen sizes
- [ ] Alt text is descriptive
- [ ] No console warnings about image optimization
- [ ] Logo is visible in both light and dark themes (if applicable)

## Related Documentation
- [FAVICON_SETUP.md](./FAVICON_SETUP.md) - For favicon/icon configuration
- Next.js Image Optimization: https://nextjs.org/docs/app/api-reference/components/image
