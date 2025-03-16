# FakeXReal Social Media Platform

A modern social media platform built with Node.js, Express, and Angular, featuring real-time interactions and a clean, intuitive interface.

## Features

- 👤 User authentication and profile management
- 📝 Create, like, and comment on posts
- 🔄 Repost functionality
- 🖼️ Image upload support
- 👑 Admin dashboard for content moderation
- 🚫 User management (ban/unban functionality)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Angular CLI

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fakex2
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Create a `.env` file in the server directory with the following variables (or use the existing one if provided):
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
```

### Running the Application

1. Start the server:
```bash
cd server
node server.js
```

2. Start the client application:
```bash
cd client
npm start
```

3. Access the application:
- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:3000`

## Default Admin Account

- Login: admin@example.com
- Password: admin

-------------------------------------------------------------
![Képernyőfotó 2025-03-16 - 12 18 58](https://github.com/user-attachments/assets/a93a9261-c492-4fa1-9ca7-21ec07626b3d)

