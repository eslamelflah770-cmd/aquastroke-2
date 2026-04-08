import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAthletes, useSeasons, useNotifications } from '../../hooks/useData';
import { supabase } from '../../lib/supabase';

export default function CoachDashboard() {
  const { userProfile, isCoach } = useAuth();
  const { athletes, loading: athletesLoading } = useAthletes();
  const { seasons, loading: seasonsLoading } = useSeasons();
  const { notifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isCoach) {
      fetchStats();
    }
  }, [isCoach, userProfile?.academy_id]);

  const fetchStats = async () => {
    try {
      if (!userProfile?.academy_id) return;

      // Get attendance statistics
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('academy_id', userProfile.academy_id);

      // Get trial results
      const { data: trialsData } = await supabase
        .from('trial_results')
        .select('gap_percent')
        .eq('academy_id', userProfile.academy_id);

      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const absentCount = attendanceData?.filter(a => a.status === 'absent').length || 0;
      const averageGap = trialsData?.length 
        ? (trialsData.reduce((sum, t) => sum + (t.gap_percent || 0), 0) / trialsData.length).toFixed(2)
        : 0;

      setStats({
        totalAthletes: athletes.length,
        presentToday: presentCount,
        absentToday: absentCount,
        averagePerformanceGap: averageGap,
        unreadNotifications: notifications.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  if (!isCoach) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Access Denied</Text>
      </View>
    );
  }

  if (athletesLoading || seasonsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0057FF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F7F9FC' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={{ backgroundColor: '#0057FF', padding: 20, paddingTop: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
          Coach Dashboard
        </Text>
        <Text style={{ fontSize: 14, color: '#E0E7FF' }}>
          Welcome back, {userProfile?.display_name}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Total Athletes */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E4E9F0',
            }}
          >
            <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Total Athletes</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0057FF' }}>
              {stats?.totalAthletes || 0}
            </Text>
          </TouchableOpacity>

          {/* Present Today */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E4E9F0',
            }}
          >
            <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Present Today</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#059669' }}>
              {stats?.presentToday || 0}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Absent Today */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E4E9F0',
            }}
          >
            <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Absent Today</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#DC2626' }}>
              {stats?.absentToday || 0}
            </Text>
          </TouchableOpacity>

          {/* Avg Performance Gap */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E4E9F0',
            }}
          >
            <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Avg Gap %</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#D97706' }}>
              {stats?.averagePerformanceGap || '0'}%
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#0A1628' }}>
          Quick Actions
        </Text>
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#0057FF',
              borderRadius: 10,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              Mark Attendance
            </Text>
            <Text style={{ color: 'white', fontSize: 18 }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#0891B2',
              borderRadius: 10,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              Record Trial Results
            </Text>
            <Text style={{ color: 'white', fontSize: 18 }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#059669',
              borderRadius: 10,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              Create Training Plan
            </Text>
            <Text style={{ color: 'white', fontSize: 18 }}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Athletes List */}
      <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#0A1628' }}>
          Your Athletes ({athletes.length})
        </Text>
        <FlatList
          scrollEnabled={false}
          data={athletes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                backgroundColor: 'white',
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#E4E9F0',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0A1628' }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                  {item.category} • {item.main_stroke || 'N/A'}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: '#EEF3FF',
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#0057FF' }}>
                  View
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Absence Requests */}
      <View style={{ paddingHorizontal: 16, marginBottom: 30 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#0A1628' }}>
          Pending Absence Requests
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#FEF3C7',
            borderRadius: 10,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#D97706',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#D97706', marginBottom: 4 }}>
            3 Pending Requests
          </Text>
          <Text style={{ fontSize: 12, color: '#92400E' }}>
            Review and approve/reject absence requests from parents
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
