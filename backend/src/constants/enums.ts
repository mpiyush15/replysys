/**
 * Centralized Enum Definitions
 * Single source of truth for all enum values across the entire platform
 * Use these constants instead of hardcoded strings to prevent inconsistencies
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
// ACCOUNT STATUS ENUMS
// ============================================================================

export const AccountStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
} as const;

export type AccountStatusType = typeof AccountStatus[keyof typeof AccountStatus];

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
// CONVERSATION STATUS ENUMS
// ============================================================================

export const ConversationStatus = {
  OPEN: 'open',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
} as const;

export type ConversationStatusType = typeof ConversationStatus[keyof typeof ConversationStatus];

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
// USER ROLE ENUMS
// ============================================================================

export const UserRole = {
  SUPERADMIN: 'superadmin',
  CLIENT: 'client',
  GUEST: 'guest', // Frontend-only role
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Backend-only roles (excludes guest)
export type BackendUserRoleType = Exclude<UserRoleType, 'guest'>;

// ============================================================================
// BILLING CYCLE ENUMS
// ============================================================================

export const BillingCycle = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type BillingCycleType = typeof BillingCycle[keyof typeof BillingCycle];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate a value is a valid enum member
 * Usage: isValidUserStatus('active') // true
 */
export function isValidUserStatus(value: string): value is UserStatusType {
  return Object.values(UserStatus).includes(value as UserStatusType);
}

export function isValidAccountStatus(value: string): value is AccountStatusType {
  return Object.values(AccountStatus).includes(value as AccountStatusType);
}

export function isValidClientStatus(value: string): value is ClientStatusType {
  return Object.values(ClientStatus).includes(value as ClientStatusType);
}

export function isValidConversationStatus(value: string): value is ConversationStatusType {
  return Object.values(ConversationStatus).includes(value as ConversationStatusType);
}

export function isValidWhatsAppStatus(value: string): value is WhatsAppConnectionStatusType {
  return Object.values(WhatsAppConnectionStatus).includes(value as WhatsAppConnectionStatusType);
}

export function isValidOAuthStatus(value: string): value is OAuthStatusType {
  return Object.values(OAuthStatus).includes(value as OAuthStatusType);
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

export function isValidUserRole(value: string): value is UserRoleType {
  return Object.values(UserRole).includes(value as UserRoleType);
}

export function isValidBillingCycle(value: string): value is BillingCycleType {
  return Object.values(BillingCycle).includes(value as BillingCycleType);
}

// ============================================================================
// ENUM ARRAYS (for form selects, dropdowns, etc)
// ============================================================================

export const USER_STATUS_OPTIONS = Object.values(UserStatus);
export const ACCOUNT_STATUS_OPTIONS = Object.values(AccountStatus);
export const CLIENT_STATUS_OPTIONS = Object.values(ClientStatus);
export const CONVERSATION_STATUS_OPTIONS = Object.values(ConversationStatus);
export const WHATSAPP_STATUS_OPTIONS = Object.values(WhatsAppConnectionStatus);
export const MESSAGE_TYPE_OPTIONS = Object.values(MessageType);
export const MESSAGE_DIRECTION_OPTIONS = Object.values(MessageDirection);
export const MESSAGE_STATUS_OPTIONS = Object.values(MessageStatus);
export const USER_ROLE_OPTIONS = Object.values(UserRole);
export const BILLING_CYCLE_OPTIONS = Object.values(BillingCycle);
