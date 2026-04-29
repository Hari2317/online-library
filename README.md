# Online Library Management System - Deployment Guide

This project is a modern, secure web application for automated book lending and management.

## Technology Stack
- **Frontend:** React, TailwindCSS, Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Security:** Helmet, express-mongo-sanitize, xss-clean, bcrypt, express-rate-limit

## Deployment via Docker (AWS/Azure/GCP)

Follow these steps to deploy on any major cloud provider VM (e.g., AWS EC2, Google Compute Engine, Azure Virtual Machines).

### Prerequisites
- A cloud instance running Linux (Ubuntu 20.04/22.04 recommended)
- `docker` and `docker-compose` installed

### Steps

1. **Clone the repository** (if hosted on GitHub) or transfer files to the server.
2. **Navigate to the project root directory**:
   ```bash
   cd lib-man
   ```
3. **Configure Environment Variables**:
   Update `docker-compose.yml` to replace the `MONGO_URI` if using MongoDB Atlas cloud service. If you are using local Mongo inside Docker, you can leave it as-is. Set a secure `JWT_SECRET`.
4. **Build and Run**:
   ```bash
   docker-compose up --build -d
   ```
5. **Access the application**:
   - The React frontend is available at `http://<your-server-ip>/`
   - The Express backend API is available at `http://<your-server-ip>:8000/api/v1`

## Security Considerations for Production
- Add a reverse proxy (like Nginx separate container or cloud load balancer) with an SSL certificate to enable HTTPS configuration.
- Update `cors` configuration in `backend/server.js` to only allow requests from your specific domain names instead of allowing all origins.
