import React, { useState, useCallback, useMemo } from 'react';
import { 
  Text, 
  StyleSheet, 
  View, 
  FlatList, 
  ActivityIndicator, 
  Platform,
  StatusBar,
  TouchableOpacity,
  Linking,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { db, auth } from '../../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// --- CYBER THEME ---
const COLORS = {
  bg: '#121212',
  card: '#1e1e1e',
  modalBg: '#1a1a1a',
  text: '#ffffff',
  accent: '#00ff9d', // Neon Green
  danger: '#ff4b4b', // Neon Red
  warning: '#f0ad4e', // Orange
  muted: '#666666',
  border: '#333333',
  activeFilter: 'rgba(0, 255, 157, 0.15)'
};

type ScanHistory = {
  id: string;
  url: string;
  prediction: 'Safe' | 'Malicious' | 'Suspicious';
  timestamp: { seconds: number; nanoseconds: number; } | null;
  type: 'QR Scan' | 'Manual';
  score?: number;  
  source?: string; 
};

type TimeRange = 'all' | 'today' | 'week';
type ScanType = 'all' | 'QR Scan' | 'Manual';
type ResultType = 'all' | 'Safe' | 'Malicious' | 'Suspicious';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const [filters, setFilters] = useState({
    time: 'all' as TimeRange,
    type: 'all' as ScanType,
    result: 'all' as ResultType
  });

  // --- FETCH DATA ---
  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) { setLoading(false); return; }

        try {
          const q = query(
            collection(db, 'users', user.uid, 'scans'), 
            orderBy('timestamp', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          const historyData: ScanHistory[] = [];
          querySnapshot.forEach((doc) => { 
            historyData.push({ id: doc.id, ...doc.data() } as ScanHistory); 
          });
          
          setHistory(historyData);
        } catch (error) { 
          console.error("Error fetching logs:", error); 
        } finally { 
          setLoading(false); 
        }
      };

      fetchHistory();
    }, [])
  );

  // --- NEW: SAFE OPEN LOGIC ---
  const handleOpenLink = async (url: string, prediction: string) => {
    // 1. SECURITY CHECK
    if (prediction !== 'Safe') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "SECURITY BLOCK 🛡️",
        `Access denied. This URL is flagged as ${prediction.toUpperCase()}.\n\nFor your safety, the system prevents opening malicious links directly.`,
        [{ text: "ACKNOWLEDGED", style: "cancel" }]
      );
      return;
    }

    // 2. Open if Safe
    try {
      const safeUrl = url.startsWith('http') ? url : `https://${url}`;
      const supported = await Linking.canOpenURL(safeUrl);
      
      if (supported) {
        await Linking.openURL(safeUrl);
      } else {
        Alert.alert("Error", "Cannot open this URL.");
      }
    } catch (err) {
      console.error("Link Error:", err);
      Alert.alert("Error", "Could not open browser.");
    }
  };

  // --- FILTER LOGIC ---
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (filters.result !== 'all' && item.prediction !== filters.result) return false;
      if (filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.time !== 'all') {
        const itemDate = item.timestamp ? new Date(item.timestamp.seconds * 1000) : new Date();
        const now = new Date();
        if (filters.time === 'today') {
           const isSameDay = itemDate.getDate() === now.getDate() && 
                             itemDate.getMonth() === now.getMonth() && 
                             itemDate.getFullYear() === now.getFullYear();
           if (!isSameDay) return false;
        } else if (filters.time === 'week') {
           const diffTime = Math.abs(now.getTime() - itemDate.getTime());
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
           if (diffDays > 7) return false;
        }
      }
      return true;
    });
  }, [history, filters]);

  const isFilterActive = filters.time !== 'all' || filters.type !== 'all' || filters.result !== 'all';

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: ScanHistory }) => {
    let statusColor = COLORS.accent;
    let iconName = "verified-user"; 
    let canOpen = true;

    if (item.prediction === 'Malicious') {
      statusColor = COLORS.danger;
      iconName = "gpp-bad";
      canOpen = false;
    } else if (item.prediction === 'Suspicious') {
      statusColor = COLORS.warning;
      iconName = "warning";
      canOpen = false;
    }

    const dateObj = item.timestamp ? new Date(item.timestamp.seconds * 1000) : new Date();
    const dateStr = `${dateObj.getMonth()+1}/${dateObj.getDate()} ${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

    return (
      <View style={[styles.logRow, { borderLeftColor: statusColor }]}>
        <View style={styles.iconBox}>
          <MaterialIcons name={iconName as any} size={24} color={statusColor} />
        </View>
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
             <Text style={styles.timestamp}>[{dateStr}]</Text>
             <Text style={styles.logType}>cmd: {item.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.urlText} numberOfLines={1}>{item.url}</Text>
          <View style={styles.logFooter}>
             <Text style={[styles.predictionText, { color: statusColor }]}>
                STATUS: {item.prediction.toUpperCase()}
             </Text>
             {item.score !== undefined && (
                <Text style={styles.scoreText}>TRUST: {item.score}/10</Text>
             )}
          </View>
        </View>
        
        {/* OPEN BUTTON (Dimmed if unsafe) */}
        <TouchableOpacity 
          onPress={() => handleOpenLink(item.url, item.prediction)} 
          style={[styles.linkBtn, !canOpen && { opacity: 0.3 }]}
        >
           <FontAwesome5 
             name={canOpen ? "external-link-alt" : "lock"} 
             size={14} 
             color={canOpen ? COLORS.muted : COLORS.danger} 
           />
        </TouchableOpacity>
      </View>
    );
  };

  const FilterSection = ({ title, options, selected, onSelect }: any) => (
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.chipContainer}>
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.chip,
              selected === opt && styles.chipSelected,
              title === "STATUS" && opt === "Malicious" && selected === opt && { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
              title === "STATUS" && opt === "Safe" && selected === opt && { backgroundColor: COLORS.accent, borderColor: COLORS.accent }
            ]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[
              styles.chipText,
              selected === opt && styles.chipTextSelected,
              title === "STATUS" && (opt === "Malicious" || opt === "Safe") && selected === opt && { color: '#000' }
            ]}>
              {opt.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      <View style={styles.terminalHeader}>
        <View>
          <Text style={styles.terminalTitle}>// SYSTEM_AUDIT_LOGS</Text>
          <Text style={styles.terminalSubtitle}>Authorized Access Only</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.filterBtn, isFilterActive && { borderColor: COLORS.accent, backgroundColor: 'rgba(0,255,157,0.1)' }]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFilter(true);
          }}
        >
          <Ionicons name="filter" size={20} color={isFilterActive ? COLORS.accent : COLORS.muted} />
          {isFilterActive && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 50 }} />
      ) : filteredHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="filter-list-off" size={50} color={COLORS.border} />
            <Text style={styles.emptyText}>NO RECORDS FOUND</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* FILTER MODAL */}
      <Modal visible={showFilter} animationType="slide" transparent={true} onRequestClose={() => setShowFilter(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.filterPanel}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>// CONFIGURE FILTERS</Text>
               <TouchableOpacity onPress={() => setShowFilter(false)}>
                 <Ionicons name="close" size={24} color="#fff" />
               </TouchableOpacity>
            </View>
            
            <ScrollView>
              <FilterSection 
                title="TIME RANGE" 
                options={['all', 'today', 'week']} 
                selected={filters.time}
                onSelect={(val: TimeRange) => setFilters({...filters, time: val})} 
              />
              
              <FilterSection 
                title="SCAN METHOD" 
                options={['all', 'QR Scan', 'Manual']} 
                selected={filters.type}
                onSelect={(val: ScanType) => setFilters({...filters, type: val})} 
              />
              
              <FilterSection 
                title="STATUS" 
                options={['all', 'Safe', 'Suspicious', 'Malicious']} 
                selected={filters.result}
                onSelect={(val: ResultType) => setFilters({...filters, result: val})} 
              />
            </ScrollView>

            <View style={styles.modalFooter}>
               <TouchableOpacity 
                  style={styles.resetBtn} 
                  onPress={() => {
                    setFilters({ time: 'all', type: 'all', result: 'all' });
                    setShowFilter(false);
                  }}
               >
                 <Text style={styles.resetText}>RESET ALL</Text>
               </TouchableOpacity>
               
               <TouchableOpacity 
                  style={styles.applyBtn} 
                  onPress={() => setShowFilter(false)}
               >
                 <Text style={styles.applyText}>APPLY CONFIG</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  terminalHeader: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20, 
    paddingTop: 45, 
    backgroundColor: COLORS.card, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  terminalTitle: { 
    color: COLORS.accent, fontSize: 16, fontWeight: 'bold', letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
  },
  terminalSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 4, letterSpacing: 1 },
  
  filterBtn: { 
    padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bg
  },
  activeDot: {
    position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent
  },

  list: { flex: 1, padding: 15 },
  
  logRow: { flexDirection: 'row', backgroundColor: '#1a1a1a', marginBottom: 12, borderRadius: 4, borderLeftWidth: 4, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  iconBox: { marginRight: 15 },
  logContent: { flex: 1 },
  logHeader: { flexDirection: 'row', marginBottom: 6 },
  timestamp: { color: COLORS.muted, fontSize: 10, marginRight: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logType: { color: '#888', fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  urlText: { color: '#fff', fontSize: 14, marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 10 },
  predictionText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  scoreText: { color: COLORS.muted, fontSize: 10, fontWeight: 'bold' },
  linkBtn: { padding: 10 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.7 },
  emptyText: { color: COLORS.muted, marginTop: 10, letterSpacing: 2, fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  filterPanel: { backgroundColor: COLORS.modalBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  
  filterGroup: { marginBottom: 25 },
  filterTitle: { color: COLORS.muted, fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { 
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, marginBottom: 10,
    backgroundColor: COLORS.bg
  },
  chipSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.activeFilter },
  chipText: { color: COLORS.muted, fontSize: 12, fontWeight: 'bold' },
  chipTextSelected: { color: '#fff' },

  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  resetBtn: { flex: 1, padding: 15, alignItems: 'center', marginRight: 10 },
  resetText: { color: COLORS.muted, fontWeight: 'bold' },
  applyBtn: { flex: 2, backgroundColor: COLORS.accent, borderRadius: 8, padding: 15, alignItems: 'center' },
  applyText: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});