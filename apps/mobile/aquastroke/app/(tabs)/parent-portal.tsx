import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ParentPortal() {
  const { userProfile, isParent } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAbsenceRequest, setShowAbsenceRequest] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('');
  const [childAttendance, setChildAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (isParent) {
      fetchChildren();
    }
  }, [isParent, userProfile?.id]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      if (!userProfile?.id) return;

      // Get parent record
      const { data: parentData } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', userProfile.id)
        .single();

      if (!parentData) return;

      // Get linked athletes
      const { data: athletesData } = await supabase
        .from('parent_athlete_links')
        .select('athlete_id')
        .eq('parent_id', parentData.id);

      if (!athletesData) return;

      const athleteIds = athletesData.map(a => a.athlete_id);

      // Get athlete details
      const { data: athletes } = await supabase
        .from('athletes')
        .select('*')
        .in('id', athleteIds);

      setChildren(athletes || []);
      if (athletes && athletes.length > 0) {
        setSelectedChild(athletes[0]);
        fetchChildAttendance(athletes[0].id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildAttendance = async (athleteId: string) => {
    try {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false })
        .limit(10);

      setChildAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleAbsenceRequest = async () => {
    if (!selectedChild || !absenceReason.trim()) return;

    try {
      // Get parent ID
      const { data: parentData } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', userProfile?.id)
        .single();

      if (!parentData) return;

      // Create absence request
      await supabase
        .from('absence_requests')
        .insert([
          {
            athlete_id: selectedChild.id,
            parent_id: parentData.id,
            academy_id: selectedChild.academy_id,
            session_id: null, // Would be set to actual session
            reason: absenceReason,
            status: 'pending',
          },
        ]);

      setAbsenceReason('');
      setShowAbsenceRequest(false);
      alert('Absence request submitted successfully!');
    } catch (error) {
      console.error('Error submitting absence request:', error);
      alert('Failed to submit absence request');
    }
  };

  if (!isParent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Access Denied</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0057FF" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F7F9FC' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#0891B2', padding: 20, paddingTop: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
          Parent Portal
        </Text>
        <Text style={{ fontSize: 14, color: '#E0F2FE' }}>
          Monitor your child's progress
        </Text>
      </View>

      {/* Child Selection */}
      {children.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 8, color: '#0A1628' }}>
            Select Child
          </Text>
          <FlatList
            scrollEnabled={false}
            data={children}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedChild(item);
                  fetchChildAttendance(item.id);
                }}
                style={{
                  backgroundColor: selectedChild?.id === item.id ? '#E0F2FE' : 'white',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                  borderWidth: 2,
                  borderColor: selectedChild?.id === item.id ? '#0891B2' : '#E4E9F0',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0A1628' }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                  {item.category} • {item.main_stroke || 'N/A'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Child Stats */}
      {selectedChild && (
        <>
          <View style={{ paddingHorizontal: 16, gap: 12, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
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
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
                  Attendance Rate
                </Text>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#059669' }}>
                  92%
                </Text>
              </TouchableOpacity>

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
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
                  Sessions This Week
                </Text>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0057FF' }}>
                  5
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#0A1628' }}>
              Actions
            </Text>
            <TouchableOpacity
              onPress={() => setShowAbsenceRequest(true)}
              style={{
                backgroundColor: '#FEF3C7',
                borderRadius: 10,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#D97706',
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#D97706' }}>
                Request Absence
              </Text>
              <Text style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>
                Request permission for your child to miss a session
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: '#E0F2FE',
                borderRadius: 10,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#0891B2',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0891B2' }}>
                View Training Plan
              </Text>
              <Text style={{ fontSize: 12, color: '#0C5A6E', marginTop: 4 }}>
                See the current 36-week training schedule
              </Text>
            </TouchableOpacity>
          </View>

          {/* Attendance History */}
          <View style={{ paddingHorizontal: 16, marginBottom: 30 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#0A1628' }}>
              Recent Attendance
            </Text>
            <FlatList
              scrollEnabled={false}
              data={childAttendance}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                    borderLeftWidth: 4,
                    borderLeftColor:
                      item.status === 'present'
                        ? '#059669'
                        : item.status === 'absent'
                        ? '#DC2626'
                        : '#D97706',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#0A1628' }}>
                      Session {item.id.slice(0, 8)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color:
                          item.status === 'present'
                            ? '#059669'
                            : item.status === 'absent'
                            ? '#DC2626'
                            : '#D97706',
                      }}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                  {item.absence_reason && (
                    <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                      Reason: {item.absence_reason}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>
        </>
      )}

      {/* Absence Request Modal */}
      <Modal visible={showAbsenceRequest} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 40,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#0A1628' }}>
              Request Absence
            </Text>

            <TextInput
              placeholder="Enter reason for absence"
              value={absenceReason}
              onChangeText={setAbsenceReason}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: '#F7F9FC',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#E4E9F0',
                color: '#0A1628',
              }}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowAbsenceRequest(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#F7F9FC',
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#E4E9F0',
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#0A1628' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAbsenceRequest}
                style={{
                  flex: 1,
                  backgroundColor: '#0057FF',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: 'white' }}>
                  Submit Request
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
