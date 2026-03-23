"use client"
import { useSidebar } from "@/context/SidebarContext"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()
  const pathname = usePathname()
  const isSimulationTab = pathname === "/"

  return (
    <motion.main
      animate={{ marginLeft: isOpen ? undefined : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`relative z-0 flex-1 flex flex-col bg-white shadow-[0_0_15px_rgba(0,0,0,0.02)] min-h-[calc(100vh-4rem)] transition-all duration-300 ${
        isOpen ? "ml-16 lg:ml-64" : "ml-0"
      } ${isSimulationTab ? "p-0" : "p-4 sm:p-6"}`}
    >
      {children}
    </motion.main>
  )
}
