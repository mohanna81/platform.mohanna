import React from 'react';

const risks = [
  {
    id: 'AR1',
    title: 'Payment Delay Risk',
    category: 'Safety',
    consortium: 'Health Consortium (2021-2023)',
    organizations: ['OrgA', 'OrgB', 'OrgC'],
  },
  {
    id: 'AR2',
    title: 'Security Incident',
    category: 'Security',
    consortium: 'Education Consortium (2020-2022)',
    organizations: ['OrgA', 'OrgD', 'OrgE'],
  },
  {
    id: 'AR3',
    title: 'Procurement Delay',
    category: 'Operational',
    consortium: 'WASH Consortium (2019-2022)',
    organizations: ['OrgB', 'OrgC', 'OrgF'],
  },
];

const RisksLibraryTable: React.FC = () => (
  <div className="bg-white border border-[#e5eaf1] rounded-xl p-8 mt-4">
    <div className="mb-2">
      <div className="text-2xl font-semibold text-[#0b1320] mb-1">Historical Risk Knowledge Base</div>
      <div className="text-base text-[#7b849b]">Access archived risks from past consortiums to inform your risk management strategies</div>
    </div>
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full text-left">
        <thead>
          <tr className="text-[#7b849b] text-base">
            <th className="font-semibold py-2 px-2">ID</th>
            <th className="font-semibold py-2 px-2">Title</th>
            <th className="font-semibold py-2 px-2">Category</th>
            <th className="font-semibold py-2 px-2">Consortium</th>
            <th className="font-semibold py-2 px-2">Organizations</th>
            <th className="font-semibold py-2 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {risks.map((risk) => (
            <tr key={risk.id} className="border-t border-[#e5eaf1]">
              <td className="py-3 px-2 font-bold text-[#0b1320]">{risk.id}</td>
              <td className="py-3 px-2">{risk.title}</td>
              <td className="py-3 px-2">{risk.category}</td>
              <td className="py-3 px-2">
                <span className="inline-block bg-[#f5f7fa] text-[#0b1320] rounded-full px-3 py-1 text-sm font-medium">{risk.consortium}</span>
              </td>
              <td className="py-3 px-2">
                <div className="flex flex-wrap gap-2">
                  {risk.organizations.map((org) => (
                    <span key={org} className="inline-block bg-[#e6f4fa] text-[#0b1320] rounded-full px-3 py-1 text-sm font-medium">{org}</span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-2">
                <button className="text-[#0b1320] font-medium hover:underline">View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default RisksLibraryTable; 