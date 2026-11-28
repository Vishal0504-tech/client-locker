# ClientLocker – Secure Document Management Portal

ClientLocker is a secure document management and client management platform designed for accounting firms to manage clients, staff, documents and checklist tasks in one place.

**Live link:** https://client-locker-gules.vercel.app/

**Backend link:** https://client-locker.onrender.com

**GitHub repository:** https://github.com/Vishal0504-tech/client-locker

## Recordings

- **M2 – 60-second working flow:** [Watch video](https://drive.google.com/file/d/1UJRQ7t9y3Cci7qf9F_2su0NTC1vvT0df/view?usp=sharing)
- **M3 – AI feature demonstration:** [Watch video](https://drive.google.com/file/d/13vxZRjkGU5zzJaxGiy0BOByXVi90Xw5q/view?usp=sharing)
- **M4 – 2-minute final demonstration:** [[Watch Video](https://drive.google.com/file/d/1kjRYThsEs2W_g4o01hY_UHA8tn25Z6p2/view?usp=sharing)]

All recordings are shared through Google Drive with anyone-with-the-link viewer access.

## Test logins

The application supports three roles:

| Role | Email | Password |
|---|---|---|
| Partner | Add fictional demo email | Add demo password |
| Staff | Add fictional demo email | Add demo password |
| Client | Add fictional demo email | Add demo password |

Only dedicated made-up demonstration accounts should be published here. Do not publish real user credentials or passwords.

## What it does

The five main things users can do:

1. **Dashboard Management:** View important information such as total documents, clients, staff and pending tasks.
2. **Client Management:** Add, view and update client information.
3. **Staff Management:** Manage staff accounts and invite staff members.
4. **Document Management:** Upload, store and access client documents securely.
5. **Checklist Management:** Create, view, update and track checklist tasks for clients.

The application also provides role-based access control, authentication and activity tracking.

## The AI feature

- **What it does:** The AI feature generates relevant checklist task suggestions for accounting staff based on the client's business type, current status and existing checklist task titles.
- **AI model:** Gemini 3.5 Flash-Lite through the Google Gemini API.
- **How it works:** The backend prepares a prompt using client details and sends it to Gemini. The response is processed into structured JSON containing task titles, descriptions and categories.
- **Duplicate prevention:** The prompt instructs the AI not to suggest tasks that already exist.
- **Error handling:** The service retries certain failed API requests up to three times. If the service remains unavailable, it returns a temporary-unavailable error.
- **If AI is unavailable:** AI suggestions cannot be generated until the service becomes available again. Other application features remain separate from this AI service.

The AI feature suggests checklist tasks; it does not directly analyse uploaded document contents.

## My stack

| Part | Technology | Why I used it |
|---|---|---|
| Frontend | React 19 | To build reusable and interactive user interfaces |
| Build tool | Vite | For fast development and production builds |
| Styling | CSS | To create the application interface |
| Backend | Node.js | To implement server-side functionality |
| Backend framework | Express.js | To create REST API endpoints |
| Database | MongoDB Atlas | To store application data |
| Authentication | JWT and bcryptjs | To manage authentication and password hashing |
| File storage | Supabase Storage | To store documents securely |
| AI integration | Gemini 3.5 Flash-Lite | To generate checklist suggestions |
| Email service | Resend | To support staff invitation emails |
| API testing | Supertest and Node.js test runner | To test backend endpoints |
| Deployment | Vercel and Render | To host the frontend and backend |
| Version control | Git and GitHub | To manage source code and project changes |
| Development tools | VS Code and Postman | For coding and API testing |

## Main design choices

### Database collections

- Users – Stores partner, staff and client account information.
- Clients – Stores client details.
- Documents – Stores document metadata and storage references.
- Checklists – Stores client checklist tasks.
- Activities – Stores recent application activities.

### Important design decisions

1. **Role-based access:** Partner, staff and client roles have different permissions.
2. **Secure authentication:** JWT is used for authentication, and bcryptjs is used for password hashing.
3. **Private document storage:** Supabase Storage is used for document storage.
4. **Backend validation:** API routes validate requests and enforce access permissions.
5. **AI integration:** Gemini generates checklist suggestions based on available client information.
6. **Error handling:** API failures are handled without treating unavailable AI suggestions as successful results.

## How to run it on your computer

### Requirements

- Node.js
- npm
- MongoDB connection
- Supabase account
- Gemini API key
- Resend account (for email functionality)

### 1. Clone the repository

```bash
git clone https://github.com/Vishal0504-tech/client-locker.git
cd client-locker
```

### 2. Run the frontend

```bash
npm install
npm run dev
```

### 3. Run the backend

Open another terminal:

```bash
cd server
npm install
npm run dev
```

### 4. Environment settings

Configure the required environment variables in the appropriate local environment files.

Settings required include:

- PORT
- MONGO_URI
- JWT_SECRET
- FRONTEND_URL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- GEMINI_API_KEY
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- MAGIC_LINK_TEST_EMAIL

Never upload real API keys, passwords or secret values to GitHub.

## How to run the tests

Open the backend terminal:

```bash
cd server
npm install
npm test
```

The project uses the Node.js built-in test runner with Supertest for API testing.

### Frontend production build

From the project root:

```bash
npm run build
```

## Made-up data

The application uses sample records for development and demonstration purposes.

The demonstration data should contain no real customers, personal information or confidential business documents.

All sample users, clients and uploaded demonstration documents must be fictional.

## What works

### Fully working

- User authentication and role-based access.
- Partner, staff and client dashboards.
- Client management.
- Staff management and invitation flow.
- Document upload and access.
- Checklist creation and management.
- AI-powered checklist suggestions.
- Activity tracking.
- Frontend and backend deployment.

### Partly done

- AI suggestions depend on the availability and usage limits of the Gemini API.
- Accessibility and SEO scores can be improved further.

### Skipped

- No additional skipped features are being claimed.

## What I would do differently with more time

- Improve accessibility and SEO.
- Add more advanced document search and filtering.
- Improve AI suggestion quality through additional testing.
- Add more automated tests for different user roles.
- Improve application monitoring and performance tracking.

## Speed score

Google PageSpeed Insights results:

| Category | Mobile | Desktop |
|---|---:|---:|
| Performance | 100 | 100 |
| Accessibility | 88 | 88 |
| Best Practices | 100 | 100 |
| SEO | 82 | 82 |

**Required speed score:** 85+

**Achieved Performance score:** 100/100 on both Mobile and Desktop.

Evidence: `docs/SPEED.png`

[View Mobile PageSpeed report](https://pagespeed.web.dev/analysis/https-client-locker-gules-vercel-app/lejca83bm6c7p17y2rcs55?form_factor=mobile)

## Project documents

- `docs/PLAN.pdf` – Project plan.
- `docs/REAL_USERS.pdf` – User testing feedback.
- `docs/AI_NOTES.pdf` – AI testing notes.
- `docs/SPEED.png` – PageSpeed evidence.
- `docs/PROGRESS.pdf` – Project progress template.

---

**Project:** ClientLocker  
**Purpose:** Secure client and document management for accounting firms.