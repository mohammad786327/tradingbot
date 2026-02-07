
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Shield, Mail, User, Lock, Eye, EyeOff, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/services/firebase';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Viewer' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength check
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  
  const passwordStrength = getPasswordStrength(formData.password);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Min 6 characters required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    console.log("Starting user creation process for:", formData.email);

    // Initialize secondary app to avoid logging out current admin
    let secondaryApp;
    try {
      console.log("Initializing secondary Firebase app...");
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      const secondaryDb = getFirestore(secondaryApp);

      // Create Auth User
      console.log("Attempting to create Auth user...");
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.email, 
        formData.password
      );
      
      const uid = userCredential.user.uid;
      console.log("Auth user created successfully. UID:", uid);

      // Create Firestore User Doc
      // CRITICAL: We DO NOT store the password in Firestore. Only metadata.
      const userData = {
        uid: uid,
        email: formData.email,
        displayName: formData.name,
        name: formData.name,
        role: formData.role,
        photoURL: null,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        status: 'Active'
      };

      console.log("Creating Firestore user document...", userData);
      await setDoc(doc(secondaryDb, 'users', uid), userData);
      console.log("Firestore user document created.");
      
      // Create Default Settings Doc
      await setDoc(doc(secondaryDb, 'settings', uid), {
         theme: 'dark',
         soundEnabled: true,
         soundVolume: 50,
         selectedSound: 'bell',
         notifications: true
      });
      console.log("Default settings created.");

      // Sign out the secondary auth so it doesn't interfere
      await signOut(secondaryAuth);
      console.log("Secondary app signed out.");

      toast({
        title: "User created successfully",
        description: `${formData.name} has been added as ${formData.role}.`,
        className: "bg-green-600 text-white border-none"
      });
      
      setFormData({ name: '', email: '', password: '', role: 'Viewer' });
      onSuccess(); // Trigger refresh if needed
      onClose();

    } catch (error) {
      console.error("Error creating user:", error);
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = "Email is already registered.";
      
      toast({
        title: "Error creating user",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      // Cleanup happens automatically when variable goes out of scope or we can explicitly deleteApp if we imported it
      // but standard firebase web SDK handles multiple apps fine.
    }
  };

  if (!isOpen) return null;

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
              <UserPlus className="text-blue-500" size={24} /> Add New User
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
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
                  placeholder="John Doe"
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
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
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            
            {/* Password */}
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
                 <span>Password</span>
                 <span className="text-xs text-gray-500 font-normal">Min 6 characters</span>
               </label>
               <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={cn(
                      "w-full bg-[#111] border rounded-lg py-2.5 pl-9 pr-10 text-white focus:outline-none focus:ring-1 transition-all",
                      errors.password ? "border-red-500 focus:ring-red-500" : "border-[#333] focus:border-blue-500 focus:ring-blue-500"
                    )}
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
               </div>
               
               <div className="flex items-start gap-2 mt-2 px-1">
                 <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                 <p className="text-xs text-gray-500 leading-tight">
                   Password is securely managed by Firebase Auth and is <strong>never</strong> stored in the database.
                 </p>
               </div>

               {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
               
               {/* Strength Bar */}
               {formData.password && (
                 <div className="flex gap-1 h-1 mt-1">
                    <div className={cn("flex-1 rounded-full", passwordStrength >= 1 ? "bg-red-500" : "bg-gray-800")}></div>
                    <div className={cn("flex-1 rounded-full", passwordStrength >= 3 ? "bg-yellow-500" : "bg-gray-800")}></div>
                    <div className={cn("flex-1 rounded-full", passwordStrength >= 4 ? "bg-green-500" : "bg-gray-800")}></div>
                 </div>
               )}
            </div>

            {/* Role */}
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

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#333] font-bold text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddUserModal;
