import React from "react";
import CertificateList from "../components/CertificateList";

const CertificatePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 px-10 py-12 animate-in fade-in duration-500">
      <CertificateList />
    </div>
  );
};

export default CertificatePage;
