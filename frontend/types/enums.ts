/**
 * Frontend Enum Definitions - Mirrors Backend Enums
 * Use these for consistent type checking and value validation on the frontend
 * Synced with /backend/src/constants/enums.ts
 */

// ============================================================================
// USER STATUS ENUMS
// ============================================================================

export const UserStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
} as const;

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

// ============================================================================
// USER ROLE ENUMS
// ============================================================================

export const UserRole = {
  SUPERADMIN: 'superadmin',
  CLIENT: 'client',
  GUEST: 'guest',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// ============================================================================
// WHATSAPP CONNECTION STATUS ENUMS
// ============================================================================

export const WhatsAppConnectionStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  PENDING: 'pending',
} as const;

export type WhatsAppConnectionStatusType = typeof WhatsAppConnectionStatus[keyof typeof WhatsAppConnectionStatus];

// ============================================================================
// OAUTH STATUS ENUMS
// ============================================================================

export const OAuthStatus = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  DENIED: 'denied',
  EXPIRED: 'expired',
  AWAITING_WEBHOOK: 'oauth_completed_awaiting_webhook',
  SYNCED: 'synced',
} as const;

export type OAuthStatusType = typeof OAuthStatus[keyof typeof OAuthStatus];

// ============================================================================
// MESSAGE DIRECTION ENUMS
// ============================================================================

export const MessageDirection = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
} as const;

export type MessageDirectionType = typeof MessageDirection[keyof typeof MessageDirection];

// ============================================================================
// MESSAGE TYPE ENUMS
// ============================================================================

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  TEMPLATE: 'template',
  INTERACTIVE: 'interactive',
} as const;

export type MessageTypeType = typeof MessageType[keyof typeof MessageType];

// ============================================================================
// MESSAGE STATUS ENUMS (delivery status)
// ============================================================================

export const MessageStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;

export type MessageStatusType = typeof MessageStatus[keyof typeof MessageStatus];

// ============================================================================
// CONVERSATION STATUS ENUMS
// ============================================================================

export const ConversationStatus = {
  OPEN: 'open',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
} as const;

export type ConversationStatusType = typeof ConversationStatus[keyof typeof ConversationStatus];

// ============================================================================
// CLIENT STATUS ENUMS (includes TRIAL tier)
// ============================================================================

export const ClientStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
  INACTIVE: 'inactive',
} as const;

export type ClientStatusType = typeof ClientStatus[keyof typeof ClientStatus];

// ============================================================================
// BILLING CYCLE ENUMS
// ============================================================================

export const BillingCycle = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type BillingCycleType = typeof BillingCycle[keyof typeof BillingCycle];

// ============================================================================
// ENUM ARRAYS (for form selects, dropdowns, etc)
// ============================================================================

export const USER_ROLE_OPTIONS = Object.values(UserRole);
export const USER_STATUS_OPTIONS = Object.values(UserStatus);
export const WHATSAPP_STATUS_OPTIONS = Object.values(WhatsAppConnectionStatus);
export const MESSAGE_DIRECTION_OPTIONS = Object.values(MessageDirection);
export const MESSAGE_TYPE_OPTIONS = Object.values(MessageType);
export const MESSAGE_STATUS_OPTIONS = Object.values(MessageStatus);
export const CONVERSATION_STATUS_OPTIONS = Object.values(ConversationStatus);
export const CLIENT_STATUS_OPTIONS = Object.values(ClientStatus);
export const BILLING_CYCLE_OPTIONS = Object.values(BillingCycle);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isValidUserRole(value: string): value is UserRoleType {
  return Object.values(UserRole).includes(value as UserRoleType);
}

export function isValidUserStatus(value: string): value is UserStatusType {
  return Object.values(UserStatus).includes(value as UserStatusType);
}

export function isValidWhatsAppStatus(value: string): value is WhatsAppConnectionStatusType {
  return Object.values(WhatsAppConnectionStatus).includes(value as WhatsAppConnectionStatusType);
}

export function isValidMessageDirection(value: string): value is MessageDirectionType {
  return Object.values(MessageDirection).includes(value as MessageDirectionType);
}

export function isValidMessageType(value: string): value is MessageTypeType {
  return Object.values(MessageType).includes(value as MessageTypeType);
}

export function isValidMessageStatus(value: string): value is MessageStatusType {
  return Object.values(MessageStatus).includes(value as MessageStatusType);
}

export function isValidConversationStatus(value: string): value is ConversationStatusType {
  return Object.values(ConversationStatus).includes(value as ConversationStatusType);
}
