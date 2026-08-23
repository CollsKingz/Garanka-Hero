import {
  SiteBranch,
  SecurityCompany,
} from './types';

export const INITIAL_COMPANIES: SecurityCompany[] = [
  {
    id: 'comp-aegis',
    name: 'Aegis Security Operations',
    shortCode: 'AEGIS',
    region: 'National Precinct',
    logo: '🛡️',
    supportPhone: '+27 11 000 0000',
    supportEmail: 'control@aegissec.za',
    planName: 'Enterprise Shield Tier',
    planLimitHouses: 50,
    maxDevicesPerHouse: 2,
    activeHousesCount: 0,
  },
];

export const INITIAL_HOUSES = [];
export const INITIAL_USERS = [];
export const INITIAL_INCIDENTS = [];
export const INITIAL_CHECKPOINTS = [];
export const INITIAL_PATROL_SCANS = [];
export const INITIAL_OB_ENTRIES = [];
export const INITIAL_EQUIPMENT = [];
export const INITIAL_AUDIT_LOGS = [];
export const CURRENT_USERS: Record<string, any> = {
  community: {
    id: 'usr-comm-1',
    name: 'Nomsa Dlamini',
    role: 'community',
    phone: '+27 82 123 4567',
    email: 'madihlabatc77@gmail.com',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    companyName: 'Aegis Security Operations',
    assignedHouseId: 'house-14',
  },
  guard: {
    id: 'usr-guard-1',
    name: 'Officer Sipho Khumalo',
    role: 'guard',
    badgeNumber: 'AG-902',
    callSign: 'Alpha-1 Tactical',
    phone: '+27 83 234 5678',
    email: 's.khumalo@aegissec.co.za',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    companyName: 'Aegis Security Operations',
  },
  supervisor: {
    id: 'usr-sup-1',
    name: 'Kagiso Sithole',
    role: 'supervisor',
    badgeNumber: 'SUP-104',
    callSign: 'Control Command',
    phone: '+27 84 345 6789',
    email: 'k.sithole@aegissec.co.za',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    companyName: 'Aegis Security Operations',
  },
  manager: {
    id: 'usr-mgr-1',
    name: 'Mandla Zulu',
    role: 'manager',
    badgeNumber: 'MGR-002',
    phone: '+27 85 456 7890',
    email: 'm.zulu@aegissec.co.za',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    companyName: 'Aegis Security Operations',
  },
  head_office: {
    id: 'usr-ho-1',
    name: 'Director Sarah Jenkins',
    role: 'head_office',
    phone: '+27 86 567 8901',
    email: 's.jenkins@aegissec.co.za',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    companyName: 'Aegis Security Operations',
  },
  admin: {
    id: 'usr-admin-1',
    name: 'System Admin Admin',
    role: 'admin',
    phone: '+27 87 678 9012',
    email: 'admin@aegissec.co.za',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    companyName: 'Aegis Security Operations',
  },
  developer: {
    id: 'usr-dev-1',
    name: 'Super Developer',
    role: 'developer',
    phone: '+27 88 789 0123',
    email: 'dev@aegissec.co.za',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    companyName: 'Aegis Security Operations',
  },
};

export const INITIAL_BRANCHES: SiteBranch[] = [
  {
    id: 'site-hq',
    companyId: 'comp-aegis',
    name: 'Headquarters Central Control',
    region: 'Central',
    address: '1 Security Way, Metro',
    coordinates: { lat: -26.2041, lng: 28.0473 },
    activeGuardsCount: 0,
    openIncidentsCount: 0,
    supervisorName: 'Control Supervisor',
    supervisorPhone: '+27 11 000 0001',
  },
];
