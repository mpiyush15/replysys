// Role definitions - Synced with backend enums
import { UserRole, UserRoleType } from './enums';

export { UserRole };
export type { UserRoleType };

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  isActive: boolean;
}

export interface RolePermission {
  view_dashboard: boolean;
  manage_team: boolean;
  manage_clients: boolean;
  view_reports: boolean;
  manage_settings: boolean;
  manage_business: boolean;
  view_client_activities: boolean;
  manage_client_data: boolean;
}

export const rolePermissions: Record<UserRoleType, RolePermission> = {
  superadmin: {
    view_dashboard: true,
    manage_team: true,
    manage_clients: true,
    view_reports: true,
    manage_settings: true,
    manage_business: true,
    view_client_activities: false,
    manage_client_data: false,
  },
  client: {
    view_dashboard: true,
    manage_team: false,
    manage_clients: false,
    view_reports: false,
    manage_settings: false,
    manage_business: false,
    view_client_activities: true,
    manage_client_data: true,
  },
  guest: {
    view_dashboard: false,
    manage_team: false,
    manage_clients: false,
    view_reports: false,
    manage_settings: false,
    manage_business: false,
    view_client_activities: false,
    manage_client_data: false,
  },
};
