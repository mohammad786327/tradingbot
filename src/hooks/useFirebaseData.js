import { useState, useEffect } from 'react';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/FirebaseAuthContext';

export const useFirebaseUser = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setUserData(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      } else {
        setUserData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return { userData, loading };
};

export const useUserExchanges = () => {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setExchanges([]);
      return;
    }

    const q = query(collection(db, 'exchanges'), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExchanges(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching exchanges:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return { exchanges, loading };
};

export const useUserBots = () => {
  const { user } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setBots([]);
      return;
    }

    const q = query(collection(db, 'bots'), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBots(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bots:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return { bots, loading };
};

export const useUserPositions = () => {
  const { user } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setPositions([]);
      return;
    }

    const q = query(collection(db, 'positions'), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPositions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching positions:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return { positions, loading };
};

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setSettings(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'settings', user.uid), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching settings:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return { settings, loading };
};

export const useRolePermissions = (role) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'role_permissions', role), (doc) => {
      if (doc.exists()) {
        setPermissions(doc.data());
      } else {
        // Fallback or empty if not found
        setPermissions(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching role permissions:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [role]);

  return { permissions, loading };
};