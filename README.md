# FakeX Social Media Platform

A social media platform built with Node.js, Express, and Angular, featuring real-time interactions and a clean, intuitive interface.

## Features
- User authentication and profile management
- Create, like, and comment on posts
- Repost functionality
- Image upload support
- Admin dashboard for content moderation

## Stack Overview
- Node.js and Express backend with MongoDB
- Angular frontend
- Dockerized services: Nginx reverse proxy, Prometheus, Grafana, Graylog with OpenSearch and MongoDB, Jenkins, and Node Exporter

## Quick Start with Docker
1. Copy environment variables: `cp server/.env.example server/.env` and set a strong `JWT_SECRET`.
2. From the repo root run `docker compose up -d`.
3. Open the services:
   - Backend API: http://localhost:3000
   - Nginx gateway: http://localhost:8088
   - Grafana: http://localhost:3001 (admin/admin)
   - Prometheus: http://localhost:9090
   - Graylog: http://localhost:9000 (admin/admin)
   - Jenkins: http://localhost:8081
   - OpenSearch: http://localhost:9200

## Monitoring and Logging
- Backend exposes Prometheus metrics at `/metrics` and Prometheus scrapes it alongside Node Exporter; Grafana includes a provisioned Prometheus datasource.
- Graylog stores data in OpenSearch and MongoDB; create a GELF UDP input on port 12201 to view backend container logs sent via the Docker GELF driver.

## Jenkins Pipeline
- Jenkinsfile installs backend dependencies, runs tests, builds the backend Docker image, and validates the compose configuration.

## Local Development
1. Install server dependencies: `cd server && npm install`.
2. Install client dependencies: `cd client && npm install`.
3. Add `server/.env` using `server/.env.example` as a template.
4. Start the backend: `cd server && npm start`.
5. Start the frontend: `cd client && npm start`.
6. Access the frontend at http://localhost:4200 and the backend API at http://localhost:3000.

## Default Admin Account
- Login: admin@example.com
- Password: admin
