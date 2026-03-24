import React from 'react';

const consortiums = [
  {
    name: 'Health Partners Consortium',
    members: ['orgA', 'orgB', 'orgC'],
  },
  {
    name: 'Education Alliance Network',
    members: ['orgD', 'orgE', 'orgF'],
  },
  {
    name: 'Emergency Response Group',
    members: ['orgA', 'orgC', 'orgG'],
  },
];

const ConsortiumManagementSection: React.FC = () => (
  <div className="bg-white border border-[#e5eaf1] rounded-xl p-4 sm:p-8 mt-8">
    <div className="text-2xl font-bold text-[#0b1320] mb-1">Consortium Management</div>
    <div className="text-base text-[#7b849b] mb-6">You are currently facilitating 3 consortium(s)</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {consortiums.map((consortium) => (
        <div key={consortium.name} className="bg-white border border-[#e5eaf1] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-lg font-bold text-[#0b1320] mb-1">{consortium.name}</div>
            <div className="text-sm text-[#7b849b] mb-2">3 member organizations</div>
            <div className="font-semibold text-sm text-[#0b1320] mb-1">Member Organizations:</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {consortium.members.map((org) => (
                <span key={org} className="inline-block bg-[#f5f7fa] text-[#0b1320] rounded-full px-4 py-1 text-base font-medium border border-[#e5eaf1]">{org}</span>
              ))}
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button className="bg-[#FBBF77]/60 text-[#0b1320] font-medium px-6 py-2 rounded-lg shadow-none hover:bg-[#FBBF77] focus:ring-0 text-base">View Actions</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ConsortiumManagementSection; 