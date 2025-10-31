# HealthGuardX - Decentralized Health Identity System

## Project Overview

HealthGuardX is a blockchain-integrated decentralized health identity system that provides secure, patient-owned medical records with instant emergency access. The platform features blockchain-verified insurance claims and is built specifically for African healthcare realities.

**Last Updated:** October 31, 2025 (IPFS Configuration Completed)

## Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **UI Components:** Shadcn/ui (built on Radix UI)
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query (React Query)
- **Routing:** Wouter
- **Build Tool:** Vite

### Backend
- **Server:** Express.js with TypeScript
- **Database:** PostgreSQL (External Neon database)
- **ORM:** Drizzle ORM
- **Authentication:** Web3 wallet-based (MetaMask)

### Blockchain & Storage
- **Smart Contracts:** Deployed on BlockDAG network
- **IPFS Storage:** Pinata cloud storage for medical records
- **Wallet Integration:** MetaMask SDK for desktop and mobile

## Project Structure

```
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts (WalletContext)
│   │   ├── lib/         # Utilities and blockchain integration
│   │   └── pages/       # Application pages by role
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── blockchain.ts    # Blockchain read-only service
│   ├── ipfs.ts          # Pinata IPFS integration
│   └── storage.ts       # Database access layer
├── shared/              # Shared TypeScript definitions
│   └── schema.ts        # Drizzle database schema
├── abis/                # Smart contract ABIs
└── migrations/          # Database migrations
```

## Environment Setup

### Required Environment Variables

The following environment variables should be configured via Replit Secrets (not committed to git):

- `DATABASE_URL`: PostgreSQL connection string (external Neon database) - **REQUIRED**

### IPFS Storage Configuration (Required for Production)

For production IPFS storage via Pinata, **all three** credentials must be configured:

- `PINATA_JWT`: JWT token for Pinata IPFS service - **REQUIRED**
- `PINATA_API_KEY`: Pinata API key - **REQUIRED**
- `PINATA_API_SECRET`: Pinata API secret - **REQUIRED**
- `PINATA_GATEWAY`: (Optional) Custom Pinata gateway URL (defaults to https://gateway.pinata.cloud/ipfs/)

**For Replit Environment:**
Configure these as Replit Secrets for automatic injection as environment variables.

**For Local Development:**
1. Copy `.env.example` to `.env`
2. Fill in your Pinata credentials
3. Never commit `.env` to git (already in .gitignore)

**Important:** If Pinata credentials are not configured, the system will automatically use simulated IPFS storage with generated CIDs. This is suitable for development and testing only. You'll see a console warning: "[IPFS] Pinata credentials not configured. Using simulated IPFS storage."

**Getting Pinata Credentials:**
1. Sign up at https://pinata.cloud
2. Navigate to API Keys section
3. Create a new API key
4. Copy JWT, API Key, and API Secret

**Security Note:** Never commit credentials directly to code or `.env` files in git. Use Replit Secrets for production deployments.

### Development Workflow

The development server runs both the Express backend and Vite frontend on port 5000:

```bash
npm run dev
```

- Backend API: `http://localhost:5000/api/*`
- Frontend: `http://localhost:5000/`
- Vite HMR: Enabled with allowed hosts for Replit proxy

## Database Setup

The project uses PostgreSQL with Drizzle ORM. The database schema includes:

- **users**: User accounts linked to wallet addresses
- **kyc**: KYC verification data
- **healthProfiles**: Patient health information
- **medicalRecords**: Encrypted medical records with IPFS CIDs
- **accessControl**: Granular permission management
- **treatmentLogs**: Signed treatment records
- **insuranceProviders**: Insurance company information
- **claims**: Insurance claim tracking
- **auditLogs**: Immutable audit trail

### Running Migrations

```bash
npm run db:push
```

## User Roles

HealthGuardX supports six distinct user roles:

1. **Patient**: Manage health records, grant access, use insurance
2. **Doctor**: Request patient access, create treatment logs, consultations
3. **Hospital**: Admit patients, manage treatments, submit insurance claims
4. **Emergency Responder**: Scan QR codes for emergency information
5. **Insurance Provider**: Manage policies, process claims, collect premiums
6. **Admin**: Verify KYC, approve role applications, system oversight

## Wallet Connection

The application requires MetaMask for authentication:

### Desktop Users
1. Install MetaMask browser extension from [metamask.io](https://metamask.io/download/)
2. Click "Connect Wallet" button
3. Approve the connection request in MetaMask
4. Sign the authentication message

### Mobile Users
1. Install MetaMask mobile app
2. Open the HealthGuardX URL in MetaMask browser
3. Click "Connect Wallet"
4. Approve the connection

### Recent Changes to Wallet Connection
- Added comprehensive error handling and console logging
- Improved user feedback with clear error messages
- Better detection of MetaMask availability
- Helpful prompts to guide users through installation

## Blockchain Integration

The platform integrates with deployed smart contracts:

- **HealthGuardXUsers**: `0x7ddd2eb4ece89825096367fd6f72623996ad1a55`
- **HealthGuardXMedical**: `0x33b7b70a1a20233b441527a7cd5b43c791d78860`
- **HealthGuardXTreatments**: `0x865f4b7835cffad383d33211033ea3b747010cd8`
- **HealthGuardXInsurance**: `0xeaa1afa47136f28828464a69e21046da8706c635`
- **HealthGuardXPayments**: `0x479a9cd7bee5a12333ae3f44ad7b960aaf479278ffcb733cf3f4f80d00f465ae`

User transactions are signed on the frontend using MetaMask, following Web3 best practices. The backend only reads blockchain state and never stores private keys.

## Deployment

The project is configured for Replit autoscale deployment:

- **Build Command:** `npm run build` (builds both frontend and backend)
- **Start Command:** `npm run start` (runs production server)
- **Deployment Type:** Autoscale (stateless web application)

The production server serves the built frontend from the `dist/public` directory and handles API requests on the same port.

## Key Features

- **Patient-Owned Data**: Patients control their medical records
- **Emergency QR Codes**: Instant access to critical health information
- **Blockchain Verification**: All transactions are immutable and auditable
- **IPFS Storage**: Decentralized storage for medical documents
- **Insurance Integration**: Automated claim processing with smart contracts
- **Multi-Stakeholder Platform**: Unified system for all healthcare participants

## Testing

For testing without MetaMask:
1. The application will detect if MetaMask is not installed
2. Users will be prompted to install MetaMask or open in MetaMask mobile
3. Console logs provide detailed debugging information (search for "[HealthGuardX]" prefix)

## Troubleshooting

### Wallet Won't Connect
- Ensure MetaMask is installed and unlocked
- Check browser console for "[HealthGuardX]" log messages
- Try refreshing the page
- Make sure you're on a supported network

### Database Issues
- Run `npm run db:push` to sync schema changes
- Check `DATABASE_URL` in `.env` file
- Verify database is accessible

### IPFS Upload Failures
- Check PINATA environment variables
- System will fallback to simulated CIDs if Pinata is unavailable
- Check console logs for IPFS error messages

## Recent Updates

**October 31, 2025:**
- Migrated project to Replit environment
- Configured database with external PostgreSQL (Neon)
- Set up development workflow with Vite + Express
- Enhanced wallet connection with better error handling and user feedback
- Configured deployment for production
- Added comprehensive console logging for debugging

## Admin Access

The first wallet to connect with address matching `ADMIN_WALLET_ADDRESS` (configured in server code) will be automatically assigned admin role with verified status.

## Monthly Subscriptions

- **Hospitals**: 2 BDAG annual subscription (testing price)
- **Insurance Providers**: 2 BDAG annual subscription (testing price)
- **Platform Fees**: 2% on consultation fees, invoice payments, and claim payments

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review the README.md for comprehensive documentation
3. Verify all environment variables are configured correctly
