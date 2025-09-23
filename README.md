Blog Platform Assignment

Project Overview
This repository contains the implementation of a Blog publishing platform. The platform allows users to create, read, update, and delete blog posts. It supports a web interface built with React, a mobile app developed in Flutter, and a backend API using Node.js and Express. MongoDB is used as the database.

Core Features

Authentication
- Sign up / Log in (email-password)
- JWT-based session handling for secure access

Blog Post CRUD
- Create a blog post (title, content, tags, optional image)
- Edit and delete only own posts
- View list of all posts (home/feed)
- View individual blog post details

Author Profile
- Basic profile page (name, profile picture, bio)
- List of user’s own blog posts

AI Tools Used
- GitHub Copilot: Assisted in improving CSS styles, and optimizing React components.
- ChatGPT: Helped in debugging issues like login, and designing the database schema.

Links
- Demo Video: https://drive.google.com/file/d/1cFMD57i5tsIPGULyIEojL63qhdlfZ0pq/view?usp=sharing

Setup Instructions

Backend
1. Navigate to the backend directory:
   cd backend

2. Seed the database :
   node seed.js

3. Start the backend server:
   npm start

Frontend
1. Start the frontend development server:
   npm start

Deliverables
- GitHub Repository: Contains the complete codebase for the frontend, backend.
- README: Includes project overview, setup instructions, and AI tools used.
- Demo Video: Demonstrates the app's functionality.
- Hosted Web App: Publicly accessible link to the web app.


Future Enhancements
- Real-time notifications with WebSockets
- Advanced search with Elasticsearch
- Content moderation tools
- Admin dashboard for managing users and posts
- Analytics dashboard for tracking engagement
- Mobile app deployment to app stores


Feel free to reach out if you have any questions or need further assistance with the setup.
