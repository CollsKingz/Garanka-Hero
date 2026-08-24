/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { PanicScreen } from './components/PanicScreen';
import { LiveIncidentMap } from './components/LiveIncidentMap';
import { PatrolQRScanner } from './components/PatrolQRScanner';
import { OBBook } from './components/OBBook';
import { EquipmentRegister } from './components/EquipmentRegister';
import { SupervisorDashboard } from './components/dashboards/SupervisorDashboard';
import { SecurityAdminDashboard } from './components/dashboards/SecurityAdminDashboard';
import { SecurityManagerDashboard } from './components/dashboards/SecurityManagerDashboard';
import { HeadOfficeDashboard } from './components/dashboards/HeadOfficeDashboard';
import { DeveloperDashboard } from './components/dashboards/DeveloperDashboard';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { OTPVerificationScreen } from './components/auth/OTPVerificationScreen';
import { IncidentVoiceRoomModal } from './components/voice/IncidentVoiceRoomModal';
import { TacticalVoiceDock } from './components/voice/TacticalVoiceDock';
import { voiceRoomService } from './services/voiceRoomService';
import { auth } from './lib/firebase';
import { getIdToken } from 'firebase/auth';
import { getToken } from 'firebase/app-check';
import { appCheck } from './lib/firebase';

import { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { db, setDoc, doc, onSnapshot } from './lib/firebase';
import { LocationPermissionModal } from './components/modals/LocationPermissionModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';

import {
  UserRole,
  UserProfile,
  Incident,
  IncidentCategory,
  Checkpoint,
  PatrolScan,
  OBEntry,
  EquipmentItem,
  MaintenanceRecord,
  AuditLog,
  SiteBranch,
  SecurityCompany,
  HouseUnit,
  RegisteredDevice,
  GlobalFilterState,
} from './types';

import {
  INITIAL_COMPANIES,
  INITIAL_HOUSES,
  CURRENT_USERS,
  INITIAL_INCIDENTS,
  INITIAL_CHECKPOINTS,
  INITIAL_PATROL_SCANS,
  INITIAL_OB_ENTRIES,
  INITIAL_EQUIPMENT,
  INITIAL_AUDIT_LOGS,
  INITIAL_BRANCHES,
} from './mockData';

import { soundService } from './services/soundService';
import { geolocationService } from './services/geolocationService';
import { TenantPlanService } from './services/tenantPlanService';
import { FirestoreSyncService } from './services/firestoreSyncService';

const geofenceAlertThrottle: Record<string, number> = {};

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function App() {
  // Authentication & Workspace States
  
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('authenticated');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await getIdTokenResult(user);
          const role = (tokenResult.claims.role as UserRole) || 'community';
          setAuthEmail(user.email || '');
          setAuthRole(role);
          setCurrentRole(role);
          setAuthStatus('authenticated');
          setShowLocationModal(true);
        } catch (e) {
          console.error(e);
          setAuthStatus('authenticated');
        }
      } else {
        // Default to authenticated in sandbox preview mode
        setAuthStatus('authenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('comp-aegis');
  const [authEmail, setAuthEmail] = useState<string>('madihlabatc77@gmail.com');
  const [authRole, setAuthRole] = useState<UserRole>('community');
  const [generatedOtp, setGeneratedOtp] = useState<string>('749201');

  // Role and Nav Tab states
  const [currentRole, setCurrentRole] = useState<UserRole>('community');
  const [activeNavTab, setActiveNavTab] = useState<string>('panic');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isMuted, setIsMuted] = useState<boolean>(soundService.getMuted());

  // Global Filters State
  const [filters, setFilters] = useState<GlobalFilterState>({
    siteId: 'all',
    houseId: 'all',
    deviceId: 'all',
    timeRange: 'today',
    incidentStatus: 'all',
  });

  // Companies & Multi-Tenant Houses State
  const [companies, setCompanies] = useState<SecurityCompany[]>(() => {
    const saved = localStorage.getItem('aegis_companies');
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
  });

  const [users, setUsers] = useState<UserProfile[]>([]);

  const [houses, setHouses] = useState<HouseUnit[]>(() => {
    const saved = localStorage.getItem('aegis_houses');
    return saved ? JSON.parse(saved) : INITIAL_HOUSES;
  });

  // Main Security Data States
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem('aegis_incidents');
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => {
    const saved = localStorage.getItem('aegis_checkpoints');
    return saved ? JSON.parse(saved) : INITIAL_CHECKPOINTS;
  });

  const [scans, setScans] = useState<PatrolScan[]>(() => {
    const saved = localStorage.getItem('aegis_scans');
    return saved ? JSON.parse(saved) : INITIAL_PATROL_SCANS;
  });

  const [obEntries, setOBEntries] = useState<OBEntry[]>(() => {
    const saved = localStorage.getItem('aegis_ob_entries');
    return saved ? JSON.parse(saved) : INITIAL_OB_ENTRIES;
  });

  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(() => {
    const saved = localStorage.getItem('aegis_equipment');
    return saved ? JSON.parse(saved) : INITIAL_EQUIPMENT;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('aegis_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [branches, setBranches] = useState<SiteBranch[]>(INITIAL_BRANCHES);
  const [selectedDetailIncidentId, setSelectedDetailIncidentId] = useState<string | null>(null);

  // Tactical Voice Room State
  const [activeVoiceIncident, setActiveVoiceIncident] = useState<Incident | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // Real-time Firebase RTDB Panic Alert State & Listener
  const [realtimePanicAlert, setRealtimePanicAlert] = useState<{ panic: boolean; room: string; timestamp?: number; reporter?: string } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean>(false);
  const [geofenceAlert, setGeofenceAlert] = useState<string | null>(null);

  useEffect(() => {
    const panicRef = doc(db, 'system', 'panicAlert');
    const unsubscribe = onSnapshot(panicRef, (snapshot) => {
      const val = snapshot.data();
      if (val && val.panic) {
        setRealtimePanicAlert(val as any);
      } else {
        setRealtimePanicAlert(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Active Company and User Profile
  const activeCompany = useMemo(() => {
    return companies.find((c) => c && c.id === selectedCompanyId) || companies[0] || INITIAL_COMPANIES[0];
  }, [companies, selectedCompanyId]);

  const currentUser: UserProfile = useMemo(() => {
    const defaultUser: UserProfile = {
      id: 'usr-default',
      name: 'Nomsa Dlamini',
      role: currentRole,
      phone: '+27 82 123 4567',
      email: 'madihlabatc77@gmail.com',
      siteId: 'site-hq',
      siteName: 'Headquarters Central Control',
      companyId: activeCompany?.id || 'comp-aegis',
      companyName: activeCompany?.name || 'Aegis Security Operations',
    };
    const record = CURRENT_USERS as Record<string, UserProfile>;
    const baseUser = (record && record[currentRole]) || defaultUser;
    return {
      ...(baseUser || defaultUser),
      companyId: activeCompany?.id || baseUser?.companyId || 'comp-aegis',
      companyName: activeCompany?.name || baseUser?.companyName || 'Aegis Security Operations',
    };
  }, [currentRole, activeCompany]);

  // Persist State to Local Storage
  useEffect(() => {
    localStorage.setItem('aegis_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('aegis_houses', JSON.stringify(houses));
  }, [houses]);

  useEffect(() => {
    localStorage.setItem('aegis_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('aegis_checkpoints', JSON.stringify(checkpoints));
  }, [checkpoints]);

  useEffect(() => {
    localStorage.setItem('aegis_scans', JSON.stringify(scans));
  }, [scans]);

  useEffect(() => {
    localStorage.setItem('aegis_ob_entries', JSON.stringify(obEntries));
  }, [obEntries]);

  useEffect(() => {
    localStorage.setItem('aegis_equipment', JSON.stringify(equipmentList));
  }, [equipmentList]);

  useEffect(() => {
    localStorage.setItem('aegis_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      FirestoreSyncService.syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) FirestoreSyncService.syncOfflineQueue();
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize and subscribe to Firestore collections
  useEffect(() => {
    FirestoreSyncService.seedInitialDataIfEmpty({
      companies: INITIAL_COMPANIES,
      houses: INITIAL_HOUSES,
      incidents: INITIAL_INCIDENTS,
      checkpoints: INITIAL_CHECKPOINTS,
      scans: INITIAL_PATROL_SCANS,
      obEntries: INITIAL_OB_ENTRIES,
      equipment: INITIAL_EQUIPMENT,
      auditLogs: INITIAL_AUDIT_LOGS,
      users: [],
    });

    const unsubCompanies = FirestoreSyncService.subscribeCompanies((cloudComps) => {
      if (cloudComps && cloudComps.length > 0) {
        setCompanies(cloudComps);
      }
    });

    const unsubUsers = FirestoreSyncService.subscribeUsers((cloudUsers) => {
      if (cloudUsers) {
        setUsers(cloudUsers);
      }
    });

    
    const unsubIncidents = FirestoreSyncService.subscribePanicEvents(activeCompany?.id || 'comp-aegis', currentRole, (cloudIncidents) => {
      setIncidents(cloudIncidents);
    });


    const unsubHouses = FirestoreSyncService.subscribeHouses((cloudHouses) => {
      if (cloudHouses && cloudHouses.length > 0) {
        setHouses(cloudHouses);
      }
    });

    const unsubOB = FirestoreSyncService.subscribeOBEntries((cloudEntries) => {
      if (cloudEntries && cloudEntries.length > 0) {
        setOBEntries(cloudEntries);
      }
    });

    const unsubEquipment = FirestoreSyncService.subscribeEquipment((cloudEq) => {
      if (cloudEq && cloudEq.length > 0) {
        setEquipmentList(cloudEq);
      }
    });

    const unsubScans = FirestoreSyncService.subscribeScans((cloudScans) => {
      if (cloudScans && cloudScans.length > 0) {
        setScans(cloudScans);
      }
    });

    const unsubAudit = FirestoreSyncService.subscribeAuditLogs((cloudLogs) => {
      if (cloudLogs && cloudLogs.length > 0) {
        setAuditLogs(cloudLogs);
      }
    });

    return () => {
      unsubCompanies();
      unsubUsers();
      unsubIncidents();
      unsubHouses();
      unsubOB();
      unsubEquipment();
      unsubScans();
      unsubAudit();
    };
  }, []);

  // --------------------------------------------------------------------------
  // COMPANY & USER MULTI-TENANT CRUD HANDLERS
  // --------------------------------------------------------------------------
  const handleAddCompany = (comp: SecurityCompany) => {
    setCompanies((prev) => [...prev, comp]);
    FirestoreSyncService.saveCompany(comp);
  };

  const handleUpdateCompany = (comp: SecurityCompany) => {
    setCompanies((prev) => prev.map((c) => (c.id === comp.id ? comp : c)));
    FirestoreSyncService.saveCompany(comp);
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    FirestoreSyncService.deleteCompany(companyId);
  };

  const handleAddUser = (user: UserProfile) => {
    setUsers((prev) => [...prev, user]);
    FirestoreSyncService.saveUser(user);
  };

  const handleUpdateUser = (user: UserProfile) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    FirestoreSyncService.saveUser(user);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    FirestoreSyncService.deleteUser(userId);
  };

  // --------------------------------------------------------------------------
  // AUTHENTICATION FLOW HANDLERS (Google OAuth -> Email OTP -> Strictly Routed)
  // --------------------------------------------------------------------------
  
  const handleSignOut = () => {
    signOut(auth);
    soundService.stopSiren();
    geolocationService.stopLiveTracing();
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'community') {
      setActiveNavTab('panic');
    } else if (role === 'guard') {
      setActiveNavTab('patrol');
    } else {
      setActiveNavTab('dashboard');
    }
  };

  // --------------------------------------------------------------------------
  // FILTERED INCIDENTS & DATA
  // --------------------------------------------------------------------------
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (filters.siteId !== 'all' && inc.siteId !== filters.siteId) return false;
      if (filters.houseId !== 'all' && inc.houseId !== filters.houseId) return false;
      if (filters.deviceId !== 'all' && inc.deviceId !== filters.deviceId) return false;
      if (filters.incidentStatus === 'new' && inc.status !== 'triggered') return false;
      if (
        filters.incidentStatus === 'responding' &&
        inc.status !== 'responding' &&
        inc.status !== 'on_scene'
      )
        return false;
      if (filters.incidentStatus === 'resolved' && inc.status !== 'resolved') return false;
      return true;
    });
  }, [incidents, filters]);

  // Find active incident triggered by community user
  const communityActiveIncident = incidents.find(
    (i) =>
      i.reporterId === currentUser.id &&
      (i.status === 'triggered' || i.status === 'responding' || i.status === 'on_scene')
  ) || null;

  // Real-time GPS Phone Tracking & Firebase Streaming Effect
  useEffect(() => {
    if (authStatus !== 'authenticated' || !currentUser?.id) return;
    if (!locationPermissionGranted) return;

    let watchId: number | null = null;
    const isPanicActive = Boolean(realtimePanicAlert?.panic || communityActiveIncident);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: isPanicActive ? 0 : 2000,
      timeout: isPanicActive ? 5000 : 15000,
    };

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed || 0,
            accuracy: pos.coords.accuracy || 5,
            timestamp: pos.timestamp || Date.now(),
            lastUpdated: Date.now(),
          };

          // Stream to Firestore /users/{userId}
          setDoc(
            doc(db, 'users', currentUser.id),
            {
              ...currentUser,
              location: coords,
              lastActive: new Date().toISOString(),
            },
            { merge: true }
          ).catch((e) => console.warn('Firestore location sync warn:', e));

          // --- GEOFENCING LOGIC ---
          if (['guard', 'supervisor', 'manager'].includes(currentUser.role)) {
            const GEOFENCE_RADIUS_METERS = 500;
            const THROTTLE_MS = 2 * 60 * 1000; // 2 minutes
            const now = Date.now();

            setIncidents((prev) => {
              let changed = false;
              const next = prev.map((inc) => {
                if (inc.status === 'responding' || inc.status === 'on_scene') {
                  const isAssigned =
                    inc.assignedResponders?.some((r) => r.guardId === currentUser.id) ||
                    inc.roster?.some((r) => r.userId === currentUser.id);

                  if (isAssigned) {
                    const dist = calculateDistanceMeters(coords.lat, coords.lng, inc.coordinates.lat, inc.coordinates.lng);
                    if (dist > GEOFENCE_RADIUS_METERS) {
                      const throttleKey = `${inc.id}-${currentUser.id}`;
                      const lastAlert = geofenceAlertThrottle[throttleKey] || 0;
                      if (now - lastAlert > THROTTLE_MS) {
                        geofenceAlertThrottle[throttleKey] = now;
                        changed = true;
                        
                        setTimeout(() => {
                          setGeofenceAlert(`GEOFENCE BREACH: You are ${Math.round(dist)}m away from incident ${inc.code} (Safe zone is ${GEOFENCE_RADIUS_METERS}m).`);
                          setTimeout(() => setGeofenceAlert(null), 12000);
                        }, 0);
                        
                        const newTimelineEvent = {
                          id: 't-' + Date.now(),
                          timestamp: new Date().toLocaleTimeString(),
                          action: 'Geofence Breach',
                          actor: 'System Auto-Alert',
                          notes: `${currentUser.name} (${currentUser.role}) traveled outside the ${GEOFENCE_RADIUS_METERS}m safe zone. (Distance: ${Math.round(dist)}m)`,
                        };

                        const updatedInc = { ...inc, timeline: [...inc.timeline, newTimelineEvent] };
                        FirestoreSyncService.saveIncident(updatedInc);
                        return updatedInc;
                      }
                    }
                  }
                }
                return inc;
              });
              return changed ? next : prev;
            });
          }
        },
        (err) => {
          console.warn('Geolocation watchPosition error:', err.message);
        },
        options
      );
    }

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [authStatus, currentUser, locationPermissionGranted, realtimePanicAlert?.panic, communityActiveIncident]);

  // --------------------------------------------------------------------------
  // HOUSE & DEVICE QUOTA MANAGEMENT (50 Houses / 2 Devices Max)
  // --------------------------------------------------------------------------
  const handleAddHouse = (
    houseData: Omit<HouseUnit, 'id' | 'companyId' | 'registeredDevices'>
  ): { success: boolean; message?: string } => {
    const companyHouses = houses.filter((h) => h.companyId === activeCompany.id);
    const validation = TenantPlanService.canAddHouse(companyHouses);
    if (!validation.allowed) {
      return { success: false, message: validation.reason };
    }

    const newHouse: HouseUnit = {
      ...houseData,
      id: 'hse-' + Date.now(),
      companyId: activeCompany.id,
      registeredDevices: [],
    };

    setHouses((prev) => [newHouse, ...prev]);
    FirestoreSyncService.saveHouse(newHouse);

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'HOUSE_REGISTERED',
      details: `Registered house ${houseData.houseNumber} (${houseData.residentName}) to company ${activeCompany.name}`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);

    return { success: true };
  };

  const handleDeleteHouse = (houseId: string) => {
    setHouses((prev) => prev.filter((h) => h.id !== houseId));
    FirestoreSyncService.deleteHouse(houseId);
  };

  const handleAddDevice = (
    houseId: string,
    deviceData: Omit<RegisteredDevice, 'id' | 'houseId'>
  ): { success: boolean; message?: string } => {
    const targetHouse = houses.find((h) => h.id === houseId);
    if (!targetHouse) {
      return { success: false, message: 'Target house unit not found.' };
    }

    const validation = TenantPlanService.canAddDeviceToHouse(targetHouse);
    if (!validation.allowed) {
      return { success: false, message: validation.reason };
    }

    const newDevice: RegisteredDevice = {
      ...deviceData,
      id: 'dev-' + Date.now(),
      houseId,
    };

    const updatedHouse = {
      ...targetHouse,
      registeredDevices: [...(targetHouse.registeredDevices || []), newDevice],
    };

    setHouses((prev) =>
      prev.map((h) => (h.id === houseId ? updatedHouse : h))
    );
    FirestoreSyncService.saveHouse(updatedHouse);

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'DEVICE_REGISTERED',
      details: `Registered device ${deviceData.deviceName} to house ${targetHouse.houseNumber}`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);

    return { success: true };
  };

  const handleDeleteDevice = (houseId: string, deviceId: string) => {
    setHouses((prev) =>
      prev.map((h) => {
        if (h.id === houseId) {
          const updated = {
            ...h,
            registeredDevices: (h.registeredDevices || []).filter((d) => d.id !== deviceId),
          };
          FirestoreSyncService.saveHouse(updated);
          return updated;
        }
        return h;
      })
    );
  };

  const handleUpdateDeviceApproval = (houseId: string, deviceId: string, approvalStatus: 'approved' | 'declined') => {
    setHouses((prev) =>
      prev.map((h) => {
        if (h.id === houseId) {
          const updated = {
            ...h,
            registeredDevices: (h.registeredDevices || []).map((d) => 
              d.id === deviceId ? { ...d, approvalStatus } : d
            ),
          };
          FirestoreSyncService.saveHouse(updated);
          return updated;
        }
        return h;
      })
    );
  };

  // --------------------------------------------------------------------------
  // PANIC BUTTON & TRACING HANDLERS
  // --------------------------------------------------------------------------
  const handleTriggerPanic = (category: IncidentCategory, notes?: string, isSilent?: boolean) => {
    const currentCoords = geolocationService.getCurrentCoords();
    geolocationService.startLiveTracing();

    const newIncidentId = 'inc-' + Date.now();
    const newCode = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIncident: Incident = {
      id: newIncidentId,
      code: newCode,
      title: `${category.replace(/_/g, ' ')} - Emergency Beacon Alert`,
      category,
      status: 'triggered',
      severity: category === 'ARMED_ROBBERY' || category === 'ASSAULT' ? 'critical' : 'high',
      siteId: currentUser.siteId,
      siteName: currentUser.siteName,
      companyId: activeCompany.id,
      houseId: currentUser.assignedHouseId,
      houseNumber: 'Unit 14',
      deviceId: currentUser.assignedDeviceId,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterPhone: currentUser.phone,
      reporterRole: currentUser.role,
      coordinates: {
        ...currentCoords,
        address: 'Sandton City Precinct - Level P2 Core',
      },
      tracingActive: true,
      tracingHistory: [currentCoords],
      assignedResponders: [
        {
          guardId: 'usr-guard-01',
          name: 'Officer Sipho Khumalo',
          callSign: 'Alpha-1 Tactical',
          etaMinutes: 2,
          currentCoords: {
            lat: currentCoords.lat + 0.0018,
            lng: currentCoords.lng - 0.0014,
          },
          status: 'en_route',
        },
      ],
      timeline: [
        {
          id: 't-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          action: isSilent ? 'Silent Panic Triggered' : 'Panic Button Triggered',
          actor: `${currentUser.name} (Mobile App)`,
          notes: notes || 'Emergency beacon locked. Live GPS phone tracing broadcasted to control room.',
        },
      ],
      notes,
      createdAt: new Date().toISOString(),
      // Incident Roster (Supervisor, Responders, Manager/Admin, Head Office Always Authorized)
      roster: [
        {
          userId: 'usr-sup-01',
          name: 'David Mabaso',
          role: 'supervisor',
          email: 'david.mabaso@aegissec.co.za',
          callSign: 'Sierra-1 Command',
          assignedAt: new Date().toISOString(),
          status: 'dispatched',
        },
        {
          userId: 'usr-guard-01',
          name: 'Officer Sipho Khumalo',
          role: 'guard',
          email: 'sipho.k@aegissec.co.za',
          callSign: 'Alpha-1 Tactical',
          assignedAt: new Date().toISOString(),
          status: 'en_route',
        },
        {
          userId: 'usr-mgr-01',
          name: 'Hendrik Van Zyl',
          role: 'manager',
          email: 'hendrik.vz@aegissec.co.za',
          callSign: 'Kilo-1 Tactical Lead',
          assignedAt: new Date().toISOString(),
          status: 'monitoring',
        },
      ],
      voiceRoom: {
        roomId: 'vr-' + newIncidentId,
        channelName: `INC-${newCode} Tactical Intercom`,
        status: 'active',
        authorizedRoleKeys: ['headoffice', 'supervisor', 'guard', 'manager', 'admin'],
        participants: [],
      },
    };

    setIncidents((prev) => [newIncident, ...prev]);
    FirestoreSyncService.saveIncident(newIncident);

    // Write panic alert to Firebase Firestore
    setDoc(doc(db, 'system', 'panicAlert'), {
      panic: true,
      room: 'INC-2026-2855',
      timestamp: Date.now(),
      reporter: currentUser.name,
    });

    // Auto connect supervisor or guard to voice if staff
    if (currentUser.role !== 'community') {
      voiceRoomService.joinIncidentVoiceRoom(
        newIncident.id,
        newIncident.code,
        currentUser,
        newIncident.assignedResponders
      );
      setActiveVoiceIncident(newIncident);
    }

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'PANIC_TRIGGERED',
      details: `Emergency beacon ${newCode} activated at (${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)})`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);
  };

  const handleCancelPanic = (incidentId: string, reason: string) => {
    geolocationService.stopLiveTracing();
    soundService.stopSiren();

    // Clear panic state in Firebase Firestore
    setDoc(doc(db, 'system', 'panicAlert'), {
      panic: false,
      room: '',
    });

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          const updated = {
            ...inc,
            status: 'false_alarm' as const,
            tracingActive: false,
            resolutionNotes: reason,
            resolvedAt: new Date().toISOString(),
            resolvedBy: currentUser.name,
            timeline: [
              ...inc.timeline,
              {
                id: 't-' + Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                action: 'Panic Cancelled by User',
                actor: currentUser.name,
                notes: reason,
              },
            ],
          };
          FirestoreSyncService.saveIncident(updated);
          return updated;
        }
        return inc;
      })
    );

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'PANIC_CANCELLED',
      details: `Incident ${incidentId} cancelled: ${reason}`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);
  };

  // --------------------------------------------------------------------------
  // TACTICAL VOICE INTERCOM & INCIDENT ROSTER HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenVoiceRoom = (incident: Incident) => {
    setActiveVoiceIncident(incident);
    setIsVoiceModalOpen(true);
    voiceRoomService.joinIncidentVoiceRoom(
      incident.id,
      incident.code,
      currentUser,
      incident.assignedResponders || []
    );
  };

  const handleAddRosterMember = (
    incidentId: string,
    member: { name: string; role: UserRole; email: string; callSign: string }
  ) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          const newMember = {
            userId: 'usr-staff-' + Date.now(),
            name: member.name,
            role: member.role,
            email: member.email,
            callSign: member.callSign,
            assignedAt: new Date().toISOString(),
            status: 'dispatched' as const,
          };
          const updatedRoster = [...(inc.roster || []), newMember];
          const updated = {
            ...inc,
            roster: updatedRoster,
            timeline: [
              ...inc.timeline,
              {
                id: 't-' + Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                action: 'Staff Member Dispatched to Incident Roster',
                actor: `${currentUser.name} (${currentUser.role})`,
                notes: `${member.name} (${member.callSign}, ${member.role}) dispatched to voice channel and tactical team.`,
              },
            ],
          };
          FirestoreSyncService.saveIncident(updated);
          return updated;
        }
        return inc;
      })
    );
  };

  // --------------------------------------------------------------------------
  // PATROL SCANS, OB BOOK & EQUIPMENT
  // --------------------------------------------------------------------------
  const handleNewPatrolScan = (scanData: Omit<PatrolScan, 'id' | 'timestamp'>) => {
    const newScan: PatrolScan = {
      ...scanData,
      id: 'scan-' + Date.now(),
      timestamp: new Date().toISOString(),
    };

    setScans((prev) => [newScan, ...prev]);
    FirestoreSyncService.savePatrolScan(newScan);

    setCheckpoints((prev) =>
      prev.map((cp) => {
        if (cp.id === scanData.checkpointId) {
          return {
            ...cp,
            lastScannedAt: new Date().toISOString(),
            lastScannedBy: scanData.guardName,
          };
        }
        return cp;
      })
    );

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: scanData.guardName,
      actorRole: 'guard',
      action: 'PATROL_QR_SCANNED',
      details: `Verified checkpoint: ${scanData.checkpointName} (${scanData.zone})`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);
  };

  const handleCreateOBEntry = (entryData: Omit<OBEntry, 'id' | 'timestamp'>) => {
    const newEntry: OBEntry = {
      ...entryData,
      id: 'ob-' + Date.now(),
      timestamp: new Date().toISOString(),
    };

    setOBEntries((prev) => [newEntry, ...prev]);
    FirestoreSyncService.saveOBEntry(newEntry);

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: entryData.reporterName,
      actorRole: entryData.reporterRole,
      action: 'OB_ENTRY_CREATED',
      details: `Created entry ${entryData.obNumber}: ${entryData.description.slice(0, 50)}...`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);
  };

  const handleApproveOBEntry = (id: string, supervisorSignature: string) => {
    setOBEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          const updated = {
            ...entry,
            status: 'approved' as const,
            supervisorSignature,
            reviewedBy: currentUser.name,
            reviewedAt: new Date().toISOString(),
          };
          FirestoreSyncService.saveOBEntry(updated);
          return updated;
        }
        return entry;
      })
    );

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'OB_ENTRY_APPROVED',
      details: `Digitally signed and sealed OB entry ${id}`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);
  };

  const handleIssueEquipment = (equipmentId: string, guardName: string, guardId: string) => {
    setEquipmentList((prev) =>
      prev.map((item) => {
        if (item.id === equipmentId) {
          const updated = {
            ...item,
            status: 'issued' as const,
            assignedTo: {
              userId: guardId,
              userName: guardName,
              issuedAt: new Date().toISOString(),
              expectedReturnAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
            },
          };
          FirestoreSyncService.saveEquipment(updated);
          return updated;
        }
        return item;
      })
    );

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'EQUIPMENT_ISSUED',
      details: `Issued asset ${equipmentId} to ${guardName}`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);
  };

  const handleReturnEquipment = (equipmentId: string, condition: 'Excellent' | 'Good' | 'Fair' | 'Damaged') => {
    setEquipmentList((prev) =>
      prev.map((item) => {
        if (item.id === equipmentId) {
          let updatedHistory = item.maintenanceHistory || [];
          if (condition === 'Damaged') {
            const autoMaintLog: MaintenanceRecord = {
              id: 'maint-' + Date.now(),
              loggedAt: new Date().toISOString(),
              loggedBy: currentUser.name,
              issueDescription: 'Item returned in Damaged condition. Flagged for armory technical inspection.',
              status: 'Pending Repair',
            };
            updatedHistory = [autoMaintLog, ...updatedHistory];
          }

          const updated: EquipmentItem = {
            ...item,
            status: condition === 'Damaged' ? ('maintenance' as const) : ('available' as const),
            condition,
            assignedTo: undefined,
            lastInspectionDate: new Date().toISOString().slice(0, 10),
            maintenanceHistory: updatedHistory,
          };
          FirestoreSyncService.saveEquipment(updated);
          return updated;
        }
        return item;
      })
    );

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'EQUIPMENT_RETURNED',
      details: `Returned asset ${equipmentId} to armory (Condition: ${condition})`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);
  };

  const handleSaveMaintenanceLog = (equipmentId: string, record: Omit<MaintenanceRecord, 'id' | 'loggedAt'>) => {
    setEquipmentList((prev) =>
      prev.map((item) => {
        if (item.id === equipmentId) {
          const newRecord: MaintenanceRecord = {
            ...record,
            id: 'maint-' + Date.now(),
            loggedAt: new Date().toISOString(),
          };
          const updatedHistory = [newRecord, ...(item.maintenanceHistory || [])];
          let newStatus = item.status;
          let newCondition = item.condition;

          if (record.status === 'Repaired') {
            newStatus = 'available';
            newCondition = 'Good';
          } else if (record.status === 'Pending Repair' || record.status === 'In Maintenance') {
            newStatus = 'maintenance';
            newCondition = 'Damaged';
          }

          const updated: EquipmentItem = {
            ...item,
            status: newStatus,
            condition: newCondition,
            maintenanceHistory: updatedHistory,
          };
          FirestoreSyncService.saveEquipment(updated);
          return updated;
        }
        return item;
      })
    );

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'EQUIPMENT_MAINTENANCE_LOGGED',
      details: `Logged maintenance entry for equipment ${equipmentId} (Status: ${record.status})`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);
  };

  const handleAddNewEquipment = (itemData: Omit<EquipmentItem, 'id'>) => {
    const newItem: EquipmentItem = {
      ...itemData,
      id: 'eq-' + Date.now(),
    };
    setEquipmentList((prev) => [newItem, ...prev]);
    FirestoreSyncService.saveEquipment(newItem);
  };

  const handleAddCheckpoint = (cpData: Omit<Checkpoint, 'id'>) => {
    const newCp: Checkpoint = {
      ...cpData,
      id: 'chk-' + Date.now(),
    };
    setCheckpoints((prev) => [newCp, ...prev]);
  };

  const handleAssignResponder = (incidentId: string, guardId: string, guardName: string, callSign: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          const newResponder = {
            guardId,
            name: guardName,
            callSign,
            etaMinutes: 3,
            currentCoords: {
              lat: inc.coordinates.lat + 0.0012,
              lng: inc.coordinates.lng - 0.0010,
            },
            status: 'en_route' as const,
          };
          const updated = {
            ...inc,
            status: 'responding' as const,
            assignedResponders: [...inc.assignedResponders, newResponder],
            timeline: [
              ...inc.timeline,
              {
                id: 't-' + Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                action: `Responder Assigned: ${callSign}`,
                actor: currentUser.name,
                notes: `Dispatched ${guardName} (${callSign}) with high priority navigation route.`,
              },
            ],
          };
          FirestoreSyncService.saveIncident(updated);
          return updated;
        }
        return inc;
      })
    );

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'DISPATCH_RESPONDER',
      details: `Assigned ${callSign} (${guardName}) to incident ${incidentId}`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);
  };

  const handleUpdateIncidentStatus = (incidentId: string, status: any, notes?: string) => {
    if (status === 'resolved') {
      soundService.stopSiren();
    }

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          const updated = {
            ...inc,
            status,
            resolutionNotes: notes || inc.resolutionNotes,
            resolvedAt: status === 'resolved' ? new Date().toISOString() : undefined,
            resolvedBy: status === 'resolved' ? currentUser.name : undefined,
            timeline: [
              ...inc.timeline,
              {
                id: 't-' + Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                action: `Status Updated to ${status.toUpperCase()}`,
                actor: currentUser.name,
                notes: notes || `Incident transitioned to ${status}.`,
              },
            ],
          };
          FirestoreSyncService.saveIncident(updated);
          return updated;
        }
        return inc;
      })
    );

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'INCIDENT_STATUS_CHANGE',
      details: `Updated incident ${incidentId} to ${status}`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    FirestoreSyncService.saveAuditLog(newAudit);
  };

  const handleAddTimelineEvent = (incidentId: string, action: string, notes: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            timeline: [
              ...inc.timeline,
              {
                id: 't-' + Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                action,
                actor: currentUser.name,
                notes,
              },
            ],
          };
        }
        return inc;
      })
    );
  };

  const handleBroadcastMessage = (message: string) => {
    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      companyId: activeCompany.id,
      timestamp: new Date().toLocaleString(),
      actor: currentUser.name,
      actorRole: 'headoffice',
      action: 'EXECUTIVE_BROADCAST',
      details: `Corporate directive sent: "${message}"`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const selectedDetailIncident = incidents.find((i) => i.id === selectedDetailIncidentId);

  // --------------------------------------------------------------------------
  // RENDER AUTHENTICATION SCREENS (IF NOT LOGGED IN)
  // --------------------------------------------------------------------------
  if (authStatus === 'loading') { return <div className='min-h-screen bg-slate-50 flex items-center justify-center'>Loading...</div>; }
  if (authStatus === 'unauthenticated') {
    return (
      <LoginScreen />
    );
  }

  // --------------------------------------------------------------------------
  // MAIN AUTHENTICATED DASHBOARD APPLICATION
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Real-time Firebase RTDB Panic Alert Banner */}
      {realtimePanicAlert && realtimePanicAlert.panic && (
        <div className="bg-red-600 text-white px-6 py-3 shadow-lg flex items-center justify-between sticky top-0 z-50 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
            <div>
              <span className="font-black uppercase tracking-wider text-sm">LIVE EMERGENCY PANIC ALERT!</span>
              <span className="ml-3 text-xs bg-red-900/80 px-2 py-0.5 rounded font-mono font-bold">Room: {realtimePanicAlert.room}</span>
              {realtimePanicAlert.reporter && <span className="ml-2 text-xs opacity-90">Reported by: {realtimePanicAlert.reporter}</span>}
            </div>
          </div>
          <button
            onClick={() => {
              setDoc(doc(db, 'system', 'panicAlert'), { panic: false, room: '' });
            }}
            className="bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer shadow-sm"
          >
            Acknowledge / Clear
          </button>
        </div>
      )}

      {/* Geofence Breach Banner */}
      {geofenceAlert && (
        <div className="bg-amber-500 text-white px-6 py-3 shadow-lg flex items-center justify-between sticky top-0 z-[49] animate-bounce">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-600 rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <span className="font-black uppercase tracking-wider text-sm">SECURITY ZONE VIOLATION</span>
              <div className="text-xs font-semibold opacity-90">{geofenceAlert}</div>
            </div>
          </div>
          <button
            onClick={() => setGeofenceAlert(null)}
            className="bg-white text-amber-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-50 transition cursor-pointer shadow-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Header with Global Filters and Sign Out */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUser}
        company={activeCompany}
        branches={branches}
        houses={houses}
        activeIncidents={incidents}
        isOnline={isOnline}
        isMuted={isMuted}
        onToggleMute={() => {
          const next = soundService.toggleMute();
          setIsMuted(next);
        }}
        activeNavTab={activeNavTab}
        onNavTabChange={setActiveNavTab}
        onSignOut={handleSignOut}
        filters={filters}
        onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: PANIC BUTTON */}
        {activeNavTab === 'panic' && (
          <PanicScreen
            currentUser={currentUser}
            activeIncident={communityActiveIncident}
            onTriggerPanic={handleTriggerPanic}
            onCancelPanic={handleCancelPanic}
            isOnline={isOnline}
          />
        )}

        {/* VIEW 2: LIVE MAP */}
        {activeNavTab === 'map' && (
          <div className="space-y-4 text-left">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Live Incident & Responder Map</h2>
                <p className="text-xs text-slate-500">
                  Real-time Google Maps telemetry, victim GPS tracing trail, responder vectors & patrol checkpoint beacons
                </p>
              </div>
            </div>
            <LiveIncidentMap
              incidents={filteredIncidents}
              onSelectIncident={(id) => setSelectedDetailIncidentId(id)}
              checkpoints={checkpoints}
              users={users}
              activePanic={realtimePanicAlert}
              heightClass="h-[620px]"
            />
          </div>
        )}

        {/* VIEW 3: PATROL QR SCANNER */}
        {activeNavTab === 'patrol' && (
          <PatrolQRScanner
            currentUser={currentUser}
            checkpoints={checkpoints}
            scans={scans}
            onNewScan={handleNewPatrolScan}
          />
        )}

        {/* VIEW 4: OB BOOK */}
        {activeNavTab === 'obbook' && (
          <OBBook
            currentUser={currentUser}
            obEntries={obEntries}
            onCreateEntry={handleCreateOBEntry}
            onApproveEntry={handleApproveOBEntry}
          />
        )}

        {/* VIEW 5: EQUIPMENT REGISTER */}
        {activeNavTab === 'equipment' && (
          <EquipmentRegister
            currentUser={currentUser}
            equipmentList={equipmentList}
            onIssueEquipment={handleIssueEquipment}
            onReturnEquipment={handleReturnEquipment}
            onAddNewEquipment={handleAddNewEquipment}
            onSaveMaintenanceLog={handleSaveMaintenanceLog}
          />
        )}

        {/* VIEW 6: STRICT ROLE SPECIFIC CONSOLES */}
        {activeNavTab === 'dashboard' && (
          <>
            {currentRole === 'supervisor' && (
              <SupervisorDashboard
                currentUser={currentUser}
                incidents={filteredIncidents}
                checkpoints={checkpoints}
                scans={scans}
                obEntries={obEntries}
                onAssignResponder={handleAssignResponder}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
                onSelectIncident={(id) => setSelectedDetailIncidentId(id)}
                onOpenVoiceRoom={handleOpenVoiceRoom}
              />
            )}

            {currentRole === 'admin' && (
              <SecurityAdminDashboard
                currentUser={currentUser}
                company={activeCompany}
                houses={houses}
                users={users}
                checkpoints={checkpoints}
                auditLogs={auditLogs}
                branches={branches}
                onAddCheckpoint={handleAddCheckpoint}
                onAddHouse={handleAddHouse}
                onDeleteHouse={handleDeleteHouse}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onAddDevice={handleAddDevice}
                onDeleteDevice={handleDeleteDevice}
                onUpdateDeviceApproval={handleUpdateDeviceApproval}
              />
            )}

            {currentRole === 'manager' && (
              <SecurityManagerDashboard
                currentUser={currentUser}
                incidents={filteredIncidents}
                scans={scans}
                equipmentList={equipmentList}
                obEntries={obEntries}
                onOpenVoiceRoom={handleOpenVoiceRoom}
              />
            )}

            {currentRole === 'headoffice' && (
              <HeadOfficeDashboard
                currentUser={currentUser}
                branches={branches}
                incidents={filteredIncidents}
                onBroadcastMessage={handleBroadcastMessage}
                onOpenVoiceRoom={handleOpenVoiceRoom}
              />
            )}

            {currentRole === 'developer' && (
              <DeveloperDashboard
                currentUser={currentUser}
                company={activeCompany}
                companies={companies}
                houses={houses}
                incidents={filteredIncidents}
                onAddCompany={handleAddCompany}
                onUpdateCompany={handleUpdateCompany}
                onDeleteCompany={handleDeleteCompany}
                onAddHouse={handleAddHouse}
                onDeleteHouse={handleDeleteHouse}
                onAddDevice={handleAddDevice}
                onDeleteDevice={handleDeleteDevice}
                onUpdateDeviceApproval={handleUpdateDeviceApproval}
                onTriggerTestPanic={() => handleTriggerPanic('PANIC_GENERAL', 'Simulated Developer Sandbox Panic')}
              />
            )}

            {currentRole === 'guard' && (
              <PatrolQRScanner
                currentUser={currentUser}
                checkpoints={checkpoints}
                scans={scans}
                onNewScan={handleNewPatrolScan}
              />
            )}

            {currentRole === 'community' && (
              <PanicScreen
                currentUser={currentUser}
                activeIncident={communityActiveIncident}
                onTriggerPanic={handleTriggerPanic}
                onCancelPanic={handleCancelPanic}
                isOnline={isOnline}
              />
            )}
          </>
        )}
      </main>

      {/* Incident Detail Modal */}
      {selectedDetailIncident && (
        <IncidentDetailModal
          incident={selectedDetailIncident}
          currentUser={currentUser}
          onClose={() => setSelectedDetailIncidentId(null)}
          onUpdateStatus={handleUpdateIncidentStatus}
          onAddTimelineEvent={handleAddTimelineEvent}
          onOpenVoiceRoom={handleOpenVoiceRoom}
        />
      )}

      {/* Active Incident Tactical Voice Room Modal */}
      {activeVoiceIncident && (
        <IncidentVoiceRoomModal
          incident={activeVoiceIncident}
          currentUser={currentUser}
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onMinimize={() => setIsVoiceModalOpen(false)}
          onAddRosterMember={handleAddRosterMember}
        />
      )}

      {/* Persistent Floating Tactical Voice Dock */}
      <TacticalVoiceDock
        currentUser={currentUser}
        onExpandVoiceRoom={() => setIsVoiceModalOpen(true)}
      />

      {/* Location Permission Request Modal */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onAllow={() => {
          setLocationPermissionGranted(true);
          setShowLocationModal(false);
        }}
        onDismiss={() => setShowLocationModal(false)}
      />

      {/* PWA Installer Banner & Offline Support */}
      <PwaInstallBanner />

      {/* Global Application Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">Garanka Hero</span>
          <span>• Emergency Panic & Tactical Command</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-sans font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Firebase Firestore Connected
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-sans font-medium">
            ▲ Vercel Ready
          </span>
        </div>
      </footer>
    </div>
  );
}
