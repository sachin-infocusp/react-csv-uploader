import React from "react";
import MyCsvUploader from "./components/myCsvUploader";

export default function App() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>CSV Uploader (Babel Setup)</h1>
      <MyCsvUploader title="HiHi" />
    </div>
  );
}
