# Amyaaz.com Portfolio Project - Complete Context

**Project Owner:** Amyaaz Aumeer  
**Email:** aumeeramyaaz@gmail.com  
**Location:** Port Louis, Mauritius  
**Domain:** amyaaz.com  
**Hosting:** Netlify (deployed via Netlify Drop)  
**Business Name:** Intellecht Solutions  
**Live Site:** https://amyaaz.com (Published Jun 14, 2026)

---

## Project Overview

Personal portfolio website for Amyaaz Aumeer, a Digital Solutions Architect specializing in the Zoho ecosystem. The site positions him as an enterprise solutions architect first, with deep expertise in Zoho Creator, Deluge scripting, Zoho Flow, Zoho Catalyst, and custom application development.

**Key Positioning:**
- Digital Solutions Architect (primary)
- Zoho Platform Specialist (secondary)
- Enterprise Systems, Web Applications, Mobile Development
- Mauritius-based serving Indian Ocean region

---

## Technical Stack

### Frontend
- **Single-page HTML5** portfolio
- **CSS3 animations** - Fluid morphing blob shapes (hero section background)
- **Responsive design** - Mobile-first approach with breakpoints at 768px
- **Typography:**
  - DM Serif Display (headings)
  - Space Mono (monospace/code)
  - Syne (body, sans-serif)
- **Google Fonts** integration

### Design System
- **Color Palette:**
  - Background: `#0a0a0f` (near-black)
  - Surface: `#111118`, `#18181f`
  - Border: `#2a2a38`
  - Accent Green: `#4ade80`
  - Accent Purple: `#818cf8`
  - Accent Pink: `#f472b6`
  - Text: `#e8e8f0` (off-white)
  - Muted: `#6b6b80`

### Animations
- **Blob Animations:** Four morphing geometric shapes in hero
  - Blob 1: 8s animation (top-left)
  - Blob 2: 10s animation (top-right)
  - Blob 3: 12s animation (bottom-right)
  - Blob 4: 9s animation (bottom-left)
  - Blend mode: `screen`, Opacity: 0.08, Blur: 80px
  - Color gradients using accent colors

- **Ticker Animation:** Horizontal scrolling text (28s loop)
- **Button Hover Effects:** Opacity + translateY transitions

### Hosting
- **Platform:** Netlify
- **Deployment Method:** Netlify Drop (drag-and-drop)
- **Custom Domain:** amyaaz.com (DNS configured)
- **Build Status:** Published June 14, 2026
- **Last Deployed From:** Netlify Drop

---

## File Structure

```
amyaaz.com/
├── index.html                                (Main portfolio page - 65KB)
├── robots.txt                                (SEO - search engine crawling)
├── sitemap.xml                               (SEO - sitemap for indexing)
├── Intellecht_Solutions_Service_Offerings.md (2500+ line service catalog)
└── amyaaz_business_card.pdf                  (2-page business card with QR code)
```

### File Details

**index.html** (65KB)
- Complete single-page portfolio
- Sections:
  1. Navigation bar (fixed, with logo + links)
  2. Hero section (with fluid blob animations, title, subtitle, CTA buttons, stats)
  3. Ticker (scrolling tech stack highlights)
  4. Articles/Content sections
  5. Featured projects/stack showcase (grid layout)
  6. Contact section
- SEO metadata:
  - Meta description
  - Keywords (Zoho developer, digital solutions architect, etc.)
  - OG tags (Open Graph for social sharing)
  - JSON-LD schema (Person schema)
  - Canonical URL
  - Twitter card

**robots.txt**
```
User-agent: *
Allow: /

Sitemap: https://amyaaz.com/sitemap.xml
```

**sitemap.xml**
- Single URL entry: https://amyaaz.com/
- Change frequency: monthly
- Priority: 1.0

**Intellecht_Solutions_Service_Offerings.md** (19KB)
- Comprehensive service catalog for contract proposals to employers
- 40+ sections covering:
  - Core Services (architecture, automation)
  - Enterprise Systems (ERP, CRM, financials, inventory)
  - Low-Code/No-Code (Zoho Creator, Deluge, Flow, Catalyst)
  - Web Application Development
  - Mobile Development (native, cross-platform)
  - Zoho Ecosystem Specialisation
  - Mauritius-Specific Compliance (MRA e-invoicing, VAT, tax automation)
  - Data Governance & Security
  - Third-Party Integrations
  - Analytics & Business Intelligence
  - QA & Testing Services
  - DevOps & Deployment
  - Payment Processing & E-Commerce
  - Communication Tools
  - Security & Compliance
  - Business Continuity & Disaster Recovery
  - Engagement Models (project-based, retainer, staff augmentation)
  - Industry-Specific Solutions (retail, manufacturing, services, healthcare, finance, real estate, education)
  - Technology Stack (languages, frameworks, databases, cloud platforms, tools)

**amyaaz_business_card.pdf** (16KB)
- Two-page professional business card (front/back)
- **Front:**
  - Name: "Amyaaz Aumeer"
  - Title: "Digital Solutions Architect" (green accent)
  - Subtitle: "Enterprise Systems / Web Applications / Mobile / Zoho Platform"
  - Contact: Phone, email, website, LinkedIn
  - Zoho certification badge (understated pill)
  - QR code linking to amyaaz.com
  - Corner accent marks

- **Back:**
  - Tagline: "Your digital solution / to every business / bottleneck." (color-accented)
  - Service pills: Enterprise, Web App, Mobile, Zoho
  - Corner brackets
  - Minimal header

---

## SEO Configuration

### Current Setup
✅ **Sitemap:** Submitted to Google Search Console  
✅ **Robots.txt:** Properly configured to allow all crawlers  
✅ **JSON-LD Schema:** Person schema with structured data  
✅ **Meta Tags:** Complete metadata (title, description, keywords, OG tags)  
✅ **Canonical URL:** https://amyaaz.com  
✅ **Domain:** Custom domain amyaaz.com with Netlify DNS  

### Timeline Expectations
- **Week 1-2:** Google crawls site (discovery phase)
- **Week 2-6:** Site begins appearing in buried results
- **Month 1-3:** Ranking for low-competition queries (branded + niche searches)
- **Month 3-6:** Compounding authority and ranking improvements
- **Month 6+:** Established search visibility for target keywords

---

## Next Steps for Claude Code

### 1. Repository Setup
- Clone/create repo with these files
- Initialize git: `git init`
- Push to GitHub/GitLab for version control

### 2. Local Development
- Set up local testing environment
- Test blob animations at different viewport sizes
- Verify responsive design on mobile/tablet

### 3. Deployment Automation
- Add Netlify CLI integration for one-command deploys
- Create deployment scripts
- Set up branch-based previews if needed

### 4. Enhanced Features (Optional)
- Add actual article content/blog system
- Implement contact form backend
- Add dark/light mode toggle
- Expand project portfolio section
- Add testimonials or case studies

### 5. SEO Monitoring
- Set up Google Analytics
- Track Google Search Console indexing
- Monitor keyword rankings
- Set up performance metrics

### 6. Content Expansion
- Add detailed service pages for enterprise/web/mobile
- Create Zoho expertise showcase
- Add case studies from past projects
- Publish technical articles about Zoho

---

## Netlify Configuration

### Current Status
- **Project Name:** melodic-daffodil-f0d054
- **Published URL:** https://amyaaz.com (custom domain)
- **Last Published:** Jun 14, 2026
- **Deployment Method:** Netlify Drop (drag-and-drop)

### To Update on Netlify
1. Log into Netlify dashboard
2. Go to "Deploys" section
3. Upload updated `index.html` (or zip all files)
4. Site automatically redeploys

### Environment Setup (Optional)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy from CLI
netlify deploy --prod --dir=.

# Watch for changes and auto-deploy
netlify deploy --prod --watch
```

---

## Brand Guidelines

### Visual Identity
- **Primary Color:** Green (#4ade80) - accent, CTAs, highlights
- **Secondary Color:** Purple (#818cf8) - accent, emphasis
- **Tertiary Color:** Pink (#f472b6) - accent, diversity
- **Background:** Dark (#0a0a0f) - premium, focus
- **Text:** Light (#e8e8f0) - readability, contrast

### Voice & Tone
- Professional but approachable
- Technical expertise without jargon overload
- Focused on business value and problem-solving
- Solutions architect mindset (not developer-centric)

### Key Positioning
1. **Primary:** Digital Solutions Architect
2. **Secondary:** Zoho Specialist
3. **Tertiary:** Enterprise Systems Developer
4. **Service Areas:** Enterprise, Web Apps, Mobile, Zoho Platform

---

## Contact & Account Info

**Email:** aumeeramyaaz@gmail.com  
**Phone:** +230 5803 3539  
**LinkedIn:** https://www.linkedin.com/in/amyaaz-aumeer-8b84261b6/  
**GitHub:** https://github.com/amyaaz22  
**YouTube:** https://www.youtube.com/@AmyaazAumeer  

**Zoho Certification:** Zoho Creator Certified Associate Developer

---

## Development Notes

### Key Implementation Details
- Single-page design (no separate pages needed yet)
- CSS-driven animations (no JavaScript required for blobs)
- Fully responsive (tested down to mobile viewport)
- Fast loading (minimal external dependencies)
- SEO-optimized (all meta tags, schema markup)

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-first responsive design
- CSS Grid and Flexbox layout
- CSS animations support required

### Performance
- Total page size: ~80KB (HTML + embedded CSS)
- No external JS frameworks
- Google Fonts loaded asynchronously
- SVG noise background (lightweight)

---

## Recommended Next Actions

1. **Immediate:**
   - Set up GitHub repo with all files
   - Link Claude Code to repo
   - Configure Netlify deploy integration

2. **Short-term (1-2 weeks):**
   - Submit to Google Search Console
   - Add Google Analytics tracking
   - Create content calendar for articles
   - Set up contact form backend

3. **Medium-term (1-3 months):**
   - Publish 3-5 technical articles
   - Build case study library
   - Expand service pages
   - Develop testimonial section

4. **Long-term (3-6+ months):**
   - SEO optimization for target keywords
   - Blog/content marketing strategy
   - Lead generation funnel
   - Email newsletter setup
