export type UserRole =
  | 'community'
  | 'guard'
  | 'supervisor'
  | 'admin'
  | 'manager'
  | 'headoffice'
  | 'developer';

export type IncidentStatus = 'triggered' | 'acknowledged' | 'responding' | 'on_scene' | 'resolved' | 'false_alarm';

export type IncidentCategory =
  | 'PANIC_GENERAL'
  | 'ARMED_ROBBERY'
  | 'MEDICAL_EMERGENCY'
  | 'FIRE_HAZARD'
  | 'ASSAULT'
  | 'SUSPICIOUS_PERSON'
  | 'UNAUTHORIZED_ENTRY'
  | 'VEHICLE_THEFT';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
  address?: string;
}

export interface IncidentRosterMember {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  callSign?: string;
  assignedAt?: string;
  joinedAt?: string;
  status: 'assigned' | 'acknowledged' | 'dispatched' | 'en_route' | 'on_scene' | 'monitoring';
}

export interface VoiceRoomParticipant {
  userId: string;
  name: string;
  role: UserRole;
  callSign?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isPttActive?: boolean;
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor';
  latencyMs: number;
  joinedAt: string;
}

export interface IncidentVoiceRoomInfo {
  roomId?: string;
  id?: string;
  channelName: string;
  status?: 'active' | 'closed';
  active?: boolean;
  authorizedRoleKeys?: string[];
  participants: VoiceRoomParticipant[];
  startedAt?: string;
}

export interface Incident {
  id: string;
  code: string; // e.g. INC-2026-0842
  title: string;
  category: IncidentCategory;
  status: IncidentStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  siteId: string;
  siteName: string;
  companyId: string;
  houseId?: string;
  houseNumber?: string;
  deviceId?: string;
  reporterId: string;
  reporterName: string;
  reporterPhone: string;
  reporterRole: UserRole;
  coordinates: Coordinates;
  tracingActive: boolean;
  tracingHistory: Coordinates[];
  roster?: IncidentRosterMember[];
  voiceRoom?: IncidentVoiceRoomInfo;
  assignedResponders: {
    guardId: string;
    name: string;
    callSign: string;
    etaMinutes: number;
    currentCoords: Coordinates;
    status: 'en_route' | 'on_scene';
  }[];
  timeline: {
    id: string;
    timestamp: string;
    action: string;
    actor: string;
    notes?: string;
  }[];
  notes?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface Checkpoint {
  id: string;
  siteId: string;
  siteName: string;
  companyId: string;
  name: string;
  zone: string;
  code: string; // QR text string
  coordinates: Coordinates;
  requiredTimeWindowMinutes?: number;
  lastScannedAt?: string;
  lastScannedBy?: string;
}

export interface PatrolScan {
  id: string;
  checkpointId: string;
  checkpointName: string;
  zone: string;
  siteId: string;
  companyId: string;
  guardId: string;
  guardName: string;
  timestamp: string;
  coordinates: Coordinates;
  notes?: string;
  status: 'verified' | 'flagged' | 'pending';
  imageUrl?: string;
}

export interface OBEntry {
  id: string;
  obNumber: string; // e.g. OB 142/08/2026
  siteId: string;
  siteName: string;
  companyId: string;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  category: IncidentCategory | 'GENERAL_OBSERVATION' | 'ACCESS_CONTROL' | 'MAINTENANCE_DEFECT' | 'SHIFT_HANDOVER';
  description: string;
  timestamp: string;
  coordinates: Coordinates;
  status: 'draft' | 'submitted' | 'approved' | 'investigating';
  attachments?: {
    type: 'photo' | 'signature' | 'audio';
    url: string;
    name: string;
  }[];
  supervisorSignature?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface EquipmentItem {
  id: string;
  serialNumber: string;
  name: string;
  category: 'Radio / Walkie' | 'Body Camera' | 'Baton' | 'Flashlight' | 'Ballistic Vest' | 'Metal Detector' | 'Patrol Phone';
  siteId: string;
  siteName: string;
  companyId: string;
  status: 'available' | 'issued' | 'maintenance' | 'lost';
  assignedTo?: {
    userId: string;
    userName: string;
    issuedAt: string;
    expectedReturnAt: string;
  };
  condition: 'Excellent' | 'Good' | 'Fair' | 'Damaged';
  lastInspectionDate: string;
  batteryHealthPercent?: number;
}

export interface SiteBranch {
  id: string;
  companyId: string;
  name: string;
  region: string;
  address: string;
  coordinates: Coordinates;
  activeGuardsCount: number;
  openIncidentsCount: number;
  supervisorName: string;
  supervisorPhone: string;
}

// ----------------------------------------------------
// MULTI-TENANT SECURITY COMPANY & HOUSES / DEVICES MODEL
// ----------------------------------------------------

export interface RegisteredDevice {
  id: string;
  houseId: string;
  deviceName: string;
  deviceType: 'mobile_app' | 'guard_terminal' | 'iot_keyfob';
  deviceUid: string;
  registeredAt: string;
  lastActive: string;
  batteryPercent: number;
  status: 'active' | 'offline' | 'unlinked';
  approvalStatus?: 'pending' | 'approved' | 'declined';
}

export interface HouseUnit {
  id: string;
  companyId: string;
  siteId: string;
  houseNumber: string; // e.g. "Unit 14"
  streetAddress: string; // e.g. "14 Maple Ridge, Sandton"
  residentName: string;
  residentEmail: string;
  residentPhone: string;
  registeredDevices: RegisteredDevice[]; // Maximum 2 devices
  coordinates: Coordinates;
  joinedDate: string;
  status: 'active' | 'suspended';
}

export interface SecurityCompany {
  id: string;
  name: string;
  shortCode: string;
  region: string;
  logo: string;
  supportPhone: string;
  supportEmail: string;
  department?: string; // Developer-only field
  planName: string;
  planLimitHouses: number; // strictly 50
  maxDevicesPerHouse: number; // strictly 2
  activeHousesCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  badgeNumber?: string;
  callSign?: string;
  phone: string;
  email: string;
  siteId: string;
  siteName: string;
  companyId: string;
  companyName: string;
  assignedHouseId?: string;
  assignedDeviceId?: string;
  avatar?: string;
  location?: Coordinates;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  companyId: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface GlobalFilterState {
  siteId: string;
  houseId: string;
  deviceId: string;
  timeRange: 'today' | '7days' | '30days' | 'shift';
  incidentStatus: 'all' | 'new' | 'responding' | 'resolved';
}
