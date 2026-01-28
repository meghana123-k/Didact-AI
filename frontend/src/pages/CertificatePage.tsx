import React from "react";
import CertificateList from "../components/CertificateList";

const CertificatePage: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <CertificateList />
    </div>
  );
};

export default CertificatePage;
