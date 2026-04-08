import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Athletes
export const useAthletes = () => {
  const { userProfile } = useAuth();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile?.academy_id) return;

    const fetchAthletes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('athletes')
          .select('*')
          .eq('academy_id', userProfile.academy_id)
          .eq('is_active', true);

        if (error) throw error;
        setAthletes(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, [userProfile?.academy_id]);

  return { athletes, loading, error };
};

// Seasons
export const useSeasons = () => {
  const { userProfile } = useAuth();
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile?.academy_id) return;

    const fetchSeasons = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('seasons')
          .select('*')
          .eq('academy_id', userProfile.academy_id)
          .eq('is_active', true)
          .order('start_date', { ascending: false });

        if (error) throw error;
        setSeasons(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasons();
  }, [userProfile?.academy_id]);

  return { seasons, loading, error };
};

// Sessions
export const useSessions = (weeklyPlanId?: string) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!weeklyPlanId) return;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('weekly_plan_id', weeklyPlanId)
          .order('session_date', { ascending: true });

        if (error) throw error;
        setSessions(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [weeklyPlanId]);

  return { sessions, loading, error };
};

// Attendance
export const useAttendance = (athleteId?: string) => {
  const { userProfile } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId || !userProfile?.academy_id) return;

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('athlete_id', athleteId)
          .eq('academy_id', userProfile.academy_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAttendance(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [athleteId, userProfile?.academy_id]);

  return { attendance, loading, error };
};

// Trial Results
export const useTrialResults = (athleteId?: string) => {
  const [trials, setTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;

    const fetchTrials = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('trial_results')
          .select('*')
          .eq('athlete_id', athleteId)
          .order('trial_number', { ascending: true });

        if (error) throw error;
        setTrials(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrials();
  }, [athleteId]);

  return { trials, loading, error };
};

// Notifications
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return { notifications, loading, error };
};
