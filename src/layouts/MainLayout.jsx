
import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, Bot, Zap, Grid, PieChart, Activity, Flame, ChevronLeft, ChevronRight, ChevronDown, TrendingUp, BarChart2, Shield, Settings, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isBotTradingExpanded, setIsBotTradingExpanded] = useState(true);

  const { canAccessAdminPanel, hasTabAccess, loading: permsLoading } = usePermissions();
  
  const toggleSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

  // Navigation Data
  const allNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', tabName: 'Dashboard' },
    { icon: Activity, label: 'Positions', path: '/positions', tabName: 'Positions' },
    { icon: TrendingUp, label: 'Manual Trade', path: '/manual-trade', tabName: 'Manual Trade' },
    { icon: BarChart2, label: 'Advanced Chart', path: '/advanced-chart', tabName: 'Advanced Chart' },
    { icon: FileText, label: 'Templates', path: '/templates', tabName: 'Templates' },
    { icon: Wallet, label: 'Exchange Accounts', path: '/exchange-accounts', tabName: 'Exchange Accounts' },
    { icon: Settings, label: 'Settings', path: '/settings', tabName: 'Settings' },
  ];

  const visibleNavItems = allNavItems.filter(item => hasTabAccess(item.tabName));

  const botSubmenu = [
    { icon: Zap, label: 'Price Movement', path: '/price-movement-bot' },
    { icon: Grid, label: 'Grid Trading', path: '/grid-trading' },
    { icon: PieChart, label: 'DCA Trading', path: '/dca-trading' },
    { icon: Activity, label: 'RSI Trading', path: '/rsi-bot' },
    { icon: Flame, label: 'Candle Strike', path: '/candle-strike-bot' },
  ];

  const NavItem = ({ item, isSubItem = false, activeColorClass = "text-blue-400" }) => (
    <NavLink
      to={item.path}
      onClick={() => setIsMobileSidebarOpen(false)}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
          isActive
            ? `bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]`
            : "text-gray-400 hover:text-white hover:bg-[#252525]",
          isSubItem && !isSidebarCollapsed ? "ml-4" : "",
          isSidebarCollapsed ? "justify-center px-2" : ""
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon size={20} className={cn("shrink-0 transition-colors", isActive ? activeColorClass : "text-gray-400 group-hover:text-white")} />
          
          {!isSidebarCollapsed && (
            <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>
          )}

          {isSidebarCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-[#252525] text-white text-xs rounded border border-[#3a3a3a] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col overflow-hidden">
      <Header 
        toggleSidebar={toggleSidebar} 
        isSidebarCollapsed={isSidebarCollapsed} 
      />

      <div className="flex flex-1 overflow-hidden relative">
        <motion.aside
          initial={false}
          animate={{ 
            width: isSidebarCollapsed ? '80px' : '260px',
            x: isMobileSidebarOpen ? 0 : (window.innerWidth < 1024 ? -260 : 0)
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "bg-[#1a1a1a] border-r border-[#2a2a2a] z-40 flex flex-col h-full",
            "lg:translate-x-0",
            "fixed inset-y-0 left-0 lg:relative"
          )}
          style={{ zIndex: isMobileSidebarOpen ? 50 : 40 }}
        >
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3.5 top-8 h-7 w-7 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-400 hover:text-white rounded-full shadow-lg z-50 hidden lg:flex items-center justify-center hover:bg-[#333] transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar overflow-x-hidden">
            {/* Standard Items */}
            {!permsLoading && visibleNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}

            {/* Admin Panel Link */}
            {!permsLoading && canAccessAdminPanel() && (
               <NavLink
                 to="/admin"
                 onClick={() => setIsMobileSidebarOpen(false)}
                 className={({ isActive }) =>
                   cn(
                     "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative mt-2",
                     isActive
                       ? "bg-gradient-to-r from-red-600/20 to-orange-600/20 text-white border border-red-500/30 shadow-[0_0_15px_-3px_rgba(220,38,38,0.3)]"
                       : "text-gray-400 hover:text-white hover:bg-[#252525]",
                     isSidebarCollapsed ? "justify-center px-2" : ""
                   )
                 }
               >
                 {({ isActive }) => (
                   <>
                     <Shield size={20} className={cn("shrink-0 transition-colors", isActive ? "text-red-400" : "text-gray-400 group-hover:text-red-400")} />
                     
                     {!isSidebarCollapsed && (
                       <span className="whitespace-nowrap text-sm font-medium text-red-100/90">Admin Panel</span>
                     )}
           
                     {isSidebarCollapsed && (
                       <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-[#252525] text-white text-xs rounded border border-[#3a3a3a] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity">
                         Admin Panel
                       </div>
                     )}
                   </>
                 )}
               </NavLink>
            )}

            {/* Bot Submenu */}
            {!permsLoading && hasTabAccess('Bot Trading') && (
              <div className="pt-4 pb-2">
                  {!isSidebarCollapsed ? (
                      <div 
                          className="mb-2 px-3 flex items-center justify-between cursor-pointer group"
                          onClick={() => setIsBotTradingExpanded(!isBotTradingExpanded)}
                      >
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-300 transition-colors">
                              Bot Strategies
                          </span>
                          <ChevronDown size={14} className={cn("text-gray-500 transition-transform duration-200", !isBotTradingExpanded && "-rotate-90")} />
                      </div>
                  ) : (
                      <div className="h-px bg-[#2a2a2a] mx-2 mb-4"></div>
                  )}
                  
                  <AnimatePresence initial={false}>
                      {(isBotTradingExpanded || isSidebarCollapsed) && (
                          <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-1 overflow-hidden"
                          >
                              {botSubmenu.map((item) => (
                                  <NavItem key={item.path} item={item} isSubItem={true} />
                              ))}
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-[#2a2a2a]">
            {!isSidebarCollapsed ? (
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-4 border border-blue-500/10 text-center">
                 <p className="text-xs font-medium text-blue-200">Pro Plan Active</p>
                 <p className="text-[10px] text-gray-400 mt-1">Valid until Feb 28</p>
              </div>
            ) : (
              <div className="flex justify-center">
                 <Bot size={20} className="text-blue-500" />
              </div>
            )}
          </div>
        </motion.aside>

        <main id="main-scroll-container" className="flex-1 overflow-y-auto bg-[#0f0f0f] relative w-full scroll-smooth">
            <Outlet />
        </main>
        
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default MainLayout;
