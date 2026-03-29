<div align="center">

<!-- Optional banner/logo -->
<img src="https://via.placeholder.com/1200x300?text=CivicConnect+Banner" alt="CivicConnect Banner" width="100%" />

# CivicConnect

### 🏛️ AI-Powered Civic Complaint Management Platform


[![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](./client)
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](./server)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](./)

**CivicConnect** is a full-stack civic issue reporting platform that helps citizens report local problems, enables authorities to manage complaints efficiently, and improves transparency through dashboards, geolocation, analytics, and AI-assisted complaint processing.

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Screenshots](#-screenshots)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Folder Structure](#-folder-structure)
- [Future Improvements](#-future-improvements)
- [Contributors](#-contributors)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🔍 Overview

CivicConnect is designed to bridge the gap between **citizens** and **municipal authorities** by providing a centralized platform for civic complaint registration, monitoring, and resolution.

### What it does
- Allows citizens to submit civic complaints with descriptions, images, and location details
- Helps administrators review, classify, assign, and resolve complaints
- Tracks complaint lifecycle with status updates and SLA monitoring
- Provides dashboards, analytics, and public visibility into civic issue trends

### Why it matters
Traditional complaint systems are often slow, fragmented, and lacking transparency. CivicConnect solves this by creating a structured, digital-first civic reporting workflow that is easier to use, monitor, and scale.

---

## 🚨 Problem Statement

Urban civic issues such as:
- Potholes
- Garbage overflow
- Water leakage
- Streetlight failures
- Drainage problems
- Public infrastructure damage

are often under-reported, poorly tracked, or delayed in resolution due to disconnected systems and manual workflows.

**CivicConnect addresses this challenge through AI-assisted complaint handling, map-based visibility, and role-based administrative management.**

---

## ✨ Key Features

- 📝 Citizen complaint submission with image upload and location capture
- 🤖 AI-assisted complaint categorization, priority scoring, and duplicate detection
- 🗺️ Interactive map view for visualizing complaint hotspots
- 📊 Public and admin analytics dashboards for trend monitoring
- 🏢 Department assignment and complaint workflow management
- ⏱️ SLA tracking for time-bound complaint resolution
- 🔐 JWT-based authentication with role-based access control
- 🔔 In-app notification system for complaint updates
- 📬 Email notification support for important complaint status changes
- 📈 Severity ranking and operational insights for administrators
- 🧾 Citizen dashboard for complaint history and status tracking
- 🌐 Public transparency portal for open civic visibility

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ React 18
- 🟦 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS
- 🧭 React Router
- 📍 Leaflet + React Leaflet
- 📊 Recharts
- 🌐 Axios
### Backend
- 🟢 Node.js
- 🚏 Express.js
- 🔐 JWT Authentication
- 🔒 bcrypt
- ☁️ Cloudinary
- 📩 Nodemailer
- 🧪 Jest + Supertest
### Database
- 🍃 MongoDB
- 🧩 Mongoose

### Additional Capabilities
- 🧠 AI complaint processing pipeline
- 🛡️ Helmet + Rate Limiting + Validation
- ⏰ Node Cron for SLA monitoring

---


## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/civicconnect.git
cd civicconnect
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create the required `.env` files using the sample placeholders below.

### 4. Start the development servers

```bash
npm run dev
```

This runs:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:5000`

### 5. Build for production

```bash
npm run build
```

### 6. Run tests

```bash
npm run test
```

---

## 🔐 Environment Variables

### Server `.env`
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

MAILTRAP_HOST=your_mailtrap_host
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_password
MAILTRAP_SENDER_EMAIL=no-reply@example.com

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=no-reply@example.com
```

### Client `.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Usage

### Citizen Flow
1. Register or log in to the platform
2. Submit a complaint with title, description, image, and location
3. Track complaint status from the citizen dashboard
4. View admin remarks and updates in real time

### Admin Flow
1. Log in with admin credentials
2. Review complaint queue and analytics
3. Assign complaints to departments
4. Update status, add remarks, and monitor SLA risks

### Public Portal
- Browse complaints
- View category and trend statistics
- Explore complaints on the city map

---

## 📡 API Endpoints

> Base URL: `http://localhost:5000/api`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Log in a user |
| `GET` | `/auth/me` | Get current authenticated user |

### User
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/user/profile` | Fetch user profile |
| `PUT` | `/user/profile` | Update user profile |
| `PUT` | `/user/password` | Update user password |

### Complaints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/complaints` | Get complaints list |
| `GET` | `/complaints/nearby` | Get nearby complaints |
| `GET` | `/complaints/:id` | Get complaint by ID |
| `POST` | `/complaints` | Create a complaint |
| `PATCH` | `/complaints/:id` | Update complaint |
| `PATCH` | `/complaints/:id/status` | Update complaint status |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/complaints` | Get admin complaint queue |
| `GET` | `/admin/dashboard-trends` | Get admin dashboard trends |
| `PATCH` | `/admin/complaints/:id/assign` | Assign department |
| `PATCH` | `/admin/complaints/:id/manage` | Manage complaint workflow |
| `GET` | `/admin/departments` | Get departments |
| `GET` | `/admin/sla-violations` | Get SLA violation list |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/category` | Complaint category analytics |
| `GET` | `/analytics/trends` | Complaint trend analytics |
| `GET` | `/analytics/wards` | Ward-wise analytics |
| `GET` | `/analytics/severity` | Severity analytics |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications` | Get notifications |
| `PATCH` | `/notifications/read-all` | Mark all as read |
| `PATCH` | `/notifications/:id/read` | Mark one as read |
| `DELETE` | `/notifications/selected` | Delete selected notifications |
| `DELETE` | `/notifications` | Delete all notifications |
| `DELETE` | `/notifications/:id` | Delete a notification |

### Public / Citizen Trends
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/public/stats/trends` | Public dashboard trend metrics |
| `GET` | `/citizen/dashboard-trends` | Citizen dashboard trend metrics |

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | API health status |

---

## 📁 Folder Structure

```bash
CivicConnect/
├── client/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── test/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── ai-engine/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── DESIGNDOC.md
├── PRD.md
├── TECH.md
├── package.json
└── README.md
```

---

## 🔮 Future Improvements

- 📱 Native mobile application for Android and iOS
- 🌍 Multilingual interface support
- 🎤 Voice-based complaint submission
- 🧠 More advanced ML models for prediction and routing
- 🛰️ Real-time ward heatmaps and clustering
- 📨 SMS and WhatsApp notifications
- 🗳️ Community upvoting for recurring public issues
- ☁️ Cloud deployment with CI/CD pipeline
- 📄 PDF report generation for municipal review
- 🔗 Integration with government APIs and smart city platforms

---





---

## 🙏 Acknowledgements

- Open-source community for the libraries and frameworks used in this project
- React, Node.js, MongoDB, Express, and Vite communities
- Leaflet and OpenStreetMap for geospatial visualization
- Cloudinary for media storage support
- Academic mentors, faculty guides, and project reviewers
- Inspiration from smart city, civic-tech, and e-governance platforms

---

<div align="center">

**CivicConnect aims to make civic reporting smarter, faster, and more transparent.**  
If you find this project useful, consider giving it a ⭐ on GitHub.

</div>