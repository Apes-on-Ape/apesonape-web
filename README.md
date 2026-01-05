# Apes On Ape

The official website for the Apes On Ape NFT collection on Apechain. A playground for musicians, artists, game devs, and builders.

**Make weird. Make loud. Make games. Ape together.**

## 🌟 Features

- **Dynamic NFT Gallery**: Customizable 8×4 grid (adjustable from 4×2 to 12×6) with live Magic Eden integration
- **Collection Explorer**: Advanced filtering, sorting, and infinite scroll
- **Sound Studio**: Monthly spotlights and continuous radio streaming from SoundCloud
- **Community Hub**: Sections for musicians, artists, game devs, and builders
- **Modern Design**: Editorial dark theme with neon accents and kinetic motion
- **Fully Accessible**: Keyboard navigation, reduced motion support, and ARIA labels

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/apesonape-web.git
cd apesonape-web

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm start
```

The static export will be generated in the `/docs` directory.

## 📁 Project Structure

```
apesonape-web/
├── app/
│   ├── api/              # API routes (Magic Eden, SoundCloud proxies)
│   ├── components/       # Shared React components
│   ├── collection/       # Collection page
│   ├── sound/            # Sound studio page
│   ├── page.tsx          # Home page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/                  # Utility libraries
│   └── magic-eden.ts     # Magic Eden API integration
├── public/               # Static assets
├── UPGRADE_NOTES.md      # Detailed upgrade documentation
└── next.config.ts        # Next.js configuration
```

## 🎨 Design System

### Typography
- **Display**: Playfair Display (serif) - Headings
- **Body**: Inter (sans-serif) - Body text
- **Mono**: Courier Prime - Code/addresses

### Colors
- **Charcoal**: `#1a1a1a` - Background
- **Off-White**: `#f8f8f8` - Text
- **Neon Cyan**: `#00fff5` - Primary accent
- **Neon Green**: `#39ff14` - Secondary accent
- **Ape Gold**: `#FFD700` - Highlights

## 🔗 Important Links

- **Website**: [apesonape.io](https://apesonape.io)
- **Discord**: [Join our community](https://discord.gg/gVmqW6SExU)
- **X (Twitter)**: [@apesonape](https://x.com/apesonape)
- **Magic Eden**: [View Collection](https://magiceden.us/collections/apechain/0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0)
- **SoundCloud**: [Listen to our tracks](https://soundcloud.com/apesonape)
- **Arcade**: [Play games](https://arcade.apesonape.io)

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **React**: 19.0
- **TypeScript**: 5+
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/)
- **Blockchain**: Apechain
- **NFT Marketplace**: Magic Eden

## 📚 Documentation

- **[UPGRADE_NOTES.md](./UPGRADE_NOTES.md)** - Comprehensive upgrade documentation
  - Design system details
  - Component architecture
  - API routes and caching
  - Environment variables
  - Updating monthly spotlight
  - Accessibility features
  - Performance optimizations

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```bash
# Magic Eden
NEXT_PUBLIC_ME_COLLECTION=0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0

# SoundCloud
SOUNDCLOUD_USER_URL=https://soundcloud.com/apesonape
SOUNDCLOUD_CLIENT_ID=your_client_id

# Site
NEXT_PUBLIC_SITE_URL=https://apesonape.io
```

See `.env.local.example` for all available variables.

### Updating the Monthly Spotlight

Edit `/app/api/soundcloud/tracks/route.ts` to update the featured track. See [UPGRADE_NOTES.md](./UPGRADE_NOTES.md#updating-monthly-spotlight) for detailed instructions.

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Other Platforms
The site generates a static export compatible with any static hosting:
- GitHub Pages
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is part of the Apes On Ape NFT collection on Apechain.

## 🙏 Acknowledgments

- The Apes On Ape community
- Apechain ecosystem
- Magic Eden for NFT marketplace integration
- All our musicians, artists, game devs, and builders

---

**Built with ❤️ for the apes, by the apes**

Need help? Join our [Discord](https://discord.gg/gVmqW6SExU)
