import React from 'react';

const closedConsortiums = [
  {
    name: 'Legacy Consortium',
    status: 'Closed',
    created: 'January 2023',
  },
  {
    name: 'Archived Impact Group',
    status: 'Closed',
    created: 'March 2022',
  },
];

const ClosedConsortiumsTable = () => (
  <div className="bg-white rounded-xl shadow-sm p-4 mt-6">
    <table className="w-full text-left">
      <thead>
        <tr className="text-gray-500 text-sm">
          <th className="font-medium py-2 px-2">Name</th>
          <th className="font-medium py-2 px-2">Status</th>
          <th className="font-medium py-2 px-2">Created</th>
          <th className="font-medium py-2 px-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {closedConsortiums.map((c) => (
          <tr key={c.name} className="border-t last:border-b hover:bg-gray-50">
            <td className="py-3 px-2 font-semibold text-gray-900">{c.name}</td>
            <td className="py-3 px-2">
              <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">{c.status}</span>
            </td>
            <td className="py-3 px-2 text-gray-700">{c.created}</td>
            <td className="py-3 px-2 text-right flex items-center gap-4 justify-end">
              <button className="flex items-center gap-1 text-gray-700 hover:text-black text-sm font-medium">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m0 0l-3-3m3 3l-3 3"/></svg>
                View Details
              </button>
              <button className="flex items-center gap-1 text-gray-700 hover:text-black text-sm font-medium">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 20h9"/><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5Z"/></svg>
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ClosedConsortiumsTable; 