"use client";

import React, { useState } from "react";

interface AuthScreenProps {
  onLoginSuccess: (name: string) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    
    // Attempt to retrieve registered users database from localStorage
    let registeredUsers = [];
    try {
      const stored = localStorage.getItem("registered_users");
      if (stored) {
        registeredUsers = JSON.parse(stored);
      }
    } catch (err) {
      console.error("Error reading registered_users from localStorage", err);
    }

    // Try to find the user by matching email or username (email prefix)
    const user = registeredUsers.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase() || 
                  u.email.split("@")[0].toLowerCase() === email.toLowerCase()
    );

    if (user) {
      if (user.password !== password) {
        setError("Invalid password.");
        return;
      }
      onLoginSuccess(user.name);
    } else {
      // Fallback for mock logins: use capitalized email prefix (e.g. admin -> Admin)
      const displayName = email.includes("@") ? email.split("@")[0] : email;
      const capitalized = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      onLoginSuccess(capitalized);
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // Save user registration to localStorage
    let registeredUsers = [];
    try {
      const stored = localStorage.getItem("registered_users");
      if (stored) {
        registeredUsers = JSON.parse(stored);
      }
    } catch (err) {
      console.error("Error reading registered_users from localStorage", err);
    }

    // Prevent duplicate emails
    if (registeredUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      setError("User with this email already exists.");
      return;
    }

    registeredUsers.push({ name, email, password });
    localStorage.setItem("registered_users", JSON.stringify(registeredUsers));

    onLoginSuccess(name);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[var(--bg-main)] relative select-none transition-colors duration-300">
      
      {/* Decorative Outer Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>

      {/* Main Container Card (Vertical Layout - Height decreased to 480px for a compact, balanced look) */}
      <div className="relative overflow-hidden w-[360px] h-[480px] bg-gradient-to-br from-[#0f172a] via-[#0c4a6e] to-[#075985] rounded-[32px] shadow-2xl border border-[var(--border-color)]">
        
        {/* Constellation SVG Network Background for Purple/Blue Area */}
        <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none text-sky-400" viewBox="0 0 360 480" fill="none" stroke="currentColor" strokeWidth="1">
          <line x1="40" y1="80" x2="120" y2="40" />
          <line x1="120" y1="40" x2="220" y2="100" />
          <line x1="220" y1="100" x2="320" y2="50" />
          <line x1="320" y1="50" x2="330" y2="160" />
          <line x1="220" y1="100" x2="150" y2="160" />
          <line x1="150" y1="160" x2="80" y2="260" />
          <line x1="40" y1="80" x2="150" y2="160" />
          <line x1="150" y1="160" x2="280" y2="220" />
          <line x1="280" y1="220" x2="330" y2="160" />
          
          <circle cx="40" cy="80" r="3" fill="currentColor" className="animate-pulse" />
          <circle cx="120" cy="40" r="3" fill="currentColor" />
          <circle cx="220" cy="100" r="4.5" fill="currentColor" className="animate-pulse" />
          <circle cx="320" cy="50" r="2.5" fill="currentColor" />
          <circle cx="330" cy="160" r="4" fill="currentColor" />
          <circle cx="150" cy="160" r="3.5" fill="currentColor" className="animate-pulse" />
          <circle cx="280" cy="220" r="3.5" fill="currentColor" />
          <circle cx="80" cy="260" r="2.5" fill="currentColor" />
        </svg>

        {/* Top Toggle Header - Visible only when Login is active */}
        {!isSignUp && (
          <div 
            className="absolute top-0 left-0 w-full h-[80px] flex flex-col items-center justify-center z-10 cursor-pointer"
            onClick={() => { setIsSignUp(true); setError(""); }}
          >
            <h2 className="text-base font-bold text-white opacity-85 hover:opacity-100 transition tracking-wide">Sign up</h2>
            <div className="w-8 h-0.5 bg-sky-400 rounded mt-1 opacity-70"></div>
          </div>
        )}

        {/* SIGN UP FORM (Background Layer, active when slid down) */}
        <div className={`absolute inset-0 px-8 pt-8 transition-all duration-700 ease-in-out ${isSignUp ? "opacity-100 scale-100 z-5" : "opacity-0 scale-95 pointer-events-none z-1"}`}>
          <form onSubmit={handleSignUpSubmit} className="w-full space-y-3.5">
            <div className="flex flex-col items-center mb-4">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Sign up</h2>
            </div>

            {error && isSignUp && (
              <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-[10px] text-red-200 text-center">
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User name"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs text-white placeholder-white/60 focus:outline-none focus:border-sky-400 focus:bg-white/15 transition"
                required={isSignUp}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs text-white placeholder-white/60 focus:outline-none focus:border-sky-400 focus:bg-white/15 transition"
                required={isSignUp}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs text-white placeholder-white/60 focus:outline-none focus:border-sky-400 focus:bg-white/15 transition"
                required={isSignUp}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-sky-500/20 cursor-pointer mt-2"
            >
              Sign up
            </button>

            <p className="text-[11px] text-center text-sky-200/80 mt-3">
              Already have an account?{" "}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(false); setError(""); }}
                className="text-white font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </form>
        </div>

        {/* WHITE SLIDING CARD CONTAINER */}
        <div 
          className="absolute left-0 bottom-0 w-full bg-[#f1f5f9] rounded-t-[38px] shadow-[0_-8px_30px_rgb(0,0,0,0.15)] transition-transform duration-700 ease-in-out flex flex-col overflow-hidden"
          style={{
            height: "400px",
            transform: isSignUp ? "translateY(330px)" : "translateY(0px)"
          }}
        >
          {isSignUp ? (
            /* Toggle area showing curve + Login switch label at the bottom */
            <button 
              type="button"
              onClick={() => { setIsSignUp(false); setError(""); }}
              className="w-full h-[70px] flex flex-col items-center justify-center font-bold text-[#0c4a6e] hover:text-sky-700 text-lg transition cursor-pointer"
            >
              <span>Login</span>
              <div className="w-8 h-0.5 bg-slate-300 rounded mt-0.5"></div>
            </button>
          ) : (
            /* Full Login Form */
            <div className="w-full h-full px-8 pt-7 flex flex-col justify-start">
              <div className="flex flex-col items-center mb-4">
                <h2 className="text-3xl font-extrabold text-[#0c4a6e] tracking-tight">Login</h2>
              </div>

              <form onSubmit={handleSignInSubmit} className="w-full space-y-3.5">
                {error && !isSignUp && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-600 text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                    required={!isSignUp}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                    required={!isSignUp}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="accent-sky-600 rounded" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="hover:underline">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0c4a6e] hover:bg-[#075985] text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-sky-900/20 cursor-pointer"
                >
                  Login
                </button>

                <p className="text-[11px] text-center text-slate-500 mt-4">
                  New here?{" "}
                  <button 
                    type="button" 
                    onClick={() => { setIsSignUp(true); setError(""); }}
                    className="text-sky-600 font-semibold hover:underline cursor-pointer"
                  >
                    Create an Account
                  </button>
                </p>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
