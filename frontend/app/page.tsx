"use client";

import React, { useState } from "react";
import AuthScreen from "../components/AuthScreen";
import SplitWorkspace from "../components/SplitWorkspace";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("User");

  return (
    <div className="min-h-screen w-screen overflow-hidden transition-colors duration-300">
      {isAuthenticated ? (
        <SplitWorkspace userName={userName} onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <AuthScreen 
          onLoginSuccess={(name) => {
            setUserName(name || "User");
            setIsAuthenticated(true);
          }} 
        />
      )}
    </div>
  );
}
