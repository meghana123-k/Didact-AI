import React from "react";
import { getCertificates } from "../services/storageService";

const CertificateList: React.FC = () => {
  const certs = getCertificates();

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">My Certificates</h1>
        <p className="text-slate-500">
          Official recognition of your course completions.
        </p>
      </div>

      {certs.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-award text-slate-300 text-3xl"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            No Certificates Yet
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Complete all lessons in a course and pass their assessments to earn
            your first certificate.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>

              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-100">
                  <i className="fas fa-award text-white text-xl"></i>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-1">
                  {cert.courseTitle}
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Issued to{" "}
                  <span className="font-bold text-slate-700">
                    {cert.userName}
                  </span>
                </p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                      Certificate ID
                    </p>
                    <p className="text-xs font-mono text-slate-600">
                      {cert.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                      Issue Date
                    </p>
                    <p className="text-xs font-medium text-slate-600">
                      {cert.issueDate}
                    </p>
                  </div>
                </div>

                <button className="w-full mt-6 py-3 border border-blue-100 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-600 hover:text-white transition-all">
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificateList;
