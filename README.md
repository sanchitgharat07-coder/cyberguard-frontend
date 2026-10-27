# CyberGuard AI — Mobile Frontend

**CyberGuard AI: Deepfake QR Code Fraud Detector (v2 Stable)** is a cross-platform mobile application built with React Native and Expo. It is designed to work with the [CyberGuard AI backend](https://github.com/sanchitgharat07-coder/cyberguard-backend) for QR-code and URL threat analysis.

The frontend repository contains the app screens, reusable UI components, hooks, assets, and client-side utilities.

## Project links

- **Frontend:** https://github.com/sanchitgharat07-coder/cyberguard-frontend
- **Backend:** https://github.com/sanchitgharat07-coder/cyberguard-backend

## Key technologies

| Technology | Role |
|---|---|
| React Native | Cross-platform application UI |
| Expo SDK 54 | Development and app tooling |
| Expo Router | File-based navigation |
| TypeScript | Typed application code |
| Firebase / React Native Firebase Auth | Authentication integration |
| Axios | HTTP requests to backend services |
| Socket.IO Client | Real-time communication with compatible backend events |
| Expo Camera | Camera access for supported scanning flows |
| Three.js / Expo GL | 3D and GL rendering support where used |

Dependency versions are defined in [`package.json`](package.json) and locked in [`package-lock.json`](package-lock.json).

## Architecture overview

```text
CyberGuard AI Mobile App
        |
        +--> Screens and navigation (app/)
        |
        +--> Shared UI (components/)
        |
        +--> Hooks, constants and utilities
        |
        +--> Firebase authentication integration
        |
        +--> HTTP requests (Axios) ----------------+
        |                                          |
        +--> Real-time events (Socket.IO Client)   |
                                                   v
                                    CyberGuard AI Backend
                                    Flask / Socket.IO
                                                   |
                                  +----------------+----------------+
                                  |                |                |
                                Tier 1           Tier 2           Tier 3
                              ML analysis    Threat intelligence  Forensics
```

The backend is a separate project and must be configured and running for features that depend on its APIs or socket events. See the backend repository for its setup and implementation details.

## Getting started

### Prerequisites

- Node.js LTS compatible with Expo SDK 54
- npm
- Git
- Android Studio and an Android emulator, or a physical device
- For iOS development, macOS with Xcode
- Expo Go or a development build, depending on the native modules and features you use

### 1. Clone the repository

```bash
git clone https://github.com/sanchitgharat07-coder/cyberguard-frontend.git
cd cyberguard-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure app services

Review the Firebase setup, API client, and Socket.IO client configuration in the source before running the app. Set the backend base URL to the address reachable from the device or emulator.

**Important networking notes:**
- Android emulator access to a backend running on your development computer commonly uses `http://10.0.2.2:5000` rather than `http://localhost:5000`.
- A physical phone must use the computer's reachable LAN IP address, with both devices on an appropriate network.
- For a deployed backend, use its actual HTTPS URL.
- Do not put private API keys, service-account credentials, or other secrets in client-side source code. Mobile app values can be extracted from a built application.

Use the configuration mechanism expected by the existing codebase; do not assume that adding an `.env` file alone will configure the app unless the project is set up to load it.

### 4. Start the development server

```bash
npx expo start
```

Then use the Expo CLI prompts to open the app in a compatible development environment.

### Platform-specific commands

```bash
# Android
npm run android

# iOS (requires macOS and Xcode)
npm run ios

# Web
npm run web

# Lint the project
npm run lint
```

These scripts are defined in `package.json`.

## Project structure

```text
cyberguard-frontend/
├── app/                  # App screens and file-based routes
├── assets/
│   └── images/           # Image assets
├── components/           # Reusable UI components
├── constants/            # Shared constants
├── hooks/                # Reusable React hooks
├── scripts/              # Project scripts
├── utils/                # Shared utility functions
├── app.json              # Expo app configuration
├── eas.json              # EAS Build configuration
├── package.json           # Scripts and dependencies
├── package-lock.json      # Locked npm dependency tree
├── tsconfig.json          # TypeScript configuration
└── eslint.config.js       # ESLint configuration
```

## Backend integration

The mobile app is intended to connect to the CyberGuard AI backend:

**Repository:** https://github.com/sanchitgharat07-coder/cyberguard-backend

When integrating or troubleshooting:

1. Start the backend and confirm it is reachable from the target device.
2. Verify the frontend's API base URL and any Socket.IO connection URL.
3. Confirm request paths, HTTP methods, authentication requirements, and JSON payloads match the backend implementation.
4. Check both the Metro/Expo console and backend logs for errors.
5. Test connectivity on the actual target platform; `localhost` refers to the device itself when running on a physical phone.

Only document API routes and socket event names after confirming them in the backend and frontend source.

## Authentication and permissions

This project includes Firebase authentication dependencies and uses Expo device capabilities such as camera access. Configure Firebase for the intended platforms and review permission descriptions in the Expo configuration. Request camera access only when the relevant feature needs it, and explain the purpose to users.

## Development workflow

1. Create a feature branch.
2. Implement the screen or component in the relevant directory.
3. Keep shared UI in `components/`, reusable hooks in `hooks/`, and shared helpers in `utils/` where appropriate.
4. Run linting:

   ```bash
   npm run lint
   ```

5. Test on the target platform and verify backend-dependent flows.
6. Submit a pull request with a concise description and test notes.

## Troubleshooting

### The app cannot reach the backend

- Ensure the backend process is running.
- Check the configured host and port.
- Use an emulator-reachable or device-reachable address rather than assuming `localhost` works.
- Check firewall rules and ensure the phone and development machine can communicate.
- Prefer HTTPS for deployed environments.

### Firebase authentication fails

- Confirm the app's Firebase configuration matches the intended Firebase project.
- Verify that the relevant authentication provider is enabled in Firebase.
- Check platform-specific configuration and the console error message.
- Never commit private credentials to the repository.

### Expo or native module errors

```bash
npm install
npx expo-doctor
npx expo start --clear
```

If a dependency requires native code not included in Expo Go, use a compatible development build and follow that package's installation instructions.

## Security note

CyberGuard AI provides security analysis assistance, not a guarantee that a QR code or destination URL is safe. Treat scan results as one signal among others. Avoid opening suspicious links, and do not submit sensitive URLs or personal data unless you understand how the app and backend process them.

## Team

- **Project owner / developer:** [sanchitgharat07-coder](https://github.com/sanchitgharat07-coder)
- **Team member:** [Sahil Devkar](https://github.com/sahildevkar789)

## License

No license is specified in this README. Add a `LICENSE` file to define the terms under which others may use, modify, or redistribute the project.
