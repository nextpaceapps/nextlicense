// NOTE: Keep in sync with license-api/types.ts
// When modifying types, ensure both license-api/types.ts and license-ui/types.ts are updated

export type Product = {
  id: string;
  name: string;
  code: string;
  description?: string;
};

export type Plan = {
  id: string;
  productId: string;
  name: string;
  durationDays: number;
  deviceLimit: number;
  features: string[]; // Comma separated feature codes
  price: number;
};

export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export type Activation = {
  deviceId: string;
  activatedAt: string;
  lastUsedAt: string;
};

export type License = {
  id: string;
  key: string;
  productId: string;
  planId: string;
  userEmail: string;
  status: LicenseStatus;
  issuedAt: string;
  expiresAt: string;
  activations: Activation[];
};

export type LogEvent = {
  id: string;
  timestamp: string;
  type: 'ISSUE' | 'VALIDATE' | 'RENEW' | 'CANCEL' | 'EXPIRE' | 'ERROR';
  details: string;
  relatedId?: string; // License ID or Product ID
};

export type ValidationResponse = {
  valid: boolean;
  message: string;
  license?: {
    status: LicenseStatus;
    productName: string;
    planName: string;
    expiresAt: string;
    features: string[];
    daysRemaining: number;
  };
};

export type UserProfile = {
  email: string;
  name: string;
  picture?: string;
  role: 'ADMIN' | 'VIEWER';
};
