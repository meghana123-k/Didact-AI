import React from "react";
import { certificateService } from "../services/certificateService";

const CertificateList: React.FC = () => {
  const [certs, setCerts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const token = localStorage.getItem("token") || "";

  React.useEffect(() => {
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const loadCertificates = async () => {
      try {
        const data = await certificateService.getMyCertificates(token);
        setCerts(data);
      } catch (err: any) {
        setError(err.message || "Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, [token]); // ✅ VERY IMPORTANT

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400">
        Loading certificates...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-400">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-semibold mb-3">My Certificates</h1>

      <p className="text-slate-400 mb-12">
        Official academic recognition of your verified mastery achievements.
      </p>

      {certs.length === 0 ? (
        <div className="text-center py-20 border border-slate-700 rounded-2xl bg-[#1e293b]">
          <h2 className="text-xl font-semibold text-slate-300">
            No Certificates Yet
          </h2>
          <p className="text-slate-500 mt-3 text-sm">
            Complete mastery assessments to unlock verified certificates.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 hover:border-indigo-500 transition"
            >
              <h2 className="text-2xl font-semibold mb-3">
                {cert.topic_title}
              </h2>

              <p className="text-slate-400 mb-4">
                Awarded to{" "}
                <span className="text-indigo-400 font-medium">
                  {cert.user_name}
                </span>
              </p>

              <div className="space-y-2 text-sm text-slate-500 mb-6">
                <p>Certificate ID: {cert.certificate_uid}</p>
                <p>Issued on: {cert.issued_at}</p>
              </div>

              <button
                onClick={() =>
                  window.open(
                    `http://127.0.0.1:5001${cert.download_url}`,
                    "_blank",
                  )
                }
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition"
              >
                Download Certificate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificateList;
