import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  MapPin,
  Download,
} from 'lucide-react';
import { OBEntry, UserProfile } from '../types';
import { geolocationService } from '../services/geolocationService';

interface OBBookProps {
  currentUser: UserProfile;
  obEntries: OBEntry[];
  onCreateEntry: (entry: Omit<OBEntry, 'id' | 'timestamp'>) => void;
  onApproveEntry: (id: string, supervisorSignature: string) => void;
}

export const OBBook: React.FC<OBBookProps> = ({
  currentUser,
  obEntries = [],
  onCreateEntry,
  onApproveEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [formCategory, setFormCategory] = useState<any>('GENERAL_OBSERVATION');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formLocationNotes, setFormLocationNotes] = useState<string>('Main Ground Concourse');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string>('');

  const currentCoords = geolocationService.getCurrentCoords();

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) return;

    const nextObNumber = `OB ${140 + obEntries.length + 1}/08/2026`;

    const newEntry: Omit<OBEntry, 'id' | 'timestamp'> = {
      obNumber: nextObNumber,
      siteId: currentUser.siteId,
      siteName: currentUser.siteName,
      companyId: currentUser.companyId,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterRole: currentUser.role,
      category: formCategory,
      description: formDescription,
      coordinates: {
        ...currentCoords,
        address: formLocationNotes,
      },
      status: currentUser.role === 'supervisor' || currentUser.role === 'admin' ? 'approved' : 'submitted',
      attachments: formAttachmentUrl
        ? [
            {
              type: 'photo',
              url: formAttachmentUrl,
              name: 'Evidence_Capture.jpg',
            },
          ]
        : undefined,
      supervisorSignature:
        currentUser.role === 'supervisor' || currentUser.role === 'admin'
          ? `${currentUser.name} (Auto-Approved)`
          : undefined,
    };

    onCreateEntry(newEntry);
    setShowCreateModal(false);
    setFormDescription('');
    setFormAttachmentUrl('');
  };

  const filteredEntries = obEntries.filter((entry) => {
    const matchesSearch =
      entry.obNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.siteName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || entry.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || entry.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'PANIC_GENERAL':
      case 'ARMED_ROBBERY':
      case 'ASSAULT':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ACCESS_CONTROL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MAINTENANCE_DEFECT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'SHIFT_HANDOVER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['OB Number,Site,Reporter,Category,Timestamp,Status,Description']
        .concat(
          filteredEntries.map(
            (e) =>
              `"${e.obNumber}","${e.siteName}","${e.reporterName}","${e.category}","${e.timestamp}","${e.status}","${e.description.replace(/"/g, '""')}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OB_Book_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              OB Book (Occurrence Register)
            </h1>
            <p className="text-xs text-slate-500">
              Official legal record log for incident, observation, and patrol entries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="export-ob-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="create-ob-entry-btn"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log New OB Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="ob-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search OB entries by number, officer name, keywords..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="ob-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Categories</option>
            <option value="ACCESS_CONTROL">Access Control</option>
            <option value="PANIC_GENERAL">Emergency / Panic</option>
            <option value="MAINTENANCE_DEFECT">Maintenance / Defect</option>
            <option value="SHIFT_HANDOVER">Shift Handover</option>
            <option value="GENERAL_OBSERVATION">General Observation</option>
          </select>

          <select
            id="ob-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="approved">Approved & Signed</option>
            <option value="submitted">Pending Approval</option>
            <option value="investigating">Under Investigation</option>
          </select>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50 text-red-500" />
            <p className="text-sm font-semibold">No occurrence logs match your search filters.</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white hover:border-red-200 border border-slate-200 rounded-3xl p-5 shadow-sm transition group text-left"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-black text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                    {entry.obNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCategoryBadge(
                      entry.category
                    )}`}
                  >
                    {entry.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {entry.siteName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {entry.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approved</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending Sign-Off</span>
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Description Body */}
              <p className="text-xs sm:text-sm text-slate-800 mt-3 leading-relaxed">
                {entry.description}
              </p>

              {/* Meta Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reported by: <strong className="text-slate-800">{entry.reporterName}</strong> ({entry.reporterRole})</span>
                  </div>

                  {entry.coordinates.address && (
                    <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      <span>{entry.coordinates.address}</span>
                    </div>
                  )}

                  {entry.supervisorSignature && (
                    <div className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                      <span>✓ Signed: {entry.supervisorSignature}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(currentUser.role === 'supervisor' || currentUser.role === 'admin' || currentUser.role === 'manager') &&
                    entry.status !== 'approved' && (
                      <button
                        id={`approve-ob-btn-${entry.id}`}
                        onClick={() =>
                          onApproveEntry(entry.id, `${currentUser.name} (Signed ${new Date().toLocaleTimeString()})`)
                        }
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Supervisor Sign-Off</span>
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE OB ENTRY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-black text-slate-900">Log Occurrence Book (OB) Entry</h3>
              </div>
              <span className="text-xs font-mono bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200 font-bold">
                OB {140 + obEntries.length + 1}/08/2026
              </span>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category:</label>
                  <select
                    id="modal-ob-category-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  >
                    <option value="GENERAL_OBSERVATION">General Observation</option>
                    <option value="ACCESS_CONTROL">Access Control / Visitors</option>
                    <option value="MAINTENANCE_DEFECT">Maintenance / Physical Defect</option>
                    <option value="SHIFT_HANDOVER">Shift Handover Log</option>
                    <option value="PANIC_GENERAL">Emergency / Incident Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specific Location / Post:</label>
                  <input
                    id="modal-ob-location-input"
                    type="text"
                    value={formLocationNotes}
                    onChange={(e) => setFormLocationNotes(e.target.value)}
                    placeholder="e.g. Gate 3 Loading Dock"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Narrative / Observation Notes:
                </label>
                <textarea
                  id="modal-ob-description-textarea"
                  rows={4}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="State exact facts, names, times, vehicle registration plates, or actions taken..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                ></textarea>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>📍 Automatic GPS Stamp: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}</span>
                <span className="text-red-600 font-bold">User: {currentUser.name}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="modal-ob-submit-btn"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Seal & Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
