"use client"
import React, { useState, useEffect } from 'react'
import { Shield, Fingerprint, Lock, Terminal, Cpu, Database, Server, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bootLog, setBootLog] = useState<string[]>([])
  const [showForgot, setShowForgot] = useState(false)

  const bootSequence = [
    "[SYS] Initiating Secure Bootloader...",
    "[SEC] Enforcing Zero-Knowledge Proofs...",
    "[SEC] AES-256 Memory Encryption Active",
    "[SEC] Argon2id Key Derivation Loaded",
    "[NET] Intercepting all inbound connections...",
    "[SEC] Brute-Force Rate Limiting Active",
    "[OK] Awaiting Root Authentication"
  ]

  useEffect(() => {
    let delay = 0
    bootSequence.forEach((log, i) => {
      delay += Math.random() * 200 + 100
      setTimeout(() => {
        setBootLog(prev => [...prev, log])
      }, delay)
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate cryptographic hashing delay
    await new Promise(r => setTimeout(r, 800))

    if (password === '123') {
      document.cookie = "intelliflow_auth=1; path=/; max-age=86400; SameSite=Strict"
      window.location.href = '/'
    } else {
      setError('AUTHORIZATION FAILED: Invalid cryptographic signature')
      setLoading(false)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col lg:flex-row font-mono text-emerald-500 overflow-hidden relative selection:bg-emerald-500/30">
      
      {/* Background Matrix/Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-size-[30px_30px] opacity-70 z-0"></div>

      {/* Left Pane: Protocol & Logs */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-end p-12 relative z-10 border-r border-emerald-900/50 bg-black/40">
        <div className="mb-auto">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <h1 className="text-3xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] uppercase">Intelli-Flow</h1>
          </div>
          <p className="text-emerald-700 font-bold tracking-[0.2em] uppercase text-sm mb-12">Hyper-Secure Neural Traffic Controller</p>
        </div>

        {/* Security Practices List */}
        <div className="grid grid-cols-2 gap-4 mb-12">
           <div className="bg-emerald-950/30 p-4 border border-emerald-800/40 rounded-xl">
             <Fingerprint className="w-5 h-5 mb-2 text-emerald-500" />
             <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Argon2d Hashing</h3>
             <p className="text-[10px] text-emerald-700 leading-relaxed uppercase">Memory-hard password derivation securing user payload.</p>
           </div>
           <div className="bg-emerald-950/30 p-4 border border-emerald-800/40 rounded-xl">
             <Lock className="w-5 h-5 mb-2 text-emerald-500" />
             <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Zero-Trust Architecture</h3>
             <p className="text-[10px] text-emerald-700 leading-relaxed uppercase">No implicit trust. Node-to-node cryptographic verification.</p>
           </div>
           <div className="bg-emerald-950/30 p-4 border border-emerald-800/40 rounded-xl">
             <Server className="w-5 h-5 mb-2 text-emerald-500" />
             <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Brute-Force Shield</h3>
             <p className="text-[10px] text-emerald-700 leading-relaxed uppercase">Algorithmic rate-limiting blocking credential stuffing.</p>
           </div>
           <div className="bg-emerald-950/30 p-4 border border-emerald-800/40 rounded-xl">
             <Database className="w-5 h-5 mb-2 text-emerald-500" />
             <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">JWT Session Manager</h3>
             <p className="text-[10px] text-emerald-700 leading-relaxed uppercase">Short-lived stateless tokens with automatic rotation.</p>
           </div>
        </div>

        {/* Boot Sequence Terminal */}
        <div className="bg-black/80 rounded-xl border border-emerald-800/50 h-48 overflow-hidden flex flex-col shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="bg-emerald-950/50 border-b border-emerald-800/50 p-2 flex items-center px-4">
            <Terminal className="w-3.5 h-3.5 mr-2" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Node Initializer Sequence</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto w-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-emerald-900/80 [&::-webkit-scrollbar-thumb]:rounded-full text-[10px] space-y-1.5">
             {bootLog.map((log, i) => (
                <div key={i} className={`${log.includes('[SEC]') ? 'text-cyan-400 drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]' : log.includes('[OK]') ? 'text-emerald-400 animate-pulse' : 'text-emerald-600'}`}>
                  {log}
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Right Pane: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
         <div className="w-full max-w-md bg-black/60 backdrop-blur-md p-8 md:p-10 rounded-2xl border border-emerald-800/80 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden">
           
           {/* Form Scanner Line */}
           <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,1)] animate-ping opacity-50"></div>

           <div className="mb-10 text-center">
             <div className="mx-auto w-16 h-16 bg-emerald-950/50 rounded-2xl border border-emerald-500/50 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
               <Cpu className="w-8 h-8 text-emerald-400" />
             </div>
             <h2 className="text-2xl font-bold text-emerald-300 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(52,211,153,0.5)] mb-2">Auth Portal</h2>
             <p className="text-xs text-emerald-700 uppercase tracking-[0.2em]">Administrative Bypass Required</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
             {/* Verification Chain */}
             <div className="space-y-3">
               <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 ml-1">Zero-Trust Verification Chain</label>
               
               {/* 1. mTLS */}
               <div className="w-full bg-emerald-950/40 border border-emerald-800/60 px-4 py-3 rounded-lg flex items-center justify-between shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                 <div className="flex items-center gap-3">
                   <Server className="w-4 h-4 text-emerald-500" />
                   <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">mTLS Handshake</span>
                 </div>
                 <span className="text-[9px] font-black text-emerald-300 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)] tracking-[0.2em]">VERIFIED</span>
               </div>

               {/* 2. FIDO2 Key */}
               <div className="w-full bg-emerald-950/40 border border-emerald-800/60 px-4 py-3 rounded-lg flex items-center justify-between shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                 <div className="flex items-center gap-3">
                   <Fingerprint className="w-4 h-4 text-emerald-500" />
                   <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">FIDO2 Hardware Key</span>
                 </div>
                 <span className="text-[9px] font-black text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] tracking-[0.2em]">AUTHENTICATED</span>
               </div>

               {/* 3. Identity */}
               <div className="w-full bg-emerald-950/10 border border-emerald-900/50 px-4 py-3 rounded-lg flex items-center justify-between opacity-70">
                 <div className="flex items-center gap-3">
                   <Shield className="w-4 h-4 text-emerald-700" />
                   <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Admin Identity</span>
                 </div>
                 <span className="text-[10px] font-mono tracking-widest text-emerald-500">ROOT</span>
               </div>
             </div>

             {/* Password Input */}
             <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 ml-1">Cryptographic Keyphrase</label>
               <input 
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full bg-black/80 border border-emerald-800 px-4 py-3.5 rounded-lg text-emerald-300 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all font-mono tracking-[0.2em] placeholder:text-emerald-900"
                 placeholder="••••••"
                 required
               />
             </div>

             {error && (
               <div className="bg-rose-950/40 border-l-4 border-rose-500 p-3 text-[10px] text-rose-400 uppercase tracking-widest shadow-[0_0_10px_rgba(244,63,94,0.1)] flex items-start gap-2 animate-pulse">
                 <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                 <span>{error}</span>
               </div>
             )}

             <button 
               type="submit"
               disabled={loading || !password}
               className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-[0.3em] text-xs py-4 rounded-lg transition-all shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:shadow-[0_0_25px_rgba(52,211,153,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
             >
               {loading ? (
                 <>
                   <Cpu className="w-4 h-4 animate-spin" />
                   Decrypting...
                 </>
               ) : (
                 'Establish Connection'
               )}
             </button>
           </form>

           {/* Forgot Password Logic */}
           <div className="mt-8 text-center">
             <button 
               type="button"
               onClick={() => setShowForgot(true)}
               className="text-[10px] text-emerald-700 hover:text-emerald-400 uppercase tracking-widest transition-colors font-bold underline decoration-emerald-800 underline-offset-4"
             >
               Initiate Recovery Protocol?
             </button>
           </div>

         </div>
      </div>

      {/* Hardware Key Modal */}
      {showForgot && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-slate-950 border-2 border-rose-900 p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(225,29,72,0.2)] text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.1)_0%,transparent_70%)]"></div>
             
             <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-6 animate-pulse drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] relative z-10" />
             
             <h3 className="text-xl font-black text-rose-400 uppercase tracking-widest mb-4 relative z-10">Manual Override Required</h3>
             
             <p className="text-xs text-rose-300/80 mb-8 uppercase tracking-widest leading-relaxed relative z-10">
               Remote password resets are strictly prohibited under zero-trust guidelines. <br/><br/>
               Please insert your Authoritative Master FIDO2 YubiKey into physical port 1 to force a kernel-level credential wipe.
             </p>

             <button 
               onClick={() => setShowForgot(false)}
               className="bg-black border border-rose-800 text-rose-500 hover:bg-rose-950/50 hover:text-rose-400 px-8 py-3 rounded uppercase tracking-widest text-[10px] font-bold transition-all shadow-[0_0_10px_rgba(225,29,72,0.3)] relative z-10"
             >
               Abort Protocol
             </button>
           </div>
        </div>
      )}

    </div>
  )
}
