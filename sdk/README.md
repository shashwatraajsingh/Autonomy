# autonomy-ai-sdk

Official SDK for integrating AI agents with **Autonomy** - The Financial Operating System for AI Agents.

## Installation

```bash
npm install autonomy-ai-sdk
```

## Quick Start

```typescript
import { AutonomySDK } from 'autonomy-ai-sdk';

// Initialize with your agent credentials
const autonomy = new AutonomySDK({
  apiUrl: 'https://api.autonomy.finance',
  agentId: 'your-agent-id'
});

// Request payment approval before any paid API call
const payment = await autonomy.requestPayment({
  service: 'api.openai.com',
  amount: 0.05,
  description: 'GPT-4 API call'
});

if (payment.approved) {
  // Safe to proceed with the API call
  console.log('Payment approved:', payment.txHash);
} else {
  // Handle rejection
  console.log('Blocked:', payment.reason);
}
```

## Features

### Check Payment (Dry Run)
Validate a payment without executing it:

```typescript
const check = await autonomy.checkPayment({
  service: 'api.openai.com',
  amount: 10
});

console.log(check.approved); // true or false
console.log(check.reason);   // 'All checks passed' or rejection reason
```

### Get Policy Info
Check current spending status:

```typescript
const policy = await autonomy.getPolicy();

console.log(policy.dailyLimit);     // $50
console.log(policy.spentToday);     // $23.50
console.log(policy.remainingDaily); // $26.50
console.log(policy.whitelist);      // ['api.openai.com', ...]
```

### Check Service Whitelist
Verify if a service is allowed:

```typescript
const allowed = await autonomy.isServiceAllowed('api.openai.com');
console.log(allowed); // true
```

## x402 Payment Protocol

Handle HTTP 402 (Payment Required) responses automatically:

```typescript
import { AutonomySDK, X402Middleware } from 'autonomy-ai-sdk';

const autonomy = new AutonomySDK({ ... });
const x402 = new X402Middleware(autonomy);

// Automatically handles 402 responses
const response = await x402.fetch('https://paid-api.example.com/data');
const data = await response.json();
```

## API Reference

### `AutonomySDK`

| Method | Description |
|--------|-------------|
| `checkPayment(request)` | Validate payment without executing |
| `requestPayment(request)` | Request and execute payment |
| `getPolicy()` | Get current policy and spending info |
| `isServiceAllowed(service)` | Check if service is whitelisted |

### `X402Middleware`

| Method | Description |
|--------|-------------|
| `fetch(url, options)` | Fetch with automatic 402 handling |

## Types

```typescript
interface PaymentRequest {
  service: string;
  amount: number;
  description?: string;
}

interface PaymentResult {
  approved: boolean;
  reason: string;
  transactionId?: string;
  txHash?: string;
}

interface PolicyInfo {
  dailyLimit: number;
  perTxLimit: number;
  spentToday: number;
  remainingDaily: number;
  whitelist: string[];
}
```

## License

MIT
