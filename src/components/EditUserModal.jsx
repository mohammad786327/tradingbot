
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCog, Shield, Mail, User, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { adminDataManager } from '@/utils/adminDataManager';
import { cn } from '@/lib/utils';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const EditUserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Viewer'
  });
  const [errors, setErrors] = useState({});
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || user.displayName || '',
        email: user.email || '',
        role: user.role || 'Viewer'
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      adminDataManager.updateUser(user.id, formData);
      toast({
        title: "User updated successfully",
        description: `Changes to ${formData.name} have been saved.`,
        variant: "default",
        className: "bg-green-600 border-green-700 text-white"
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setIsResettingPassword(true);
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Reset Email Sent",
        description: `Password reset instructions sent to ${user.email}`,
        className: "bg-blue-600 text-white border-none"
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCog className="text-blue-500" size={24} /> Edit User
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={cn(
                      "w-full bg-[#111] border rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none focus:ring-1 transition-all",
                      errors.name ? "border-red-500 focus:ring-red-500" : "border-[#333] focus:border-blue-500 focus:ring-blue-500"
                    )}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={cn(
                      "w-full bg-[#111] border rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none focus:ring-1 transition-all",
                      errors.email ? "border-red-500 focus:ring-red-500" : "border-[#333] focus:border-blue-500 focus:ring-blue-500"
                    )}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Role</label>
                <div className="relative">
                  <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="pt-4 border-t border-[#2a2a2a]">
              <div className="flex items-center justify-between mb-2">
                 <h4 className="text-sm font-bold text-white flex items-center gap-2">
                   <KeyRound size={16} className="text-yellow-500"/> Password Management
                 </h4>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Passwords are not stored in the database. Send a reset email to let the user set a new one securely.
              </p>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isResettingPassword}
                className="text-xs px-3 py-2 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg text-white transition-colors flex items-center gap-2"
              >
                {isResettingPassword ? "Sending..." : "Send Password Reset Email"}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#333] font-bold text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-user-form"
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-900/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditUserModal;
