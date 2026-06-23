import '@testing-library/jest-dom';
import { vi } from 'vitest';

process.env.JWT_SECRET = 'testsecret123456789012345678901234567890';
process.env.JWT_REFRESH_SECRET = 'testrefreshsecret123456789012345678901234567890';
process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

// Mock NextJS Cache unstable_cache
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
}));

// Mock NextJS navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
}));
