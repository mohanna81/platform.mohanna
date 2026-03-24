"use client";
import React, { useState } from "react";
import RisksLibraryHeader from "@/components/risks-library/RisksLibraryHeader";
import RisksLibraryTable from "@/components/risks-library/RisksLibraryTable";
import Layout from '@/components/common/Layout';

export default function RisksLibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  return (
    <Layout>
      <div className="p-4 sm:p-8 md:p-12">
        <RisksLibraryHeader
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
        />
        <RisksLibraryTable />
      </div>
    </Layout>
  );
} 