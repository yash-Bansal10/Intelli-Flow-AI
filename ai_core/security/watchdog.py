class WatchdogSimulator:
    """
    Simulates an Edge Compute failure.
    If the agent (e.g. Jetson Nano) crashes, the physical junction 
    automatically falls back to a locally encoded fixed-timer sequence.
    """
    def __init__(self):
        self.crashed_agents = set()
        self.current_fallback_action = {}
        self.spoof_attempts = {} # jid -> timestamp
        import time
        self.time = time
        
    def report_spoof_attempt(self, jid):
        """Records a spoof attempt for visual feedback in SUMO."""
        self.spoof_attempts[jid] = self.time.time()
        print(f"🚨 [SECURITY] Blocked spoofed V2X payload aimed at {jid}!")
        
    def is_recently_spoofed(self, jid):
        """Returns True if a spoof was blocked in the last 2 seconds."""
        if jid in self.spoof_attempts:
            return (self.time.time() - self.spoof_attempts[jid]) < 2.0
        return False
        
    def trigger_crash(self, jid):
        """Simulates a model crash event for a specific agent."""
        if jid not in self.crashed_agents:
            self.crashed_agents.add(jid)
            self.current_fallback_action[jid] = 0 # Default starting fallback phase (NS)
            print(f"⚠️ [WATCHDOG] Agent {jid} offline! Hardware Fail-Safe Engaged.")
        
    def recover(self, jid):
        """Restores AI control to the junction."""
        if jid in self.crashed_agents:
            self.crashed_agents.remove(jid)
            if jid in self.current_fallback_action:
                del self.current_fallback_action[jid]
            print(f"✅ [WATCHDOG] Agent {jid} restored. AI resuming control.")

    def is_crashed(self, jid):
        return jid in self.crashed_agents
        
    def get_fallback_action(self, jid, time_in_phase):
        """
        Provides the dumb fixed-timer fallback logic.
        Switches phases exactly every 30 seconds.
        """
        if jid not in self.current_fallback_action:
            self.current_fallback_action[jid] = 0
            
        if time_in_phase >= 30:
            # Flip action: 0 -> 1, or 1 -> 0
            self.current_fallback_action[jid] = 1 - self.current_fallback_action[jid]
            
        return self.current_fallback_action[jid]

# Global instance for the backend
global_watchdog = WatchdogSimulator()
