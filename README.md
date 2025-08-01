# 🌐 PeerShare

A modern, secure peer-to-peer file sharing and video calling application built with Next.js and WebRTC technology. Share files instantly and make HD video calls without any servers storing your data.

![PeerShareImage](https://peershare.avikmukherjee.me/og-image.png)

![PeerShare Demo](https://img.shields.io/badge/Status-Active-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black) ![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)

## ✨ Features

### 🔄 **Peer-to-Peer File Sharing**
- **Instant file transfer** - Share files of any size directly between devices
- **No file size limits** - Transfer large files without server restrictions
- **Automatic downloads** - Files are automatically downloaded when received
- **Real-time progress** - See file transfer status in real-time

### 📹 **HD Video Calling**
- **High-quality video calls** - Crystal clear video communication
- **Audio/Video controls** - Toggle camera and microphone on/off
- **Responsive interface** - Works seamlessly on desktop and mobile
- **Caller identification** - See who's calling with user names

### 💬 **Real-time Chat**
- **Instant messaging** - Send messages in real-time during connections
- **Message history** - Keep track of your conversation
- **File sharing notifications** - Get notified when files are shared
- **Beautiful UI** - Modern, gradient-based chat interface

### 🔒 **Security & Privacy**
- **End-to-end encrypted** - All communications are encrypted
- **No server storage** - Files never touch our servers
- **Direct peer connections** - Data flows directly between devices
- **Session-based** - Connection codes expire when you refresh

### 📱 **Social Features**
- **Twitter sharing** - Share your PeerShare experience on Twitter
- **Success celebrations** - Share successful file transfers with friends
- **Social promotion** - Help spread the word about secure P2P sharing

## 🚀 Technologies Used

- **[Next.js 15.4.5](https://nextjs.org/)** - React framework for production
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[PeerJS](https://peerjs.com/)** - WebRTC peer-to-peer connections
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible UI components
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[Lucide React](https://lucide.dev/)** - Beautiful SVG icons

## 🏃‍♂️ Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm**, **yarn**, **pnpm**, or **bun**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/peershare.git
   cd peershare
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see PeerShare in action!

   Or visit the live demo at [peershare.avikmukherjee.me](https://peershare.avikmukherjee.me)

## 📖 How to Use

### 🔗 **Connecting with Someone**

1. **Enter your name** when you first visit the app
2. **Share your connection code** - Copy the unique code displayed on your screen
3. **Connect to others** - Enter someone else's connection code to connect
4. **Start sharing!** - Once connected, you can chat, share files, and make video calls

### 📁 **Sharing Files**

1. Click the **"Share File"** button
2. Select any file from your device
3. The file will be instantly sent to the connected person
4. They'll receive a notification and the file will download automatically

### 📹 **Making Video Calls**

1. Click **"Start Video Call"** to initiate a call
2. The other person will see an incoming call notification with your name
3. They can **Accept** or **Decline** the call
4. During the call, you can:
   - Toggle your camera on/off
   - Mute/unmute your microphone
   - End the call anytime

### 💬 **Chatting**

- Type messages in the chat box and press **Enter** to send
- See real-time message history
- Get notifications when files are shared
- All messages are displayed with timestamps and sender names
- Share your experience on Twitter with built-in social features

## 📁 Project Structure

```
fileshare/
├── src/
│   ├── app/
│   │   ├── chat/
│   │   │   └── page.tsx          # Main chat application
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page
│   ├── components/
│   │   └── ui/                   # Reusable UI components
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── scroll-area.tsx
│   │       ├── separator.tsx
│   │       └── sonner.tsx
│   └── lib/
│       └── utils.ts              # Utility functions
├── public/                       # Static assets
├── package.json                  # Dependencies and scripts
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── next.config.ts               # Next.js configuration
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## 🌍 Deployment

### Deploy on Vercel (Recommended)

The easiest way to deploy PeerShare is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with one click!

**Live Example**: [peershare.avikmukherjee.me](https://peershare.avikmukherjee.me) (deployed on Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/peershare)

### Deploy on Netlify

1. Build the project: `npm run build`
2. Deploy the `out/` folder to Netlify

### Self-Hosting

1. Build the project: `npm run build`
2. Start the server: `npm run start`
3. Access at `http://localhost:3000`

## 🛠️ Customization

### Themes and Colors

The app uses Tailwind CSS with a custom color scheme. You can modify colors in:
- `tailwind.config.js` - Global theme configuration
- `src/app/globals.css` - CSS custom properties

### UI Components

All UI components are built with Radix UI and can be customized in the `src/components/ui/` directory.

## 🐛 Troubleshooting

### Common Issues

**Connection fails:**
- Check if both users are on the same network type (both on WiFi or both on mobile data works better)
- Try refreshing the page to get new connection codes
- Ensure both browsers support WebRTC (most modern browsers do)

**Video call not working:**
- Grant camera and microphone permissions when prompted
- Check if other applications are using your camera
- Try using a different browser (Chrome/Firefox recommended)

**Files not downloading:**
- Check browser download settings
- Ensure pop-ups are allowed for the site
- Try with a smaller file first

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add TypeScript types for new features
- Test your changes thoroughly
- Update documentation as needed

## 🙏 Acknowledgments

- **[PeerJS](https://peerjs.com/)** for making WebRTC simple
- **[Vercel](https://vercel.com/)** for the amazing Next.js framework
- **[Radix UI](https://www.radix-ui.com/)** for accessible components
- **[Tailwind CSS](https://tailwindcss.com/)** for rapid styling

## 📞 Support

If you have any questions or run into issues:

- 🌐 [Try the live demo](https://peershare.avikmukherjee.me)
- 🐛 [Report a bug](https://github.com/yourusername/peershare/issues)
- 💡 [Request a feature](https://github.com/yourusername/peershare/issues)
- 💬 [Join discussions](https://github.com/yourusername/peershare/discussions)
- 🐦 [Follow on Twitter](https://twitter.com/avikmukherjee) for updates

---

<div align="center">
  <strong>Made with ❤️ for secure, private file sharing</strong>
  <br>
  <em>No servers. No tracking. Just pure peer-to-peer connection.</em>
  <br><br>
  <a href="https://peershare.avikmukherjee.me">🌐 Try PeerShare Now</a> |
  <a href="https://twitter.com/intent/tweet?text=🚀%20Check%20out%20PeerShare%20-%20secure%20P2P%20file%20sharing%20%26%20video%20calls!%20No%20servers,%20no%20tracking,%20just%20pure%20peer-to-peer%20magic!%20🔒✨&url=https://peershare.avikmukherjee.me&hashtags=PeerShare,Privacy,P2P,SecureSharing">🐦 Share on Twitter</a>
</div>
