# ClientLocker – Secure Document Management Portal

A secure, role-based document management platform developed for **Vaigai Vel & Associates** as part of the **Vizdale Full-Stack Developer Internship**.

ClientLocker helps firms manage clients, staff, documents, checklists, and access permissions through a centralized web application.

## Project Links

- **Live Application:** https://client-locker-gules.vercel.app/
- **Backend API:** https://client-locker.onrender.com
- **GitHub Repository:** https://github.com/Vishal0504-tech/client-locker

## Demo Videos

- **Milestone 2 – Application Workflow:** https://drive.google.com/file/d/1UJRQ7t9y3Cci7qf9F_2su0NTC1vvT0df/view?usp=sharing
- **Milestone 3 – AI Checklist Suggestion Demo:** https://drive.google.com/file/d/13vxZRjkGU5zzJaxGiy0BOByXVi90Xw5q/view?usp=sharing

## About the Project

ClientLocker is designed to simplify document management and improve secure collaboration between partners, staff members, clients, and auditors.

The application provides role-based access control so that each user can access only the information and operations permitted for their role.

The third milestone extends the application with advanced access restrictions, auditor access, secure document downloads, client Magic Link authentication, and AI-powered checklist suggestions.

## User Roles

| Role | Permissions |
|---|---|
| Partner | Manage clients, staff, documents, checklists, and firm activities |
| Staff | Access assigned clients and manage permitted document and checklist operations |
| Client | Access their own dashboard and permitted documents |
| Auditor | View-only access to authorized information |

## Main Features

### 1. Authentication and Authorization
- Secure login using JWT authentication.
- Password hashing using bcrypt.
- Role-based access control.
- Protected backend API routes.
- Separate permissions for Partner, Staff, Client, and Auditor roles.

### 2. Dashboard
- Overview of documents, clients, staff, and pending tasks.
- Role-specific dashboard information.
- Recent activity information.

### 3. Client Management
- View and manage client records.
- Assign clients to staff members.
- Restrict staff access to assigned clients.
- Ensure clients can access only their own information.

### 4. Staff Management
- View staff information.
- Manage staff access.
- Control which clients staff members can access.

### 5. Document Management
- Upload client documents.
- Store files using private Supabase Storage.
- Open authorized documents securely.
- Restrict document access based on user roles and permissions.

### 6. Checklist Management
- Display client-specific checklist items.
- Track pending and completed tasks.
- Update checklist status based on permissions.

### 7. Client Magic Link Authentication
- Support passwordless client login using email Magic Links.
- Generate time-limited authentication links.
- Validate Magic Link tokens before login.
- Redirect authenticated clients to their respective dashboards.

### 8. Secure Download Links
- Generate expiring document download links.
- Restrict access to authorized users.
- Validate download link expiry before allowing access.

### 9. Auditor Role
- Introduced a separate Auditor role.
- Provides view-only access to authorized records.
- Prevents unauthorized modification of application data.

### 10. Activity Logging and Access Management
- Record important user activities.
- Track document-related actions.
- Support access removal.
- Maintain activity records for monitoring user operations.

### 11. AI-Powered Checklist Suggestions
- Integrated Google Gemini AI for document-based checklist suggestions.
- Analyze uploaded documents.
- Generate relevant checklist suggestions based on document content.
- Help users identify checklist items that may be required for a document.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| File Storage | Supabase Storage |
| Authentication | JWT, bcrypt |
| AI Integration | Google Gemini API |
| Email Integration | Resend |
| API Communication | Axios |
| File Upload | Multer |
| Testing | Jest, Supertest |
| Version Control | Git, GitHub |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| CI/CD | GitHub Actions |

## System Architecture

```text
                 USER
                   |
                   v
         React + Vite Frontend
               (Vercel)
                   |
                   v
           Express REST API
               (Render)
                   |
          +--------+--------+
          |        |        |
          v        v        v
       MongoDB  Supabase  Gemini AI
       Atlas    Storage   API
          |        |
          v        v
      Application Private
         Data     Documents

                   |
                   v
                Resend
             Email Service
```

## Project Structure

```text
client-locker/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docs/
│   └── PLAN.pdf
│
├── public/
│
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── server/
│   ├── config/
│   │   ├── db.js
│   │   └── supabase.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── models/
│   │   ├── ActivityLog.js
│   │   ├── Checklist.js
│   │   ├── Client.js
│   │   ├── Document.js
│   │   ├── Firm.js
│   │   ├── MagicLink.js
│   │   ├── SecureDownload.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── activityRoutes.js
│   │   ├── auditorRoutes.js
│   │   ├── authRoutes.js
│   │   ├── checklistRoutes.backup.js
│   │   ├── checklistRoutes.js
│   │   ├── clientRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── documentRoutes.js
│   │   └── staffRoutes.js
│   │
│   ├── scripts/
│   │   └── expireTestDownload.js
│   │
│   ├── services/
│   │   └── aiChecklistService.js
│   │
│   ├── tests/
│   │   ├── app.test.js
│   │   └── setup.js
│   │
│   ├── uploads/
│   │
│   ├── utils/
│   │   ├── magicLinkUtils.js
│   │   └── secureDownloadUtils.js
│   │
│   ├── app.js
│   ├── seed.js
│   ├── server.js
│   ├── package.json
│   └── .gitignore
│
├── package.json
├── package-lock.json
├── vercel.json
└── README.md
```

*Note: The project structure excludes node_modules and dependency files. The uploads folder contains uploaded demonstration documents.*

## Demo Login Credentials

The following are sample accounts created for application demonstration.

| Role | Email | Password |
|---|---|---|
| Partner | partner1@clientlocker.com | Partner@123 |
| Staff | staff1@clientlocker.com | Staff@123 |
| Client | ramesh@example.com | Client@123 |

Client accounts using Magic Link authentication should follow the email login flow.

**Note:** These are demonstration credentials. Do not use real client information or production passwords in this repository.

## Database and Sample Data

The seed script is used to populate the application with sample records.

The existing sample dataset includes:

- 1 firm
- 2 partners
- 6 staff members
- 10 clients
- 50 checklist items

The seed script should be used carefully because it may clear and recreate existing sample records.

## Installation and Local Setup

### Prerequisites

- Node.js and npm
- MongoDB Atlas account or MongoDB connection
- Supabase project
- Gemini API key
- Resend account for email integration

### 1. Clone the Repository

```bash
git clone https://github.com/Vishal0504-tech/client-locker.git
cd client-locker
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the server directory and configure the required values according to the environment variable names used in the application.

Typical configuration includes:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GEMINI_API_KEY=your_gemini_api_key

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=ClientLocker <onboarding@resend.dev>
MAGIC_LINK_TEST_EMAIL=your_verified_test_email
```

**Important:** Keep all API keys, database credentials, and secret values inside environment variables. Never commit `.env` files to GitHub. Verify the exact variable names against the current backend source code before running the application.

### 5. Start the Backend

```bash
cd server
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 6. Start the Frontend

Open another terminal:

```bash
cd client-locker
npm run dev
```

The frontend runs on the local Vite development URL displayed in the terminal.

## Automated Testing

The project includes automated backend tests using Jest and Supertest.

The tests are intended to verify application routes, authentication, access permissions, and important backend functionality.

The Milestone 3 testing requirement includes at least 10 automated tests.

The test files are located in:

```text
server/
└── tests/
    ├── app.test.js
    └── setup.js
```

Run the backend tests using the test script configured in `server/package.json`:

```bash
npm test
```

## Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| File Storage | Supabase Storage |
| AI Service | Google Gemini API |
| Email Service | Resend |
| CI/CD | GitHub Actions |

The frontend communicates with the deployed Express backend through API requests.

## Milestone Progress

| Milestone | Work |
|---|---|
| M1 | Initial application setup, first page deployment, project planning, and basic workflow |
| M2 | Backend integration, role-based login, client and staff management, document upload, and dashboard |
| M3 | Advanced access control, Magic Link login, secure download links, Auditor role, activity tracking, and AI checklist suggestions |
| M4 | Final improvements, performance optimization, documentation, and final demonstration |

## Future Enhancements

- Improve document search and filtering.
- Add more AI-assisted document management features.
- Improve notification and reminder functionality.
- Enhance application performance and accessibility.
- Add further reporting and analytics features.

## Internship Project Information

**Project Name:** ClientLocker – Secure Document Management Portal

**Organization:** Vizdale

**Client:** Vaigai Vel & Associates

**Internship Role:** Full-Stack Developer Intern

**Repository:** https://github.com/Vishal0504-tech/client-locker

 

 