import React, { useState } from 'react';
import {
  Shield,
  Radio,
  Camera,
  Battery,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  User,
  Clock,
  Wrench,
  History,
  FileText,
  DollarSign,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { EquipmentItem, UserProfile, MaintenanceRecord } from '../types';

interface EquipmentRegisterProps {
  currentUser: UserProfile;
  equipmentList: EquipmentItem[];
  onIssueEquipment: (equipmentId: string, guardName: string, guardId: string) => void;
  onReturnEquipment: (equipmentId: string, condition: 'Excellent' | 'Good' | 'Fair' | 'Damaged') => void;
  onAddNewEquipment?: (item: Omit<EquipmentItem, 'id'>) => void;
  onSaveMaintenanceLog?: (equipmentId: string, record: Omit<MaintenanceRecord, 'id' | 'loggedAt'>) => void;
}

export const EquipmentRegister: React.FC<EquipmentRegisterProps> = ({
  currentUser,
  equipmentList = [],
  onIssueEquipment,
  onReturnEquipment,
  onAddNewEquipment,
  onSaveMaintenanceLog,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showIssueModal, setShowIssueModal] = useState<EquipmentItem | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<EquipmentItem | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Maintenance Modal State
  const [selectedMaintenanceItem, setSelectedMaintenanceItem] = useState<EquipmentItem | null>(null);
  const [showAddMaintForm, setShowAddMaintForm] = useState<boolean>(false);

  // Form State
  const [assigneeName, setAssigneeName] = useState<string>('Officer Sipho Khumalo');
  const [assigneeId, setAssigneeId] = useState<string>('usr-guard-01');
  const [returnCondition, setReturnCondition] = useState<'Excellent' | 'Good' | 'Fair' | 'Damaged'>('Good');

  // New Equipment Form
  const [newName, setNewName] = useState<string>('');
  const [newSerial, setNewSerial] = useState<string>('');
  const [newCategory, setNewCategory] = useState<any>('Radio / Walkie');
  const [newCondition, setNewCondition] = useState<any>('Excellent');

  // New Maintenance Form State
  const [maintIssueDesc, setMaintIssueDesc] = useState<string>('');
  const [maintRemedy, setMaintRemedy] = useState<string>('');
  const [maintTechName, setMaintTechName] = useState<string>('Armory Tactical Tech');
  const [maintCost, setMaintCost] = useState<string>('');
  const [maintStatus, setMaintStatus] = useState<'Pending Repair' | 'In Maintenance' | 'Repaired' | 'Decommissioned'>('In Maintenance');

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.assignedTo && item.assignedTo.userName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'issued':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'maintenance':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'lost':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSerial.trim()) return;

    if (onAddNewEquipment) {
      onAddNewEquipment({
        name: newName,
        serialNumber: newSerial,
        category: newCategory,
        siteId: currentUser.siteId,
        siteName: currentUser.siteName,
        status: 'available',
        condition: newCondition,
        lastInspectionDate: new Date().toISOString().slice(0, 10),
        batteryHealthPercent: newCategory.includes('Radio') || newCategory.includes('Camera') || newCategory.includes('Phone') ? 100 : undefined,
      });
    }
    setShowAddModal(false);
    setNewName('');
    setNewSerial('');
  };

  const handleSaveMaintRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaintenanceItem || !maintIssueDesc.trim()) return;

    const recordPayload = {
      loggedBy: currentUser.name,
      issueDescription: maintIssueDesc,
      remedyAction: maintRemedy.trim() || undefined,
      technicianName: maintTechName.trim() || undefined,
      cost: maintCost ? parseFloat(maintCost) : undefined,
      status: maintStatus,
      resolvedAt: maintStatus === 'Repaired' ? new Date().toISOString() : undefined,
    };

    if (onSaveMaintenanceLog) {
      onSaveMaintenanceLog(selectedMaintenanceItem.id, recordPayload);
    }

    // Update local state copy of item in modal
    const newRecord: MaintenanceRecord = {
      ...recordPayload,
      id: 'maint-' + Date.now(),
      loggedAt: new Date().toISOString(),
    };

    const updatedHistory = [newRecord, ...(selectedMaintenanceItem.maintenanceHistory || [])];
    let newStatus = selectedMaintenanceItem.status;
    let newCondition = selectedMaintenanceItem.condition;

    if (maintStatus === 'Repaired') {
      newStatus = 'available';
      newCondition = 'Good';
    } else if (maintStatus === 'Pending Repair' || maintStatus === 'In Maintenance') {
      newStatus = 'maintenance';
      newCondition = 'Damaged';
    }

    setSelectedMaintenanceItem({
      ...selectedMaintenanceItem,
      status: newStatus,
      condition: newCondition,
      maintenanceHistory: updatedHistory,
    });

    // Reset form
    setMaintIssueDesc('');
    setMaintRemedy('');
    setMaintCost('');
    setShowAddMaintForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Security Equipment & Asset Register
            </h1>
            <p className="text-xs text-slate-500">
              Track tactical radios, body worn cameras, ballistic vests, armory maintenance logs & repair history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="add-equipment-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Asset</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="equipment-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search equipment by serial number, name, guard..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="equipment-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Radio / Walkie">Radios / Walkies</option>
            <option value="Body Camera">Body Cameras</option>
            <option value="Ballistic Vest">Ballistic Vests</option>
            <option value="Metal Detector">Metal Detectors</option>
            <option value="Flashlight">Flashlights</option>
            <option value="Patrol Phone">Patrol Phones</option>
          </select>

          <select
            id="equipment-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="available">Available in Armory</option>
            <option value="issued">Currently Issued</option>
            <option value="maintenance">In Maintenance / Damaged</option>
            <option value="lost">Missing / Lost</option>
          </select>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((item) => {
          const isMaintenanceOrDamaged = item.status === 'maintenance' || item.condition === 'Damaged';
          const hasMaintRecords = item.maintenanceHistory && item.maintenanceHistory.length > 0;

          return (
            <div
              key={item.id}
              className={`bg-white border ${
                isMaintenanceOrDamaged ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'
              } hover:border-red-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between transition group relative overflow-hidden`}
            >
              {isMaintenanceOrDamaged && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black uppercase px-3 py-0.5 rounded-bl-xl tracking-wider flex items-center gap-1">
                  <Wrench className="w-2.5 h-2.5" /> Maintenance Needed
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.serialNumber}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1.5 leading-snug">{item.name}</h3>
                    <div className="text-[11px] text-red-600 font-semibold">{item.category}</div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Status Details */}
                <div className="py-3 space-y-2 text-xs text-slate-700">
                  {item.status === 'issued' && item.assignedTo ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-800">
                        <User className="w-3.5 h-3.5" />
                        <span>Assigned to: {item.assignedTo.userName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Issued: {new Date(item.assignedTo.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ) : item.status === 'maintenance' || item.condition === 'Damaged' ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Wrench className="w-3.5 h-3.5 text-amber-700" />
                        <span>Undergoing Repair / Inspection</span>
                      </div>
                      <p className="text-[10px] text-amber-800 line-clamp-2">
                        {item.maintenanceHistory && item.maintenanceHistory[0]
                          ? item.maintenanceHistory[0].issueDescription
                          : 'Marked damaged. See maintenance history log.'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>In Armory / Ready for shift issue</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Condition:{' '}
                      <strong className={item.condition === 'Damaged' ? 'text-red-700 font-bold' : 'text-slate-800'}>
                        {item.condition}
                      </strong>
                    </span>
                    {item.batteryHealthPercent !== undefined && (
                      <span className="flex items-center gap-1 text-emerald-700 font-mono font-bold">
                        <Battery className="w-3.5 h-3.5 text-emerald-600" />
                        {item.batteryHealthPercent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {item.status === 'available' ? (
                    <button
                      id={`issue-eq-btn-${item.id}`}
                      onClick={() => setShowIssueModal(item)}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Issue to Officer
                    </button>
                  ) : item.status === 'issued' ? (
                    <button
                      id={`return-eq-btn-${item.id}`}
                      onClick={() => setShowReturnModal(item)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition"
                    >
                      Log Return / Check-In
                    </button>
                  ) : null}

                  {/* Maintenance History Log Button */}
                  <button
                    id={`maint-history-btn-${item.id}`}
                    onClick={() => {
                      setSelectedMaintenanceItem(item);
                      setShowAddMaintForm(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      isMaintenanceOrDamaged
                        ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 flex-1 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>
                      {isMaintenanceOrDamaged ? 'Repair Details & History' : 'Maintenance Log'}
                    </span>
                    {hasMaintRecords && (
                      <span className="bg-slate-200/80 text-slate-800 text-[10px] px-1.5 rounded-full font-mono">
                        {item.maintenanceHistory?.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAINTENANCE HISTORY MODAL */}
      {selectedMaintenanceItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {selectedMaintenanceItem.serialNumber}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                        selectedMaintenanceItem.status
                      )}`}
                    >
                      {selectedMaintenanceItem.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedMaintenanceItem.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Category: <strong className="text-slate-800">{selectedMaintenanceItem.category}</strong> | Condition:{' '}
                    <strong className="text-slate-800">{selectedMaintenanceItem.condition}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMaintenanceItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Header: Add Repair Log */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Armory Maintenance Logbook</h4>
                <p className="text-[11px] text-slate-500">
                  Record inspection findings, technician repairs, parts costs, or mark asset as Repaired.
                </p>
              </div>
              <button
                id="toggle-add-maint-form-btn"
                onClick={() => setShowAddMaintForm(!showAddMaintForm)}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddMaintForm ? 'Close Form' : 'Log Repair / Service'}</span>
              </button>
            </div>

            {/* Add Maintenance Log Form */}
            {showAddMaintForm && (
              <form onSubmit={handleSaveMaintRecordSubmit} className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Record New Technical Repair Entry</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue / Damage Description:</label>
                  <textarea
                    required
                    rows={2}
                    value={maintIssueDesc}
                    onChange={(e) => setMaintIssueDesc(e.target.value)}
                    placeholder="e.g. Broken antenna connector, cracked casing, battery failing load test..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Repair / Remedy Action Taken:</label>
                    <input
                      type="text"
                      value={maintRemedy}
                      onChange={(e) => setMaintRemedy(e.target.value)}
                      placeholder="e.g. Replaced internal flex ribbon cable & tested TX power"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Technician / Vendor Name:</label>
                    <input
                      type="text"
                      value={maintTechName}
                      onChange={(e) => setMaintTechName(e.target.value)}
                      placeholder="e.g. Armory Repair Lab / SpectrumComms"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Repair Status:</label>
                    <select
                      value={maintStatus}
                      onChange={(e) => setMaintStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Pending Repair">Pending Repair (Awaiting Parts)</option>
                      <option value="In Maintenance">In Maintenance (Under Service)</option>
                      <option value="Repaired">Repaired (Restore to Armory Available)</option>
                      <option value="Decommissioned">Decommissioned (Unserviceable)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Repair Cost (ZAR / $):</label>
                    <input
                      type="number"
                      value={maintCost}
                      onChange={(e) => setMaintCost(e.target.value)}
                      placeholder="e.g. 450.00"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMaintForm(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-maint-log-btn"
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition"
                  >
                    Save Maintenance Log
                  </button>
                </div>
              </form>
            )}

            {/* Maintenance History Timeline List */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>Recorded Repair History ({selectedMaintenanceItem.maintenanceHistory?.length || 0})</span>
              </h3>

              {(!selectedMaintenanceItem.maintenanceHistory || selectedMaintenanceItem.maintenanceHistory.length === 0) ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs space-y-1">
                  <p className="font-semibold text-slate-700">No previous maintenance logs recorded.</p>
                  <p>Click "Log Repair / Service" above to add an inspection or technical repair entry.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMaintenanceItem.maintenanceHistory.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs text-xs text-slate-800"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              rec.status === 'Repaired'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : rec.status === 'In Maintenance'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : rec.status === 'Pending Repair'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {rec.status}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600">{rec.loggedBy}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(rec.loggedAt).toLocaleDateString()} {new Date(rec.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Issue Description</div>
                        <p className="text-slate-900 font-medium">{rec.issueDescription}</p>
                      </div>

                      {rec.remedyAction && (
                        <div>
                          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Remedy / Repair Action</div>
                          <p className="text-emerald-800 font-medium">{rec.remedyAction}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 mt-2">
                        {rec.technicianName && (
                          <span>Technician: <strong className="text-slate-800">{rec.technicianName}</strong></span>
                        )}
                        {rec.cost !== undefined && rec.cost > 0 && (
                          <span className="font-mono font-bold text-slate-900">
                            Cost: R{rec.cost.toFixed(2)}
                          </span>
                        )}
                        {rec.resolvedAt && (
                          <span className="text-emerald-700 font-semibold">
                            Resolved: {new Date(rec.resolvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedMaintenanceItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-black text-slate-900">Issue Equipment: {showIssueModal.name}</h3>
            <p className="text-xs text-slate-500">
              Serial No: <strong className="font-mono text-slate-800">{showIssueModal.serialNumber}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Guard / Officer:</label>
              <select
                id="modal-issue-guard-select"
                value={assigneeName}
                onChange={(e) => {
                  setAssigneeName(e.target.value);
                  setAssigneeId(e.target.value.includes('Sipho') ? 'usr-guard-01' : 'usr-guard-02');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              >
                <option value="Officer Sipho Khumalo">Officer Sipho Khumalo (SEC-8842)</option>
                <option value="Officer Tendai Moyo">Officer Tendai Moyo (SEC-8843)</option>
                <option value="Guard Lucas Sithole">Guard Lucas Sithole (SEC-8845)</option>
                <option value="First Aider Willem Coetzee">First Aider Willem Coetzee (SEC-8849)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowIssueModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                id="modal-confirm-issue-btn"
                onClick={() => {
                  onIssueEquipment(showIssueModal.id, assigneeName, assigneeId);
                  setShowIssueModal(null);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
              >
                Confirm Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-black text-slate-900">Log Equipment Return / Hand-In</h3>
            <p className="text-xs text-slate-500">
              Returning: <strong className="text-slate-800">{showReturnModal.name}</strong> ({showReturnModal.serialNumber})
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inspected Physical Condition:</label>
              <select
                id="modal-return-condition-select"
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              >
                <option value="Excellent">Excellent (No marks / Clean)</option>
                <option value="Good">Good (Normal shift wear)</option>
                <option value="Fair">Fair (Scratch / Battery low)</option>
                <option value="Damaged">Damaged (Faulty / Needs Repair)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReturnModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                id="modal-confirm-return-btn"
                onClick={() => {
                  onReturnEquipment(showReturnModal.id, returnCondition);
                  setShowReturnModal(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              >
                Log Return to Armory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ASSET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-black text-slate-900">Register New Security Asset</h3>
            <form onSubmit={handleAddNewSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Motorola APX 8000 Radio"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Serial / Barcode Number:</label>
                <input
                  type="text"
                  required
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  placeholder="e.g. MOT-8899-X"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  >
                    <option value="Radio / Walkie">Radio / Walkie</option>
                    <option value="Body Camera">Body Camera</option>
                    <option value="Ballistic Vest">Ballistic Vest</option>
                    <option value="Metal Detector">Metal Detector</option>
                    <option value="Flashlight">Flashlight</option>
                    <option value="Patrol Phone">Patrol Phone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Condition:</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
