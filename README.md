# Advanced Authentication System

A production-style authentication backend built with **Node.js**, **Express**, and **MongoDB (Mongoose)**. This project was built to learn and implement real-world auth concepts: secure registration with email OTP verification, login with access/refresh tokens, session tracking, single-device logout, and logout from all devices.

## ✨ Features

- **User Registration** with hashed passwords
- **Email OTP Verification** (via Gmail using OAuth2 + Nodemailer) before an account can log in
- **Login** with access token (short-lived, 15m) + refresh token (long-lived, 7d, stored as `httpOnly` cookie)
- **Session Management** — every login creates a session document (IP, user agent, revoked status) in MongoDB
- **Refresh Token Rotation** — a new refresh token is issued and the old one invalidated on every refresh
- **Logout (single device)** — revokes only the current session
- **Logout from all devices** — revokes every active session for that user
- **Get current user (`/get-me`)** using the access token

## 🛠️ Tech Stack

| Layer          | Technology                         |
|----------------|-------------------------------------|
| Runtime        | Node.js                             |
| Framework      | Express                             |
| Database       | MongoDB with Mongoose               |
| Auth           | JSON Web Tokens (`jsonwebtoken`)    |
| Hashing        | Node's built-in `crypto` (SHA-256)  |
| Email          | Nodemailer (Gmail OAuth2)           |
| Logging        | Morgan                              |
| Cookies        | cookie-parser                       |

## 📁 Project Structure

```
AUTH/
├── src/
│   ├── config/
│   │   ├── config.js          # Loads & validates environment variables
│   │   └── database.js        # MongoDB connection
│   ├── controllers/
│   │   └── auth.controller.js # All auth route handlers
│   ├── models/
│   │   ├── otp.model.js       # OTP schema
│   │   ├── session.model.js   # Session schema
│   │   └── user.model.js      # User schema
│   ├── routes/
│   │   └── auth.routes.js     # /api/auth routes
│   ├── services/
│   │   └── email.service.js   # Nodemailer OTP email sender
│   ├── utils/
│   │   └── utils.js           # OTP generator + HTML email template
│   └── app.js                 # Express app setup
├── server.js                  # Entry point
├── .env
├── package.json
└── package-lock.json
```

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Gmail OAuth2 credentials for sending OTP emails
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_USER=your_gmail_address
```

> All of these are validated at startup in `config.js` — the server will throw an error immediately if any are missing.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run the server
node server.js
```

Server runs on `http://localhost:3000` by default.

## 📡 API Endpoints

Base URL: `/api/auth`

| Method | Endpoint          | Description                              | Auth Required |
|--------|-------------------|-------------------------------------------|----------------|
| POST   | `/register`       | Register a new user, sends OTP email      | No             |
| POST   | `/verify-email`   | Verify account using OTP                  | No             |
| POST   | `/login`           | Login, returns access token + refresh token cookie | No |
| GET    | `/get-me`          | Get logged-in user's info                 | Yes (Bearer access token) |
| GET    | `/refresh-token`   | Rotate refresh token, get new access token | Yes (refresh token cookie) |
| GET    | `/logout`          | Revoke current session                    | Yes (refresh token cookie) |
| GET    | `/logout-all`      | Revoke all sessions for the user           | Yes (refresh token cookie) |

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "yourpassword"
}
```

### Verify Email

```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

Returns an `accessToken` in the response body and sets a `refreshToken` as an `httpOnly` cookie.

## 🔐 Auth Flow

1. **Register** → user is created (unverified) and an OTP is emailed.
2. **Verify Email** → user submits the OTP, account becomes `verified`.
3. **Login** → credentials are checked, a `session` document is created, and both an access token (15 min) and refresh token (7 days, cookie) are issued.
4. **Access protected routes** → client sends the access token in the `Authorization: Bearer <token>` header.
5. **Access token expires** → client calls `/refresh-token` (refresh token cookie is sent automatically) to get a new access token; the refresh token itself is rotated and the session's stored hash is updated.
6. **Logout** → the session tied to the current refresh token is marked `revoked`.
7. **Logout All** → every non-revoked session belonging to the user is marked `revoked`, signing the user out everywhere.

## 📝 Notes / Learnings

- Tokens are never stored raw in the database — only their SHA-256 hashes (`refreshTokenHash`, `otpHash`), so a database leak doesn't directly expose usable tokens.
- Refresh tokens are stored in `httpOnly`, `secure`, `sameSite: strict` cookies to reduce XSS/CSRF exposure.
- Each session records `ip` and `userAgent`, laying the groundwork for a "manage your devices" feature.
- Refresh token rotation limits the damage window if a refresh token is ever stolen.

## 🧭 Possible Next Steps

- Password reset via OTP/email
- Rate limiting on `/login` and `/register`
- Listing and revoking individual sessions (view active devices)
- Google OAuth login (credentials are already partially set up for email sending)
- Input validation with a library like `zod` or `joi`
