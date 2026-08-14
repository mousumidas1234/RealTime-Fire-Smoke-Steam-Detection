import React from 'react';
import { Users, MapPin, Phone, Shield, AlertCircle } from 'lucide-react';

const teamMembers = [
  {
    name: 'Rajesh Kumar Singh',
    role: 'Plant Safety Officer',
    zone: 'Zone A — Refinery Unit',
    status: 'On Duty' as const,
    phone: '+91 98765 43210',
    initials: 'RK',
  },
  {
    name: 'Priya Sharma',
    role: 'Fire Safety Lead',
    zone: 'Zone B — Storage Terminal',
    status: 'On Duty' as const,
    phone: '+91 98765 43211',
    initials: 'PS',
  },
  {
    name: 'Amit Patel',
    role: 'HSE Inspector',
    zone: 'Zone C — Pipeline Corridor',
    status: 'Off Duty' as const,
    phone: '+91 98765 43212',
    initials: 'AP',
  },
  {
    name: 'Sunita Devi',
    role: 'Emergency Response Coordinator',
    zone: 'Central Control Room',
    status: 'On Duty' as const,
    phone: '+91 98765 43213',
    initials: 'SD',
  },
  {
    name: 'Vikram Tiwari',
    role: 'Steam Systems Engineer',
    zone: 'Zone A — Boiler House',
    status: 'On Duty' as const,
    phone: '+91 98765 43214',
    initials: 'VT',
  },
  {
    name: 'Neha Gupta',
    role: 'Surveillance Operator',
    zone: 'Central Control Room',
    status: 'On Break' as const,
    phone: '+91 98765 43215',
    initials: 'NG',
  },
];

const emergencyContacts = [
  { label: 'Fire Control Room', number: '1800-120-4567' },
  { label: 'Emergency Medical', number: '1800-120-8901' },
  { label: 'Plant Manager', number: '+91 98765 00000' },
];

const statusStyles: Record<string, string> = {
  'On Duty': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Off Duty': 'bg-slate-100 text-slate-600 border-slate-200',
  'On Break': 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function MembersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-[#003c71] flex items-center gap-2">
          <Users size={24} className="text-[#f58220]" />
          Safety Response Team
        </h2>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          IOCL Plant Safety &amp; Emergency Personnel
        </p>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {teamMembers.map((member) => (
          <div
            key={member.name}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-orange-200 hover:scale-[1.02] transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0 w-12 h-12 bg-[#003c71] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm transition-shadow">
                {member.initials}
              </div>

              <div className="flex-1 min-w-0">
                {/* Name */}
                <h3 className="text-sm font-bold text-slate-900 truncate">{member.name}</h3>
                {/* Role */}
                <p className="text-xs font-semibold text-[#f58220] mt-0.5">{member.role}</p>

                {/* Zone */}
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
                  <MapPin size={12} className="text-slate-500 flex-shrink-0" />
                  <span className="truncate">{member.zone}</span>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                  <Phone size={12} className="flex-shrink-0" />
                  <span>{member.phone}</span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <span
                className={`inline-block px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                  statusStyles[member.status] || ''
                }`}
              >
                {member.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Contacts */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={20} className="text-[#f58220]" />
          <h3 className="text-sm font-bold text-[#003c71] uppercase tracking-wider">
            Emergency Contacts
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {emergencyContacts.map((contact) => (
            <div
              key={contact.label}
              className="flex items-center gap-3 p-3 bg-white border border-orange-100 rounded-xl"
            >
              <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <Phone size={14} className="text-[#f58220]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{contact.label}</p>
                <p className="text-xs font-mono text-slate-600 mt-0.5">{contact.number}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IOCL Disclaimer */}
      <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl">
        <Shield size={16} className="text-slate-500 flex-shrink-0" />
        <p className="text-[10px] text-slate-600">
          All personnel data displayed here is for demonstration purposes only. In production,
          this integrates with IOCL&apos;s HR management system for real-time duty rosters.
        </p>
      </div>
    </div>
  );
}
