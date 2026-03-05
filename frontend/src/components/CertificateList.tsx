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
  }, [token]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading certificates...</p>
        </div>
      </div>
    );
  }

  /* ================= ERROR ================= */

  if (error) {
    return (
      <div className="text-center py-32 text-red-500 font-medium">{error}</div>
    );
  }

  /* ================= MAIN ================= */

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      {/* HEADER */}
      <h1 className="text-4xl font-bold mb-3 text-gray-800">
        🎓 My Certificates
      </h1>

      <p className="text-gray-500 mb-12">
        Official recognition of your verified learning achievements.
      </p>

      {/* EMPTY STATE */}
      {certs.length === 0 ? (
        <div className="text-center py-20 border border-gray-200 rounded-2xl bg-white shadow-sm">
          <div className="text-5xl mb-4">📜</div>

          <h2 className="text-xl font-semibold text-gray-700">
            No Certificates Yet
          </h2>

          <p className="text-gray-500 mt-3 text-sm">
            Complete mastery assessments to unlock verified certificates.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
            >
              {/* COLOR STRIP */}
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

              <div className="p-8">
                {/* TITLE */}
                <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                  {cert.topic_title}
                </h2>

                {/* USER */}
                <p className="text-gray-500 mb-4">
                  Awarded to{" "}
                  <span className="text-indigo-600 font-medium">
                    {cert.user_name}
                  </span>
                </p>

                {/* META */}
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <p>
                    Certificate ID:
                    <span className="ml-2 font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                      {cert.certificate_uid}
                    </span>
                  </p>

                  <p>
                    Issued on:
                    <span className="ml-2 text-gray-700 font-medium">
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>

                {/* DOWNLOAD BUTTON */}
                <button
                  onClick={() =>
                    window.open(
                      `http://127.0.0.1:5001${cert.download_url}`,
                      "_blank",
                    )
                  }
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  📥 Download Certificate
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
