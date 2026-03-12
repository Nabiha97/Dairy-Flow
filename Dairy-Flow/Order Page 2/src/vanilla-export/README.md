# Fresh Dairy Farm Website - Installation Guide

## 📁 Files Included
- `index.html` - Main HTML structure
- `styles.css` - All CSS styling
- `script.js` - JavaScript functionality

## 🚀 How to Run in VS Code

### Method 1: Using Live Server Extension (Recommended)

1. **Install Live Server Extension:**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
   - Search for "Live Server" by Ritwick Dey
   - Click Install

2. **Run the Website:**
   - Open the `index.html` file in VS Code
   - Right-click anywhere in the HTML file
   - Select "Open with Live Server"
   - Your default browser will open with the website

### Method 2: Direct File Opening

1. **Simple Open:**
   - Navigate to the folder containing these files
   - Double-click `index.html`
   - It will open in your default browser

### Method 3: Using VS Code's Built-in Browser Preview

1. **Install Browser Preview Extension:**
   - Open Extensions in VS Code
   - Search for "Browser Preview"
   - Install it

2. **Run:**
   - Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)
   - Type "Browser Preview: Open Preview"
   - Navigate to your `index.html` file

## 📂 File Structure

```
dairy-farm-website/
│
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## ✨ Features

### Login System
- Sign In and Sign Up forms
- Form validation
- Password visibility toggle
- Demo mode (use any email and password with 6+ characters)

### Product Catalog
- 13 dairy products including:
  - Fresh Whole Milk, Toned Milk
  - Fresh Curd, Fresh Paneer, Fresh Butter
  - Buttermilk, Pure Ghee
  - Vanilla, Chocolate Ice Cream
  - Strawberry Milk, Chocolate Milk
  - Gulab Jamun, Cheese Namkeen
- Real product images from Unsplash
- Search functionality
- Category labels

### Shopping Cart
- Add to cart functionality
- Quantity controls (increase/decrease)
- Remove items
- Real-time price calculation
- Cart badge showing total items

### Checkout Process
- Order summary
- Customer information form
- Delivery address details
- Payment method selection (COD, Online, Card)
- Order confirmation

### User Experience
- Responsive design (works on mobile, tablet, desktop)
- Sticky header with user info
- Logout functionality
- Visual notifications
- Smooth animations

## 🎨 Customization

### Change Colors
Open `styles.css` and modify the green color values:
- Primary green: `#16a34a`
- Hover green: `#15803d`
- Light green background: `#f0fdf4`

### Add More Products
Open `script.js` and add products to the `products` array:

```javascript
{
    id: '14',
    name: 'Product Name',
    price: 100,
    unit: '1kg',
    image: 'image-url',
    category: 'Category'
}
```

### Modify Pricing
Change the `price` values in the products array in `script.js`

## 🔧 Technical Details

- **No Dependencies:** Pure HTML, CSS, and JavaScript
- **Icons:** Font Awesome 6.4.0 (loaded via CDN)
- **Images:** Unsplash API
- **Browser Support:** All modern browsers (Chrome, Firefox, Safari, Edge)

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🐛 Troubleshooting

**Issue: Images not loading**
- Check your internet connection (images are loaded from Unsplash)
- If still not working, replace image URLs in `script.js` with local images

**Issue: Styles not applying**
- Make sure all three files (HTML, CSS, JS) are in the same folder
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

**Issue: JavaScript not working**
- Open browser console (F12) to check for errors
- Ensure `script.js` is in the same folder as `index.html`

## 💡 Demo Credentials

**Login:**
- Email: Any valid email format (e.g., user@example.com)
- Password: Any password with 6+ characters (e.g., 123456)

## 📝 Notes

- This is a demo application for educational purposes
- No real backend - all data is stored in browser memory
- Cart data will be lost on page refresh
- Payment options are for demonstration only

## 🎯 Future Enhancements

Possible improvements you can add:
- LocalStorage for cart persistence
- Order history
- User profiles
- Real payment integration
- Backend API integration
- Admin panel for product management

## 📞 Support

If you need help:
1. Check the browser console for errors (F12)
2. Verify all files are in the same directory
3. Make sure you have internet connection for external resources

---

**Enjoy building your dairy farm website! 🥛🧈🧀**
