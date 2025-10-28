# GeoWhisper Frontend Structure

## 📁 Project Organization

```
frontend/
├── app/
│   ├── page.tsx          # Homepage
│   ├── signin/
│   │   └── page.tsx      # Sign In page
│   ├── signup/
│   │   └── page.tsx      # Sign Up page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── Navbar.tsx        # Navigation component
│   └── Footer.tsx        # Footer component
└── public/               # Static assets
```

## 🎨 Design System

### Colors
- **Primary**: Cyan-500 (#06B6D4)
- **Dark Background**: Black (#000000)
- **Light Background**: White (#FFFFFF)
- **Text Dark**: Gray-900
- **Text Light**: White
- **Accents**: Blue-500

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold, Tight tracking
- **Body**: Regular, Relaxed leading

### Theme
- **Dark Mode**: Black background with cyan accents
- **Light Mode**: White background with gray text
- **Toggle**: Sun/Moon icon in navbar

## 🧩 Components

### Navbar (`components/Navbar.tsx`)
- Fixed position, glassmorphism effect
- Logo with MapPin icon
- Navigation links: Home, Hot Zones, My Posts, Profile
- AI Status indicator (animated sparkles)
- Sign In / Sign Up buttons
- Theme toggle
- Responsive mobile menu

### Footer (`components/Footer.tsx`)
- Copyright notice
- Quick links: About, Terms, Privacy
- Social icons: GitHub, Twitter, Discord
- Responsive layout

## 📄 Pages

### Homepage (`app/page.tsx`)
- Hero section with gradient text
- Two CTA buttons: "Open Map" and "Discover Hot Zones"
- Three feature cards:
  - Local AI Agents
  - Vibe Summarizer
  - Smart Moderator
- Background dot pattern

### Sign In (`app/signin/page.tsx`)
- Email and password inputs
- "Forgot password?" link
- Google Sign-In option
- Link to Sign Up page
- Form validation

### Sign Up (`app/signup/page.tsx`)
- Name, email, password, and confirm password inputs
- Terms & Privacy policy links
- Google Sign-Up option
- Link to Sign In page
- Password matching validation

## 🎭 Animations

Using **Framer Motion** for:
- Page transitions (fade in, slide up)
- Button hover effects (scale)
- Card hover lifts
- Navigation link micro-interactions
- Mobile menu animations

## 🎯 Key Features

1. **Full Dark/Light Mode Support**
   - Persistent theme toggle
   - Smooth transitions
   - Consistent styling across all pages

2. **Responsive Design**
   - Mobile-first approach
   - Breakpoints: sm, md, lg
   - Hamburger menu for mobile

3. **Accessibility**
   - Semantic HTML
   - ARIA labels where needed
   - Keyboard navigation support
   - Focus states

4. **Modern Stack**
   - Next.js 16 (App Router)
   - Tailwind CSS v4
   - Framer Motion
   - Lucide React Icons
   - TypeScript

## 🚀 Getting Started

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

## 🎨 Customization

### Changing Colors
Edit the cyan-500 references in components to your preferred color:
```tsx
className="bg-cyan-500 hover:bg-cyan-600"
```

### Adding New Pages
1. Create folder in `app/` directory
2. Add `page.tsx` file
3. Import `Navbar` and `Footer` components
4. Add to navigation links in `Navbar.tsx`

### Modifying Animations
Adjust Framer Motion props:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
```

## 🔧 Tech Stack

- **Framework**: Next.js 16
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Language**: TypeScript
- **Font**: Inter (Google Fonts)

---

Built with ❤️ for GeoWhisper
