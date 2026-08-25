# 🦎 Intelligent Iguanas

**Learn • Share • Build • Grow**

Full-stack production community website for **Intelligent Iguanas** featuring a dark futuristic theme, neon green accents, pre-launch countdown guard, dynamic QR code generation, and zero database overhead.

---

## 🔒 Pre-Launch Lock Screen

Until **September 4, 2026 at 00:00 IST**, the site operates under a strict pre-launch lock guard:
- Shows **ONLY** the cinematic pre-launch countdown screen.
- Absolutely **no access** to the main website, navigation, or WhatsApp link before launch date.
- Dynamic IST countdown calculating days, hours, minutes, and seconds.
- Automatically transitions into the full website when the launch date is reached.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Backend**: Node.js + Express 5
- **Styling**: Custom CSS design system (Neon green `#39FF14`, charcoal, dark glassmorphism)
- **QR Code**: Dynamic generation from `WHATSAPP_GROUP_LINK` environment variable
- **Database**: None — intentionally 100% database-free

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- npm 9+

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/intelligent-iguanas.git
cd intelligent-iguanas

# Install dependencies across root, client, and server
npm run install:all
```

### 3. Environment Variables

Create `.env` file from the example template:

```bash
cp .env.example .env
```

Set your configuration:

```env
WHATSAPP_GROUP_LINK=https://chat.whatsapp.com/YOUR_GROUP_INVITE
PORT=5000
```

| Variable | Description | Required |
|----------|-------------|----------|
| `WHATSAPP_GROUP_LINK` | Official WhatsApp Group Invite URL | Yes |
| `PORT` | Backend Express server port | Optional (Default: 5000) |

---

## 💻 Running Development Server

Start both frontend (React/Vite) and backend (Node/Express) concurrently:

```bash
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

*Note: Pass `?launched=true` in the browser URL (e.g. `http://localhost:3000/?launched=true`) to preview the unlocked website during development.*

---

## 📦 Production Build & Run

```bash
# Build the React frontend
npm run build

# Start the Node.js production server
npm start
```

---

## 📂 Project Structure

```
intelligent-iguanas/
├── client/                      # React + Vite frontend
│   ├── public/
│   │   └── logo.png             # Official Intelligent Iguanas logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── CountdownScreen.jsx # Pre-launch lock screen
│   │   │   ├── Navbar.jsx          # Glass navbar with mobile menu
│   │   │   ├── Hero.jsx            # Animated hero section
│   │   │   ├── About.jsx           # 4 core pillar cards
│   │   │   ├── Community.jsx       # 6 feature cards
│   │   │   ├── JoinSection.jsx     # WhatsApp CTA section
│   │   │   ├── QRCode.jsx          # Dynamic QR code generator
│   │   │   ├── Footer.jsx          # Branded footer
│   │   │   └── ParticleBackground.jsx # Canvas particle animation
│   │   ├── hooks/
│   │   │   └── useScrollReveal.js # Scroll animation hook
│   │   ├── utils/
│   │   │   └── launchConfig.js    # Launch date configuration & math
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── index.js                 # Express API server
│   └── package.json
├── .env.example
├── .gitignore
├── package.json                 # Monorepo scripts
└── README.md
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | API health status check |
| `GET` | `/api/config` | Returns launch status & public configuration |

---

## 🔒 Security & Privacy

- `.env` files are strictly ignored by Git and never committed.
- Backend protects `WHATSAPP_GROUP_LINK` so it is not sent to clients prior to official launch.

---

## 📜 License

Built by the **Intelligent Iguanas** community.
