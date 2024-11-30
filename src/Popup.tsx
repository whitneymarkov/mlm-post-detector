// src/Popup.tsx
import { useEffect, useState } from "react";

const Popup = () => {
  const [isScanning, setIsScanning] = useState(false);

  // Load the scanning state from storage
  useEffect(() => {
    chrome.storage.local.get(["isScanning"], (result) => {
      setIsScanning(result.isScanning || false);
    });
  }, []);

  // Toggle scanning state and save to storage
  const toggleScanning = () => {
    const newState = !isScanning;
    setIsScanning(newState);
    chrome.storage.local.set({ isScanning: newState });

    // Notify content script about the state change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "TOGGLE_SCANNING",
          isScanning: newState,
        });
      }
    });
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>MLM Detector</h1>
      <p>
        Scanning is currently <b>{isScanning ? "ON" : "OFF"}</b>.
      </p>
      <button
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: isScanning ? "#d9534f" : "#5cb85c",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={toggleScanning}
      >
        {isScanning ? "Turn OFF" : "Turn ON"}
      </button>
    </div>
  );
};

export default Popup;
