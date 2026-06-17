# ⚡ Vercodex — Real-Time Collaborative Code Editor

Vercodex is a high-performance live collaborative code editor built for real-time development, pair programming, and learning environments. It leverages **CRDT (Yjs)** to enable conflict-free collaboration, instant synchronization, and reliable offline-first editing.

🔗 **Live Demo:** [real-time-code-editor-vercodex.vercel.app](https://real-time-code-editor-vercodex.vercel.app)

---

## Why Vercodex?

Unlike traditional socket-based editors, Vercodex uses **Yjs (CRDT)** under the hood — which means:

- ✅ No merge conflicts between users
- ✅ Offline editing with automatic sync on reconnect
- ✅ Consistent document state across all clients
- ✅ Low-latency real-time collaboration

This makes it highly reliable for pair programming and live coding sessions.

---

## Features

- ⚡ Real-time collaborative code editing
- 🧠 CRDT-based sync using Yjs (conflict-free)
- 💾 Auto-save with persistent document state
- 👥 Multi-user live collaboration
- 👀 Live presence awareness inside editor
- 🔐 JWT authentication
- 📧 Email notifications via Google API
- 📂 Workspace / project-based structure
- 💬 Chat among room members
- 🤖 AI-based optimization, chatbot and inline suggestion

---

## Tech Stack

**Frontend**

- React.js, Tailwind CSS, React Router
- Yjs (CRDT), Socket.IO Client, Axios

**Backend**

- Node.js, Express.js
- MongoDB with Mongoose
- Socket.IO, JWT Authentication
- Google API (email sending)

**Deployment**

- Frontend → Vercel
- Backend → Render

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- MongoDB (Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/harit-adesara/Real-Time-Code-Editor---Vercodex.git
cd Real-Time-Code-Editor---Vercodex
```

### 2. Install dependencies

```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `Backend/` folder:

```env
PORT=3000
MONGO_URL=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
FORGOT_PASSWORD_REDIRECT_URL=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GMAIL_USER=
```

### 4. Run the project

```bash
# Start backend
cd Backend
npm run dev

# Start frontend (new terminal)
cd Frontend
npm run dev
```

Frontend runs at `http://localhost:5173`  
Backend runs at `http://localhost:3000`

---

## Project Structure

```
Real-Time-Code-Editor---Vercodex/
├── Frontend/          # React.js client (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ProtectedRoutes/
│       ├── context
│       └── socket.js
│       ├── editor/
│       └── socket.js
│       ├── main.jsx
│       └── socket.js
|
└── Backend/           # Node.js + Express API
    ├── routes/
    ├── models/
    ├── middleware/
    └── utils
    ├── controllers/
    └── db/
    ├── validator/
    ├── socket
    └── app.js
    └── index.js
```

---

## Contributing

1. Fork the repository
2. Create a new branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

---

## License

MIT License — feel free to use, modify, and distribute.

---

Made with ❤️ by [Harit Adesara](https://github.com/harit-adesara)
