import React from 'react';
import Card from '../common/Card';

const ConsortiumsEmptyState: React.FC = () => (
  <Card padding="lg" shadow="none" border className="max-w-5xl mx-auto mt-8 rounded-xl">
    <div className="mb-8">
      <div className="text-2xl font-semibold text-[#0b1320] mb-2">Your Consortiums</div>
      <div className="text-lg text-[#7b849b]">Consortiums you are a member of or have access to.</div>
    </div>
    <div className="w-full flex justify-center items-center py-8">
      <span className="text-[#7b849b] text-lg">No consortiums found. You are not a member of any consortiums yet.</span>
    </div>
  </Card>
);

export default ConsortiumsEmptyState; 