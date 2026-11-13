# ClientLocker – Secure Document Management Portal

A secure, role-based document management portal developed for **Vaigai Vel & Associates** as part of the **Vizdale Full-Stack Developer Internship**.

## Live Application

**Frontend:** [ClientLocker – Vercel](https://client-locker-gules.vercel.app/)

**Backend API:** https://client-locker.onrender.com

**GitHub Repository:** [ClientLocker – GitHub](https://github.com/Vishal0504-tech/client-locker)

## Project Demo Video

Watch the 60-second ClientLocker demonstration:

[**View ClientLocker M2 Demo Video**](https://drive.google.com/file/d/1UJRQ7t9y3Cci7qf9F_2su0NTC1vvT0df/view?usp=sharing)

**Video Access:** Anyone with the link can view.

## Project Overview

ClientLocker is a secure document management portal designed for Vaigai Vel & Associates.

It helps Partners, Staff, and Clients manage client information, documents, and checklist activities through a centralized web application.

The application provides role-based access control to ensure users can access only the information and features permitted for their roles.

It uses MongoDB Atlas for database management and Supabase Storage for secure cloud-based document storage.

## User Roles and Permissions

### 1. Partner

- View firm dashboard and statistics.
- View all registered clients and staff members.
- Access firm documents and checklist tasks.
- View recent activity logs.
- Manage and monitor firm-level information.

### 2. Staff

- View assigned clients.
- Access documents belonging to assigned clients.
- View and update assigned checklist tasks.
- Access role-specific dashboard information.

### 3. Client

- View their own profile.
- Upload and access their own documents.
- View and update their checklist tasks.
- Access their own dashboard information.

## Demo Login Credentials

The following sample accounts are available for application testing.

| Role | Email | Password |
|---|---|---|
| Partner | partner1@clientlocker.com | Partner@123 |
| Staff | staff1@clientlocker.com | Staff@123 |
| Client | ramesh@example.com | Client@123 |

### Testing Instructions

1. Open the live application.
2. Enter the email and password for the required role.
3. Click Login.
4. Explore the role-specific dashboard.
5. Test document upload and opening.
6. Test client and staff access permissions.
7. Test checklist functionality.

> **Important:** These are sample demonstration credentials. They are intended only for project evaluation and testing. Do not use them for real or sensitive data.

## Features Implemented

### Authentication and Security

- Email and password login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected API routes.
- Role-based authorization.
- Active account verification.
- Secure access to documents.
- Unauthorized document access prevention.

### Dashboard

- Role-specific dashboard information.
- Client, staff, document, and checklist statistics.
- Dynamic dashboard data from backend APIs.

### Client Management

- View client information.
- Display assigned staff details.
- Role-based client access.

### Staff Management

- Partner-only staff listing.
- Display staff names, email addresses, and designations.
- Role-based access restrictions.

### Document Management

- Upload PDF, JPG, and PNG files.
- Maximum file size of 4 MB.
- File type and file signature validation.
- Secure document opening.
- Role-based document access.
- Private cloud file storage using Supabase.
- Document metadata stored in MongoDB Atlas.
- Secure file upload and retrieval through the backend.

### Checklist Management

- Display checklist tasks based on user role.
- Mark tasks as completed.
- Save completion status in MongoDB.
- Restrict checklist updates according to user permissions.

### Activity Logging

- Record user login activities.
- Record document upload activities.
- Record document opening activities.
- Partner-only activity log access.

## Technology Stack

| Category | Technology |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Cloud File Storage | Supabase Storage |
| Authentication | JWT, bcrypt |
| API Integration | Axios |
| File Upload | Multer |
| Version Control | Git, GitHub |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Continuous Integration | GitHub Actions |

## Application Architecture

ClientLocker uses a separated frontend, backend, database, and cloud storage architecture.

```text
                 USER
                   |
                   v
          React.js Frontend
                Vercel
                   |
                   v
          Node.js + Express
                Render
                   |
          +--------+--------+
          |                 |
          v                 v
      MongoDB Atlas     Supabase Storage
      Database          Private Bucket
          |                 |
          v                 v
    User Information    Actual Documents
    Client Details      PDF / JPG / PNG
    Document Metadata
    Checklist Data
    Activity Logs
```

### Storage Explanation

- **MongoDB Atlas:** Stores user details, client information, document metadata, checklist records, and activity logs.
- **Supabase Storage:** Stores the actual uploaded PDF, JPG, and PNG files.
- **Render:** Hosts the backend API and handles authentication, authorization, document uploads, and secure document retrieval.
- **Vercel:** Hosts the React frontend.

The Supabase bucket `clientlocker-documents` is configured as a private bucket. Files are accessed through the authenticated backend rather than public file links.

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
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   └── index.css
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
│   │   ├── User.js
│   │   ├── Firm.js
│   │   ├── Client.js
│   │   ├── Document.js
│   │   ├── Checklist.js
│   │   └── ActivityLog.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── clientRoutes.js
│   │   ├── staffRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── checklistRoutes.js
│   │   └── activityRoutes.js
│   │
│   ├── .gitignore
│   ├── package.json
│   ├── seed.js
│   └── server.js
│
├── package.json
├── package-lock.json
└── README.md
```

> The `.env` file, `node_modules`, and local uploaded files are excluded from Git for security and storage reasons.

## Sample Database Data

The project includes a seed script to create sample data in MongoDB:

- 1 Firm
- 2 Partners
- 6 Staff Members
- 10 Clients
- 50 Checklist Items

### To Seed the Database

```bash
cd server
npm install
npm run seed
```

> **Warning:** The seed script clears existing Firm, User, Client, and Checklist records before inserting sample data. Do not run it against a database containing records you need to preserve.

## Run the Project Locally

### Prerequisites

- Node.js
- npm
- MongoDB Atlas account
- Supabase account

### Step 1: Clone the Repository

```bash
git clone https://github.com/Vishal0504-tech/client-locker.git
cd client-locker
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

### Step 3: Install Backend Dependencies

```bash
cd server
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file inside the `server` folder.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_key
```

Replace the example values with your own credentials.

**Important Security Notes:**

- Never share your `.env` file.
- Never upload secret keys to GitHub.
- Keep the Supabase service role key on the backend only.
- Use a private Supabase storage bucket.

### Step 5: Start the Backend

From the `server` folder:

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

### Step 6: Start the Frontend

Open another terminal in the project root:

```bash
npm run dev
```

The frontend runs at the local Vite development URL displayed in the terminal.

For local development, configure the frontend API base URL in `src/services/api.js` to:

```text
http://localhost:5000/api
```

For production deployment, use:

```text
https://client-locker.onrender.com/api
```

## Build the Frontend

To generate the production build, run this command from the project root:

```bash
npm run build
```

## Deployment Configuration

### Frontend – Vercel

- Frontend deployed using Vercel.
- Connected to the GitHub repository.
- Production frontend URL: https://client-locker-gules.vercel.app/

### Backend – Render

- Node.js and Express backend deployed using Render.
- Backend URL: https://client-locker.onrender.com
- Backend environment variables configured in Render.

### Database – MongoDB Atlas

- Stores application data and document metadata.
- Connected securely through the backend environment variables.

### Cloud Storage – Supabase

- Project: ClientLocker.
- Bucket: `clientlocker-documents`.
- Bucket access: Private.
- Stores actual uploaded documents.
- Backend uses the Supabase service role key through environment variables.

## Testing Completed

The following functional and security tests were successfully completed.

### Authentication Testing

1. Partner login verification.
2. Staff login verification.
3. Client login verification.
4. Invalid password handling.
5. JWT token authentication.
6. Missing or invalid token verification.

### Role-Based Access Testing

7. Partner access verification.
8. Staff assigned-client access verification.
9. Client own-profile access verification.
10. Protected API route verification.
11. Unauthorized role access rejection.

### Document Management Testing

12. Valid PDF upload.
13. JPG and PNG file validation.
14. Invalid file type rejection.
15. Maximum 4 MB file size validation.
16. Document metadata storage in MongoDB.
17. Actual document storage in Supabase.
18. Secure document opening.
19. Production document upload and opening verification.

### Security Testing

20. Staff attempting to open another client's document.
21. Client attempting to open another client's document.
22. Unauthorized document ID access verification.

**Security Test Results:**

| Security Test | Expected Result | Actual Result |
|---|---|---|
| Staff opens assigned client's document | Allowed | Successful |
| Staff opens another client's document | Blocked | HTTP 404 |
| Client opens own document | Allowed | Successful |
| Client opens another client's document | Blocked | HTTP 404 |

The unauthorized access tests confirmed that changing the document ID does not allow Staff or Client users to access another client's documents.

### Other Testing

23. Checklist completion and database persistence.
24. Activity logging verification.
25. Frontend production build verification.
26. Local backend and Supabase integration testing.
27. Live Vercel and Render deployment testing.

## Current Project Status

### Milestone 1 – Planning and Setup

- Project planning completed.
- React application setup completed.
- Initial login and dashboard UI developed.
- GitHub repository configured.
- GitHub Actions build check passed.
- Frontend deployed using Vercel.

### Milestone 2 – Backend Development and Frontend Integration

- Node.js and Express backend implemented.
- MongoDB Atlas database connected.
- Database models and sample data created.
- JWT authentication and role-based authorization implemented.
- Dashboard, Clients, Staff, Documents, Checklist, and Activity APIs developed.
- Frontend integrated with backend APIs.
- Document upload and secure opening implemented.
- Supabase cloud storage integration completed.
- Document metadata stored in MongoDB and actual files stored in Supabase.
- Production backend deployed using Render.
- Frontend deployed using Vercel.
- Functional and security testing completed.
- Unauthorized document access prevention verified.
- M2 source code committed and pushed to GitHub.
- 60-second project demonstration prepared.

<badge>Milestone 2 Completed</badge>

## Future Improvements

- Add email notifications for document uploads and checklist updates.
- Implement document version management.
- Add advanced document search and filtering.
- Improve dashboard analytics and reporting.
- Add password reset functionality.
- Introduce additional security monitoring and audit features.

## Internship Project Details

**Organization:** Vizdale  
**Project Title:** ClientLocker – Secure Document Management Portal  
**Client:** Vaigai Vel & Associates  
**Internship Role:** Full-Stack Developer Intern  
**Milestone:** M2 – Backend Development and Frontend Integration

---

**Developed as part of the Vizdale Full-Stack Developer Internship.**