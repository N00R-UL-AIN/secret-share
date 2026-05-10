# Secure Share

A secure, one-time secret sharing application with zero-knowledge encryption. Share sensitive information like passwords, API keys, or private notes that automatically self-destruct after viewing.

## Features

### Security & Privacy
- **Zero-Knowledge Encryption**: Client-side AES-256-GCM encryption with passphrase-derived keys
- **One-Time Viewing**: Secrets are permanently destroyed after first access
- **Passphrase Protection**: Strong PBKDF2 key derivation (100,000 iterations)
- **User Authentication**: JWT-based auth with refresh token rotation
- **Rate Limiting**: Per-endpoint rate limits to prevent abuse
- **Audit Logging**: Comprehensive logging of all security events
- **IP Hashing**: Privacy-preserving IP address storage
- **Account Security**: bcrypt hashing, account lockout, secure headers

### User Experience
- **Public Links**: Share links safely - only passphrase holders can decrypt
- **Responsive UI**: Modern React frontend with clean, accessible design
- **User Dashboard**: Manage your created secrets
- **Time-Based Expiration**: Configurable TTL from 1 hour to 7 days
- **Cross-Platform**: Works on desktop and mobile browsers

## Architecture

### Backend (Node.js/Express)
- REST API with comprehensive security middleware
- MongoDB for data persistence
- JWT authentication with HTTP-only cookies
- Input validation with Joi
- Error handling and logging

### Frontend (React)
- Single-page application with React Router
- Client-side encryption using Web Crypto API
- Responsive design with custom CSS
- Form validation and user feedback

## Prerequisites

- Node.js 16+ and npm
- MongoDB 4.4+
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secret-share
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   cd ..
   ```

## Configuration

1. **Environment Setup**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Generate Required Secrets**

   Generate JWT secrets (64+ characters each):
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   Generate encryption key (exactly 32 bytes = 64 hex characters):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Configure Environment Variables**

   Edit `backend/.env` with your values:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/secret-share

   # JWT Configuration
   JWT_SECRET=<64-char-secret>
   JWT_REFRESH_SECRET=<64-char-secret>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Encryption
   ENCRYPTION_KEY=<64-char-hex-key>

   # Security Settings
   BCRYPT_ROUNDS=12
   MAX_SECRET_SIZE_KB=64
   DEFAULT_SECRET_TTL_HOURS=24
   MAX_SECRET_TTL_HOURS=168

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # CORS
   ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
   ```

## Running the Application

### Development

1. **Start MongoDB**
   ```bash
   mongod  # or however you run MongoDB
   ```

2. **Start Backend & Frontend Together (Recommended)**
   ```bash
   npm run dev:full
   ```
   This will automatically:
   - Kill any process on port 5000 (backend)
   - Kill any process on port 3000 (frontend)
   - Start both services concurrently

3. **Or Start Separately**

   Backend (Terminal 1):
   ```bash
   npm run dev
   ```
   Backend runs on http://localhost:5000

   Frontend (Terminal 2):
   ```bash
   npm run dev:frontend
   ```
   Frontend runs on http://localhost:3000

### Important: Fixed Ports
- **Frontend**: Always runs on port 3000
- **Backend**: Always runs on port 5000

If a process is already using these ports, the startup script will automatically kill it and use the port for the new process.

### Production

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start Backend**
   ```bash
   npm start
   ```
   Backend runs on http://localhost:5000

3. **Serve Frontend**
   Use a static file server or deploy to your hosting platform.

## API Documentation

### Authentication Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Create account |
| POST | `/api/auth/login` | None | Login, get tokens |
| POST | `/api/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/api/auth/logout` | Bearer | Invalidate session |
| GET | `/api/auth/me` | Bearer | Get current user |

### Secret Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/secrets` | Bearer | Create a secret |
| GET | `/api/secrets/my` | Bearer | List your secrets |
| GET | `/api/secrets/:id` | None | Get secret metadata |
| POST | `/api/secrets/:id/view` | None | View & destroy secret |
| DELETE | `/api/secrets/:id` | Bearer | Delete your secret |

### Request/Response Examples

**Create Secret**
```bash
curl -X POST http://localhost:5000/api/secrets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "encryptedContent": "base64-encoded-encrypted-data",
    "iv": "base64-iv",
    "authTag": "base64-auth-tag",
    "salt": "base64-salt",
    "passphrase": "user-passphrase",
    "ttlHours": 24
  }'
```

**View Secret**
```bash
curl -X POST http://localhost:5000/api/secrets/abc123/view \
  -H "Content-Type: application/json" \
  -d '{"passphrase": "user-passphrase"}'
```

## Project Structure

```
secret-share/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── securityConfig.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── auth.jsx
│   └── package.json
└── README.md
```

## Security Considerations

- **Encryption**: AES-256-GCM with PBKDF2 key derivation
- **Key Management**: Server encryption key for additional storage security
- **Token Security**: HTTP-only cookies for refresh tokens
- **Input Validation**: Comprehensive validation with Joi
- **Rate Limiting**: Prevents brute force and DoS attacks
- **Audit Trail**: All actions are logged for security monitoring

## Deployment

1. Set up MongoDB database
2. Configure production environment variables
3. Build and deploy backend to your server
4. Build frontend and serve static files
5. Configure reverse proxy (nginx) for SSL and routing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open a GitHub issue.