import React from "react";
import TopicUpload from "../components/TopicUpload";
import { User } from "../types";

interface UploadTopicProps {
  user: User;
}

const UploadTopic: React.FC<UploadTopicProps> = ({ user }) => {
  return (
    <div className="animate-in fade-in duration-500">
      <TopicUpload user={user} />
    </div>
  );
};

export default UploadTopic;
