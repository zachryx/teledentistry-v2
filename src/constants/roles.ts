export const USER_ROLES = {
  ADMIN: 'ADMIN',
  HUB: 'HUB',
  DOCTOR: 'DOCTOR',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

