import {
  SiteBranch,
  SecurityCompany,
  Incident,
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
export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-sample-8842',
    code: 'INC-2026-0842',
    title: 'Perimeter Intrusion & Armed Response Escalation',
    category: 'PANIC_GENERAL',
    status: 'responding',
    severity: 'high',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    houseId: 'unit-p2',
    houseNumber: 'Gate 4 / West Perimeter',
    deviceId: 'term-p2-01',
    reporterId: 'usr-guard-1',
    reporterName: 'Officer Sipho Khumalo',
    reporterPhone: '+27 82 555 1204',
    reporterRole: 'guard',
    coordinates: {
      lat: -26.10756,
      lng: 28.0567,
      address: 'Sandton City Level P2 North Perimeter Gate'
    },
    tracingActive: true,
    tracingHistory: [
      { lat: -26.10756, lng: 28.0567 },
      { lat: -26.1076, lng: 28.0568 }
    ],
    assignedResponders: [
      {
        guardId: 'usr-guard-1',
        name: 'Officer Sipho Khumalo',
        callSign: 'ALPHA-1',
        etaMinutes: 2,
        currentCoords: { lat: -26.1075, lng: 28.0566 },
        status: 'on_scene'
      },
      {
        guardId: 'usr-guard-2',
        name: 'Officer Tendai Moyo',
        callSign: 'BRAVO-2',
        etaMinutes: 5,
        currentCoords: { lat: -26.108, lng: 28.057 },
        status: 'en_route'
      }
    ],
    timeline: [
      {
        id: 'tl-1',
        timestamp: '2026-08-24 11:02:15',
        action: 'Panic Button Triggered',
        actor: 'Officer Sipho Khumalo',
        notes: 'Fixed panic terminal activated at Level P2 North Perimeter Gate after visual confirmation of unauthorized scaling.'
      },
      {
        id: 'tl-2',
        timestamp: '2026-08-24 11:03:00',
        action: 'Control Room Dispatch',
        actor: 'Dispatcher Kagiso (Control Room)',
        notes: 'Dispatched Armed Response Units Alpha-1 & Bravo-2. SAPS Station Commander notified.'
      },
      {
        id: 'tl-3',
        timestamp: '2026-08-24 11:04:30',
        action: 'Unit Arrival On Scene',
        actor: 'Officer Sipho Khumalo (ALPHA-1)',
        notes: 'Arrived on scene at P2 North Gate. Perimeter fence wire cut identified near section 4B. Suspect fled east.'
      },
      {
        id: 'tl-4',
        timestamp: '2026-08-24 11:08:10',
        action: 'Photographic Evidence Captured',
        actor: 'Officer Sipho Khumalo',
        notes: 'Captured high-resolution photographs of severed security fence wire and dropped bolt cutters.'
      }
    ],
    notes: 'Perimeter fence breach near section 4B. CCTV camera 12 footage secured for SAPS forensics.',
    responderNotes: 'Perimeter breach contained. Primary gate locked down. High-definition photographic evidence recorded and stored in armory audit vault. Bolt cutters tagged for SAPS forensics.',
    evidencePhotos: [
      {
        id: 'ev-1',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?auto=format&fit=crop&w=600&q=80',
        caption: 'Severed perimeter fence tension wire at Section 4B',
        uploadedAt: '2026-08-24T11:08:10Z',
        uploadedBy: 'Officer Sipho Khumalo (ALPHA-1)'
      },
      {
        id: 'ev-2',
        url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80',
        caption: 'Secured perimeter gate entry & body camera review point',
        uploadedAt: '2026-08-24T11:10:00Z',
        uploadedBy: 'Officer Tendai Moyo (BRAVO-2)'
      }
    ],
    legalDossierRef: 'DOSSIER-2026-AEGIS-8842-A',
    createdAt: '2026-08-24T11:02:15Z'
  }
];
export const INITIAL_CHECKPOINTS = [];
export const INITIAL_PATROL_SCANS = [];
export const INITIAL_OB_ENTRIES = [];
export interface EquipmentItemImport {
  // placeholder
}

export const INITIAL_EQUIPMENT: any[] = [
  {
    id: 'eq-101',
    serialNumber: 'MOT-8890-TX',
    name: 'Motorola APX 8000 Tactical Radio',
    category: 'Radio / Walkie',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    status: 'available',
    condition: 'Excellent',
    lastInspectionDate: '2026-08-20',
    batteryHealthPercent: 98,
    maintenanceHistory: [
      {
        id: 'maint-101-1',
        loggedAt: '2026-06-12T10:30:00Z',
        loggedBy: 'Control Supervisor Kagiso',
        issueDescription: 'Volume dial loose and intermittent channel interference on UHF channel 3',
        remedyAction: 'Replaced rotary dial potentiometer and re-calibrated frequency synthesizer.',
        technicianName: 'SpectrumComms Repair Lab',
        cost: 450,
        status: 'Repaired',
        resolvedAt: '2026-06-14T14:15:00Z'
      }
    ]
  },
  {
    id: 'eq-102',
    serialNumber: 'AXN-4421-BW',
    name: 'Axon Body 3 HD Camera',
    category: 'Body Camera',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    status: 'issued',
    assignedTo: {
      userId: 'usr-guard-1',
      userName: 'Officer Sipho Khumalo',
      issuedAt: '2026-08-24T06:00:00Z',
      expectedReturnAt: '2026-08-24T18:00:00Z'
    },
    condition: 'Good',
    lastInspectionDate: '2026-08-24',
    batteryHealthPercent: 88,
    maintenanceHistory: []
  },
  {
    id: 'eq-103',
    serialNumber: 'PAT-9081-PH',
    name: 'Samsung XCover Tactical Patrol Phone',
    category: 'Patrol Phone',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    status: 'maintenance',
    condition: 'Damaged',
    lastInspectionDate: '2026-08-22',
    batteryHealthPercent: 42,
    maintenanceHistory: [
      {
        id: 'maint-103-1',
        loggedAt: '2026-08-22T16:45:00Z',
        loggedBy: 'Guard Lucas Sithole',
        issueDescription: 'Cracked gorilla glass display screen after vehicular patrol drop; NFC scanner intermittent',
        remedyAction: 'Replaced front display assembly, re-sealed IP68 rubber gasket, running firmware diagnostics.',
        technicianName: 'Sithole Mobile Repair Depot',
        cost: 1250,
        status: 'In Maintenance'
      }
    ]
  },
  {
    id: 'eq-104',
    serialNumber: 'VST-2201-LV3',
    name: 'Level IIIA Ballistic Vest & Plate Carrier',
    category: 'Ballistic Vest',
    siteId: 'site-hq',
    siteName: 'Headquarters Central Control',
    companyId: 'comp-aegis',
    status: 'maintenance',
    condition: 'Damaged',
    lastInspectionDate: '2026-08-23',
    maintenanceHistory: [
      {
        id: 'maint-104-1',
        loggedAt: '2026-08-23T08:15:00Z',
        loggedBy: 'Officer Tendai Moyo',
        issueDescription: 'Side MOLLE webbing torn near left shoulder strap during perimeter fence escalation.',
        remedyAction: 'Sent to Tactical Stitching & Armor Lab for reinforced Kevlar seam restitching and ballistic plate alignment.',
        technicianName: 'ArmorCraft Tactical ZA',
        cost: 600,
        status: 'Pending Repair'
      }
    ]
  }
];
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
