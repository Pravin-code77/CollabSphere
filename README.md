# CollabSphere — Context-Aware Skill Matching Platform

CollabSphere is a hackathon MVP designed to connect developers based on verified skills (GitHub) and project needs using a heuristic-based matchmaking engine.

## 🚀 Features Scaffolded
- **Auth System**: Node.js/Express JWT-based authentication.
- **Profiles**: Extended profiles with skills, availability, and GitHub verification.
- **GitHub Integration**: Service to pull languages and repositories to calculate skill confidence.
- **Matchmaking Engine**: Modular service for skill overlap, availability match, and complementary scoring.
- **Real-time Chat**: Socket.io integration for per-project communication.
- **Project Bazaar**: CRUD for projects with skill requirement tagging.

## 🛠 Tech Stack
- **Frontend**: React Native (CLI), TypeScript, Axios, React Context.
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io, JWT.
- **Integrations**: GitHub API.

## 📂 Project Structure
```text
/backend
  /src
    /controllers    # Feature logic (Auth, Projects, etc.)
    /middleware     # JWT & Validation
    /models         # Mongoose Schemas (User, Profile, Project, Message)
    /routes         # API Endpoints
    /services       # Business Logic (Matching Engine, GitHub API)
    /socket         # Socket.io event handlers
    /types          # Shared TS interfaces
/mobile
  /src
    /api            # Axios configuration
    /features       # Feature-based modules (Auth, Projects, Matchmaking)
    /hooks          # Global & feature hooks (useAuth, useProjects)
    /providers      # State context providers
    /types          # Frontend types
```

## ⚙️ Setup & Environment Variables

### Backend
1. `cd backend`
2. Create a `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collabsphere
JWT_SECRET=your_super_secret_key
GITHUB_TOKEN=your_optional_github_personal_token
```
3. `npm install`
4. `npm run dev`

### Mobile
1. `cd mobile`
2. `npm install`
3. Update `src/api/client.ts` with your local IP if testing on a physical device.
4. `npx react-native run-android` or `npx react-native run-ios`

## 🧩 How to Extend

### Adding AI Matchmaking
- Go to `backend/src/services/matching/compatibility.ts`.
- Integrate OpenAI/Langchain in the `computeCompatibility` method.
- Use vector embeddings to compare `Profile.bio` with `Project.description`.

### Adding a New Skill Provider
- Create a new service in `backend/src/services/`.
- Implement a `fetchUserSkills` method.
- Plug it into the `Profile` update logic.

### Real-time Enhancements
- Update `backend/src/index.ts` socket handlers for typing indicators or presence status.

## 🛡 Authorization & Database Security (MongoDB)
Since we are using MongoDB/Express instead of Supabase, we implement "RLS-like" logic at the controller level:
- **Ownership**: Only `ownerId` can edit/delete a project (Check `req.user.id === project.ownerId`).
- **Privacy**: User profiles are public, but contact info (if added) should be restricted to matches.
- **Match-only Chat**: Only users who have been accepted into a project can join the project's socket room.

---
Built for Hackathon MVP - Clean, Modular, and Scalable.
