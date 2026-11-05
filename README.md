# Amyaaz Portfolio – Premium Next.js Experience

A high-end, sophisticated portfolio website built with **Next.js 15**, **React 19**, **Tailwind CSS**, and **Framer Motion**.

## 🎯 Features

- **Premium Design System**: Dark theme with sophisticated color palette and typography
- **Smooth Animations**: Framer Motion for engaging transitions and interactions
- **Responsive Layout**: Mobile-first design that looks perfect on all devices
- **Fast Performance**: Next.js App Router with server & client components
- **Logo Integration**: Your custom AA monogram throughout the site
- **SEO Optimized**: Metadata, open graph, and structured data
- **Accessible**: WCAG compliant with semantic HTML and ARIA labels

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home page
│   ├── about/
│   │   └── page.tsx      # About page (with photo section)
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── Header.tsx        # Fixed navigation with logo
│   ├── Hero.tsx          # Hero section with animated background
│   ├── Work.tsx          # Project showcase grid
│   ├── Services.tsx      # Services cards
│   └── Footer.tsx        # Footer with links
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 🎨 Customization

### Colors
Edit `tailwind.config.ts` to modify the color palette:
- `dark-*`: Background and text colors
- `accent-*`: Primary green accent color

### Typography
Fonts are configured in `tailwind.config.ts`. Update to your preferred:
- `--font-sans`: Body text
- `--font-serif`: Headings

### Logo
The AA monogram is defined as SVG in components. Replace with your logo file or SVG markup.

### Content
- **Home**: Edit `src/app/page.tsx`
- **About**: Edit `src/app/about/page.tsx`
- **Services**: Update service list in `src/components/Services.tsx`
- **Portfolio**: Update projects in `src/components/Work.tsx`

## 📦 Dependencies

- `next`: React framework
- `react`: UI library
- `framer-motion`: Animation library
- `tailwindcss`: Utility-first CSS
- `clsx`: Utility for conditional classes

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Other Platforms
- **Netlify**: Push to Git and connect
- **AWS Amplify**: Connect GitHub repository
- **Docker**: Create Dockerfile with Node base image

## 📄 License

Private project for Amyaaz. All rights reserved.

---

Built with premium design principles and modern web technology.
