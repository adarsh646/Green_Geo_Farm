# Repository Guidelines

## Project Structure & Module Organization
This is a full-stack MERN application (MongoDB, Express, React, Node.js) organized into `backend` and `frontend` directories.

- **backend/**: Express.js server using Mongoose for MongoDB.
  - `models/`: Mongoose schemas (Cattle, CattleRecord, User).
  - `routes/`: Express API endpoints organized by resource.
  - `uploads/`: Local storage for uploaded cattle images (served via `/uploads`).
  - `server.js`: Application entry point and middleware configuration.
- **frontend/**: React application bootstrapped with Vite.
  - `src/pages/`: Main view components (Dashboard, CattleManagement, Reports, etc.).
  - `src/components/`: Reusable UI components.
  - `src/assets/`: Static images and logos.
  - Uses `react-router-dom` for navigation and `recharts` for data visualization.

## Build, Test, and Development Commands
The root `package.json` manages both services concurrently.

### Root Commands
- **Install all dependencies**: `npm run install-all`
- **Start both backend & frontend**: `npm run dev`

### Frontend Commands (in `/frontend`)
- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Lint code**: `npm run lint`

### Backend Commands (in `/backend`)
- **Start server (node)**: `npm start`
- **Start with auto-reload (nodemon)**: `npm run dev`

## Coding Style & Naming Conventions
- **Frontend**: React components use `.jsx` extension. Styles are typically organized into individual `.css` files per page (e.g., `Dashboard.jsx` and `Dashboard.css`).
- **Backend**: Uses CommonJS modules (`require`). Models and routes are named using camelCase (e.g., `cattleRoutes.js`, `CattleRecord.js`).
- **Authentication**: JWT-based auth implemented in `authRoutes.js` and `userRoutes.js`.

## Testing Guidelines
Currently, no test suite is configured. `npm test` in all directories returns a placeholder error.
