import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { MdDashboard, MdGroup, MdBusiness, MdAssessment, MdSettings, MdLogout, MdMenu, MdClose, MdPerson } from 'react-icons/md';
import { GrTask, GrChat, GrUserSettings } from 'react-icons/gr';
import { useState } from 'react';

interface SidebarProps {
  onSettingsClick?: () => void;
}

export function Sidebar({ onSettingsClick }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const superadminItems = [
    { label: 'Dashboard', href: '/superadmin/dashboard', icon: MdDashboard },
    { label: 'Team Members', href: '/superadmin/team', icon: MdGroup },
    { label: 'Clients', href: '/superadmin/clients', icon: MdBusiness },
    { label: 'Reports', href: '/superadmin/reports', icon: MdAssessment },
    { label: 'Settings', href: null, icon: MdSettings, onClick: onSettingsClick },
  ];

  const clientItems = [
    { label: 'Dashboard', href: '/client/dashboard', icon: MdDashboard },
    { label: 'My Activities', href: '/client/activities', icon: GrTask },
    { label: 'Messages', href: '/client/dashboard?tab=messages', icon: GrChat },
    { label: 'Contacts', href: '/client/contacts', icon: MdPerson },
    { label: 'Settings', href: '/client/settings', icon: MdSettings },
    { label: 'Profile', href: '/client/profile', icon: GrUserSettings },
  ];

  const menuItems = user?.role === 'superadmin' ? superadminItems : clientItems;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-5 left-5 z-50 lg:hidden bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition"
      >
        {isOpen ? <MdClose className="text-2xl" /> : <MdMenu className="text-2xl" />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Static position */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex-col pt-20">
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            if (item.href) {
              return (
                <Link key={item.label} href={item.href}>
                  <div className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-800 transition cursor-pointer">
                    <Icon className="text-xl flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            } else if ('onClick' in item && item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-800 transition cursor-pointer text-left"
                >
                  <Icon className="text-xl flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            }
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full bg-white/10 backdrop-blur-md text-white py-2 rounded-lg hover:bg-white/20 transition text-sm font-medium border border-white/20 flex items-center justify-center gap-2"
          >
            <MdLogout className="text-lg flex-shrink-0" />
            <span>Logout</span>
          </motion.button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white z-40 flex flex-col pt-20 lg:hidden"
          >
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                if (item.href) {
                  return (
                    <Link key={item.label} href={item.href}>
                      <div
                        onClick={handleNavClick}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Icon className="text-xl flex-shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </Link>
                  );
                } else if ('onClick' in item && item.onClick) {
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.onClick?.();
                        handleNavClick();
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <Icon className="text-xl flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                }
              })}
            </nav>

            <div className="p-4 border-t border-slate-700">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full bg-white/10 backdrop-blur-md text-white py-2 rounded-lg hover:bg-white/20 transition text-sm font-medium border border-white/20 flex items-center justify-center gap-2"
              >
                <MdLogout className="text-lg flex-shrink-0" />
                <span>Logout</span>
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
