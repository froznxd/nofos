import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import Editor from "./components/editor";
import Sidebar from "./components/sidebar";

function App() {
  return (
    <main className="main">
      <div className="container">
        <Sidebar />
        <Editor />
      </div>
    </main>
  );
}

export default App;
