
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Settings as SettingsIcon, Shield, Lock, Save } from 'lucide-react';
import NotificationSettings from '@/components/NotificationSettings';
import { useAuth } from '@/context/FirebaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handlePassChange = (e) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passForm.newPassword.length < 6) {
      toast({ title: "Error", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setIsChangingPass(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passForm.currentPassword);
      
      // 1. Re-authenticate
      await reauthenticateWithCredential(user, credential);
      
      // 2. Update password
      await updatePassword(user, passForm.newPassword);
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        className: "bg-green-600 text-white border-none"
      });
      
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
    } catch (error) {
      console.error("Password change error:", error);
      let msg = "Failed to update password.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = "Current password is incorrect.";
      } else if (error.code === 'auth/weak-password') {
        msg = "New password is too weak.";
      }
      
      toast({
        title: "Error",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings - CryptoBot Trading Platform</title>
        <meta name="description" content="Configure your trading platform settings and preferences" />
      </Helmet>

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 min-h-screen">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <SettingsIcon size={32} className="text-white" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400">Configure your workspace and preferences.</p>
            </div>
        </div>
        
        {/* Notification Settings Section */}
        <NotificationSettings />

        {/* Security & Password Section */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-blue-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Security & Login</h2>
              <p className="text-sm text-gray-400">Manage your password and account security</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Current Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  name="currentPassword"
                  value={passForm.currentPassword}
                  onChange={handlePassChange}
                  className="w-full bg-[#111] border border-[#333] rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter current password"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-300">New Password</label>
               <div className="relative">
                 <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input
                   type="password"
                   name="newPassword"
                   value={passForm.newPassword}
                   onChange={handlePassChange}
                   className="w-full bg-[#111] border border-[#333] rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                   placeholder="Min 6 characters"
                   required
                 />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
               <div className="relative">
                 <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input
                   type="password"
                   name="confirmPassword"
                   value={passForm.confirmPassword}
                   onChange={handlePassChange}
                   className="w-full bg-[#111] border border-[#333] rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                   placeholder="Re-enter new password"
                   required
                 />
               </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isChangingPass ? "Updating..." : "Update Password"}
                {!isChangingPass && <Save size={18} />}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-gray-500 text-sm py-4">
            Account security is managed securely by Google Firebase Authentication.
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
