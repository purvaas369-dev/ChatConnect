# ChatConnect – Real-Time Chat & Payment App

ChatConnect is a full-stack real-time chat and payment application developed individually using Django and React.js. The platform enables users to communicate through instant messaging, emojis, and file sharing, while also supporting paid premium chat sessions through Razorpay payment integration.

The project demonstrates the implementation of real-time communication, REST APIs, authentication, file handling, frontend-backend integration, and online payment processing in a full-stack web application.

## Features

* Real-time one-to-one chat using WebSockets
* Text messaging
* Emoji support
* File sharing
* User authentication using JWT
* RESTful APIs using Django REST Framework
* Real-time communication using Django Channels
* Premium/paid chat sessions
* Razorpay payment integration
* React.js-based frontend
* Django-based backend
* User profiles and related application functionality

## Tech Stack

### Backend

* Python
* Django
* Django REST Framework
* Django Channels
* WebSockets
* JWT Authentication

### Frontend

* React.js
* JavaScript
* HTML
* CSS

### Payment

* Razorpay

### Tools

* Visual Studio Code
* Git
* GitHub
* Postman

##  Project Architecture

The project follows a full-stack architecture:


ChatConnect
│
├── app_backend/
│   ├── accounts/
│   ├── chat/
│   ├── payments/
│   ├── app_backend/
│   ├── manage.py
│   └── requirements.txt
│
└── app_frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   └── pages/
    └── package.json


The Django backend handles business logic, authentication, REST APIs, database operations, real-time communication, and payment-related functionality. The React frontend provides the user interface and communicates with the backend through APIs and WebSockets.

##  Real-Time Communication

Django Channels and WebSockets are used to establish real-time bidirectional communication between users.

This allows messages to be delivered instantly without requiring the user to refresh the page. The WebSocket layer works alongside the Django REST APIs to handle real-time communication and conventional application requests.

##  Payment Integration

Razorpay is integrated to support payments for premium chat sessions.

The payment functionality allows the application to support a monetized communication model where users can access premium sessions through online payment processing.

##  Authentication

JWT-based authentication is used to manage authenticated users and secure API access.

The authentication system is integrated between the React frontend and Django backend to allow authorized users to access application functionality.

##  Main Modules

### Accounts

Handles user-related functionality and authentication.

### Chat

Manages real-time messaging, conversations, emojis, and file-sharing functionality.

### Payments

Handles payment-related functionality and premium chat sessions.

### React Frontend

Provides the user interface and communicates with the Django backend through REST APIs and WebSockets.


