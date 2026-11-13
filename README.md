# ClientLocker – Secure Document Management Portal

A secure, role-based document management portal developed for **Vaigai Vel & Associates** as part of the **Vizdale Full-Stack Developer Internship**.

## Live Application

[ClientLocker – Vercel](https://client-locker-gules.vercel.app/)

> **Note:** The frontend is deployed on Vercel. The backend currently runs locally during development. The live application requires backend deployment and production API configuration for external login and data access.

## Project Demo Video

Watch the 60-second ClientLocker demonstration:

[**View ClientLocker M2 Demo Video**](https://drive.google.com/file/d/1UJRQ7t9y3Cci7qf9F_2su0NTC1vvT0df/view?usp=sharing)

**Video Access:** Anyone with the link can view.

## Project Overview

ClientLocker is a secure document management portal designed for Vaigai Vel & Associates.

It helps Partners, Staff, and Clients manage client information, documents, and checklist activities through a centralized web application.

The application provides role-based access control to ensure that users can access only the information and features permitted for their roles.

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
1. Open the application.
2. Enter the email and password for the required role.
3. Click Login.
4. Explore the dashboard and role-specific features.
5. Test document upload, document opening, and checklist functionality.

> **Important:** These are sample demonstration credentials. They work only when the backend and corresponding sample database are running and accessible. Do not use these sample credentials for real or sensitive data.

## Features Implemented

### Authentication and Security
- Email and password login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected API routes.
- Role-based authorization.
- Active account verification.

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
- File type and signature validation.
- Secure document opening.
- Role-based document access.
- Private file storage.
- Document metadata stored in MongoDB.

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
| Authentication | JWT, bcrypt |
| API Integration | Axios |
| File Upload | Multer |
| Version Control | Git, GitHub |
| Deployment | Vercel |
| Continuous Integration | GitHub Actions |

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
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   └── index.css
├── server/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Firm.js
│   │   ├── Client.js
│   │   ├── Document.js
│   │   ├── Checklist.js
│   │   └── ActivityLog.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── clientRoutes.js
│   │   ├── staffRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── checklistRoutes.js
│   │   └── activityRoutes.js
│   ├── .gitignore
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── package.json
├── package-lock.json
└── README.md
```

> The `.env` file, `node_modules`, and uploaded documents are excluded from Git for security and storage reasons.

## Sample Database Data

The project includes a seed script to create sample data in MongoDB:

- 1 Firm
- 2 Partners
- 6 Staff Members
- 10 Clients
- 50 Checklist Items

To seed the database:

```bash
cd server
npm run seed
```

> **Warning:** The seed script clears existing Firm, User, Client, and Checklist records before inserting sample data. Do not run it against a database containing records you need to preserve.

## Run the Project Locally

### Prerequisites
- Node.js
- npm
- MongoDB Atlas account

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
JWT_SECRET=your_secret_key
```

Replace the example values with your own MongoDB connection string and a secure JWT secret.

### Step 5: Start the Backend

From the `server` folder:

```bash
npm run dev
```

Backend runs at:

`http://localhost:5000`

### Step 6: Start the Frontend

Open another terminal in the project root:

```bash
npm run dev
```

The frontend runs at the local Vite development URL displayed in the terminal.

## Build the Frontend

To generate the production build, run this command from the project root:

```bash
npm run build
```

## Testing Completed

The following functional tests were successfully completed:

1. Partner, Staff, and Client login verification.
2. Invalid password handling.
3. JWT token authentication.
4. Protected API route verification.
5. Role-based access control testing.
6. Client and staff access verification.
7. Document upload with valid file types.
8. Invalid file type rejection.
9. Maximum 4 MB file size validation.
10. Secure document opening for authorized users.
11. Unauthorized document access rejection.
12. Checklist completion and database persistence.
13. Activity logging verification.
14. Frontend production build verification.

## GitHub Repository

[**ClientLocker – GitHub Repository**](https://github.com/Vishal0504-tech/client-locker)

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
- Functional testing completed.
- M2 source code committed and pushed to GitHub.
- 60-second project demonstration prepared.

## Future Improvements
- Deploy the backend to a production hosting platform.
- Configure the production frontend to use the deployed backend API.
- Implement additional features and improvements as required in future milestones.

## Internship Project Details

**Organization:** Vizdale  
**Project Title:** ClientLocker – Secure Document Management Portal  
**Client:** Vaigai Vel & Associates  
**Milestone:** M2 – Backend Development and Frontend Integration