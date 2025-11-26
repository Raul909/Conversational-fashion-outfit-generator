import React from "react";
// import "../components/Loading.css";
export const Loading = () => {
  return (
    <div className="typing-indicator flex items-center gap-2 py-3">
      <div className="typing-dot"></div>
      <div className="typing-dot"></div>
      <div className="typing-dot"></div>
    </div>
  );
};
