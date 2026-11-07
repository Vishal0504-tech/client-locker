# ClientLocker

**Secure Document Management Portal**

## Live Application
https://client-locker-gules.vercel.app/

## Project Overview
ClientLocker is a document management portal designed for Vaigai Vel & Associates. It aims to provide secure and organized document management for Partners, Staff, Clients and Auditors.

## Current Features
- Login interface with frontend validation
- Dashboard overview
- Documents section
- Clients section
- Staff section
- Recent activities
- Logout navigation

## Technology Stack
- Frontend: React.js, Vite, CSS
- Version Control: Git and GitHub
- Deployment: Vercel
- Continuous Integration: GitHub Actions

## Project Structure
```text
client-locker/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   └── PLAN.pdf
├── public/
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── index.css
├── package.json
└── README.md
```

## Run Locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Current Status
Milestone 1 – Planning and Setup

- React application created
- Initial login and dashboard UI completed
- GitHub repository configured
- GitHub Actions build check passed
- Frontend deployed using Vercel

**Note:** Authentication is currently frontend-only. Backend, database and real authentication will be implemented in later milestones.

