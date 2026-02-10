import React from "react";
import { certificateService } from "../services/certificateService";

const CertificateList: React.FC = () => {
  const [certs, setCerts] = React.useState<any[]>([]);
  const token = localStorage.getItem("token") || "";

  React.useEffect(() => {
    certificateService
      .getMyCertificates(token)
      .then(setCerts)
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-4xl font-bold mb-3">My Certificates</h1>
      <p className="text-gray-500 mb-10">
        Official recognition of your academic achievements.
      </p>

      {certs.length === 0 ? (
        <div className="text-center py-20 border rounded-lg">
          <h2 className="text-xl font-semibold text-gray-600">
            No Certificates Yet
          </h2>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="bg-white border rounded-xl shadow-lg p-8 hover:shadow-xl transition"
            >
              <h2 className="text-2xl font-bold mb-2">{cert.topic_title}</h2>

              <p className="text-gray-600 mb-4">
                Awarded to <strong>{cert.user_name}</strong>
              </p>

              <p className="text-sm text-gray-500 mb-2">
                Certificate ID: {cert.certificate_uid}
              </p>

              <p className="text-sm text-gray-500 mb-6">
                Issued on: {cert.issued_at}
              </p>

              <button
                onClick={() =>
                  window.open(
                    `http://127.0.0.1:5001${cert.download_url}`,
                    "_blank",
                  )
                }
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
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
