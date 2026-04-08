# AuthVerifier

The `AuthVerifier` class is responsible for verifying the completeness and availability of the authentication module in the Interview AI system.

## Overview

The AuthVerifier validates all authentication features including:

- Email registration with password hashing
- Email login with JWT token generation
- Google OAuth integration
- GitHub OAuth integration
- Password reset flow
- JWT token expiration
- Email verification workflow

## Requirements Validated

The AuthVerifier implements verification for the following requirements from the spec:

- **Requirement 1.1**: Email registration creates user accounts with hashed passwords
- **Requirement 1.2**: Email login authenticates users and returns valid JWT tokens
- **Requirement 1.3**: Google OAuth integration redirects users and creates/updates accounts
- **Requirement 1.4**: GitHub OAuth integration redirects users and creates/updates accounts
- **Requirement 1.5**: Password reset generates tokens and updates passwords securely
- **Requirement 1.7**: JWT tokens expire after the configured session timeout
- **Requirement 1.8**: Email verification workflow marks accounts as verified

## Usage

### Basic Usage

```typescript
import { AuthVerifier } from '@/modules/auth.verifier';

const verifier = new AuthVerifier();

// Check availability
const availability = await verifier.verifyAvailability();
console.log('Available:', availability.available);

// Verify completeness
const completeness = await verifier.verifyCompleteness();
console.log('Passed:', completeness.passed);
console.log('Total Checks:', completeness.totalChecks);
console.log('Passed Checks:', completeness.passedChecks);

// Generate full report
const report = await verifier.generateReport();
console.log('Status:', report.status);

// Cleanup
await verifier.cleanup();
```

### Using with TestOrchestrator

```typescript
import { AuthVerifier } from '@/modules/auth.verifier';
import { TestOrchestrator } from '@/core/test-orchestrator';

const orchestrator = new TestOrchestrator();
await orchestrator.initialize();

const authVerifier = new AuthVerifier();
orchestrator.registerVerifier('auth', authVerifier);

const result = await orchestrator.runModule('auth');
console.log('Module Status:', result.status);

await orchestrator.cleanup();
await authVerifier.cleanup();
```

## Verification Checks

### 1. Email Registration

Verifies that:

- User registration endpoint accepts email, password, and username
- Returns HTTP 201 status code
- Returns a valid JWT access token
- User data is correctly stored
- Email matches the registered email

### 2. Email Login with JWT

Verifies that:

- Login endpoint accepts email and password
- Returns HTTP 200 status code
- Returns a valid JWT access token
- JWT token has correct format (three parts separated by dots)
- JWT token can be used to access protected endpoints
- Protected endpoint returns correct user data

### 3. Google OAuth Flow

Verifies that:

- OAuth providers endpoint is accessible
- Google OAuth configuration is present
- Google OAuth can be enabled with proper credentials

**Note**: Full OAuth flow testing requires browser interaction and is not fully automated. This check verifies configuration and endpoint availability.

### 4. GitHub OAuth Flow

Verifies that:

- OAuth providers endpoint is accessible
- GitHub OAuth configuration is present
- GitHub OAuth can be enabled with proper credentials

**Note**: Full OAuth flow testing requires browser interaction and is not fully automated. This check verifies configuration and endpoint availability.

### 5. Password Reset Flow

Verifies that:

- Forgot password endpoint accepts email
- Returns HTTP 200 status code
- Password reset request is processed

**Note**: Full password reset testing requires accessing the reset code from email or database. This check verifies the endpoint is functional.

### 6. JWT Token Expiration

Verifies that:

- JWT tokens contain expiration claim (exp)
- Expiration time is in the future
- Expiration time is reasonable (not too far in the future)
- Token expiration is properly configured

### 7. Email Verification Workflow

Verifies that:

- User registration creates unverified accounts
- Email verification status is tracked
- Verification endpoint exists

**Note**: Full email verification testing requires accessing the verification code from email or database. This check verifies the workflow exists.

## API Endpoints Used

The AuthVerifier interacts with the following API endpoints:

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user (protected)
- `GET /api/v1/auth/oauth/providers` - OAuth provider status
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/verify-email` - Verify email address

## Configuration

The AuthVerifier uses the test configuration from `tests/verification/config/test.config.ts`:

```typescript
{
  apiBaseUrl: 'http://localhost:3000',  // or from environment
  timeout: {
    default: 30000,  // 30 seconds
  }
}
```

## Error Handling

The AuthVerifier handles errors gracefully:

- **Connection Errors**: Reported as availability failures
- **HTTP Errors**: Captured and reported in check results
- **Timeout Errors**: Handled by the API helper with configurable timeout
- **Validation Errors**: Reported as failed checks with detailed error messages

## Test Data Management

The AuthVerifier creates test users with unique timestamps to avoid conflicts:

```typescript
const email = `test-register-${Date.now()}@example.com`;
```

Test users are tracked internally and can be cleaned up using the `cleanup()` method.

## Limitations

1. **OAuth Testing**: Full OAuth flow requires browser interaction and cannot be fully automated. The verifier checks configuration and endpoint availability only.

2. **Email Verification**: Full email verification requires accessing verification codes from email or database. The verifier checks that the workflow exists.

3. **Password Reset**: Full password reset testing requires accessing reset codes from email or database. The verifier checks that the endpoint is functional.

4. **Backend Dependency**: All checks require a running backend server. If the backend is not available, all checks will fail with connection errors.

## Future Enhancements

Potential improvements for the AuthVerifier:

1. **Database Integration**: Access verification and reset codes directly from the database for complete flow testing
2. **Test Email Service**: Integrate with a test email service to capture and verify emails
3. **OAuth Simulation**: Implement OAuth flow simulation for automated testing
4. **Token Blacklisting**: Verify JWT token blacklisting/revocation if implemented
5. **Rate Limiting**: Verify rate limiting on authentication endpoints
6. **Security Headers**: Verify security headers on authentication responses

## Related Files

- `tests/verification/modules/auth.verifier.ts` - Implementation
- `tests/verification/__tests__/auth-verifier.test.ts` - Unit tests
- `tests/verification/examples/auth-verifier-usage.ts` - Usage examples
- `.kiro/specs/core-functionality-check/requirements.md` - Requirements specification
- `.kiro/specs/core-functionality-check/design.md` - Design specification
