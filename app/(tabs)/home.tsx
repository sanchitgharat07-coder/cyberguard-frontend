import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Modal, 
  Platform,
  StatusBar,
  ScrollView,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { useFocusEffect, router } from 'expo-router'; 
import * as Haptics from 'expo-haptics';

import { HackerLoader } from '../../components/HackerLoader';
import { ResultModal, ForensicsData } from '../../components/ResultModal';

const COLORS = {
  bg: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  accent: '#00ff9d',
  danger: '#ff4b4b',
  warning: '#f0ad4e',
  muted: '#888888',
  border: '#333333'
};

const API_URL = 'http://192.168.31.16:5000/predict'; 

export default function HomeScreen() {
  const [manualUrl, setManualUrl] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  const [scanResult, setScanResult] = useState<{
    prediction: 'Safe' | 'Malicious' | 'Suspicious';
    url: string;
    source: string;
    score?: number;
    forensics?: ForensicsData;
  } | null>(null);

  const [stats, setStats] = useState({ safe: 0, threats: 0, total: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('OPERATIVE'); 

  // --- FETCH DASHBOARD ---
  const fetchDashboardData = async () => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists() && userDocSnap.data().username) {
        setUsername(userDocSnap.data().username.toUpperCase());
      }

      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'scans'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let safeCount = 0;
      let threatCount = 0;
      docs.forEach((scan: any) => {
        if (scan.prediction === 'Safe') safeCount++;
        else threatCount++;
      });

      setStats({ safe: safeCount, threats: threatCount, total: docs.length });
      setRecentScans(docs.slice(0, 3));
    } catch (error) {
      console.log("Error fetching dashboard:", error);
    }
  };

  useFocusEffect(
    useCallback(() => { fetchDashboardData(); }, [])
  );

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  // --- SCAN LOGIC ---
  const handleCheck = async (urlToCheck: string, type: 'Manual' | 'QR Scan' = 'QR Scan') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsScanning(false);
    setIsLoading(true);
    setLoadingUrl(urlToCheck);

    try {
      const [_, response] = await Promise.all([
        new Promise(resolve => setTimeout(resolve, 3000)), 
        axios.post(API_URL, { url: urlToCheck })
      ]);

      const { prediction, source, score, forensics } = response.data;
      
      if (prediction === 'Safe') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      if (auth.currentUser) {
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'scans'), {
          url: urlToCheck,
          prediction,
          score: score || 0,
          source,
          type,
          timestamp: serverTimestamp(),
        });
      }

      const newScan = {
        url: urlToCheck,
        prediction,
        score: score || 0,
        timestamp: { seconds: Date.now() / 1000 }, 
      };

      setRecentScans(prev => [newScan, ...prev].slice(0, 3)); 
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        safe: prediction === 'Safe' ? prev.safe + 1 : prev.safe,
        threats: prediction !== 'Safe' ? prev.threats + 1 : prev.threats
      }));

      setScanResult({ prediction, url: urlToCheck, source, score, forensics });
      setIsLoading(false);
      setTimeout(() => setModalVisible(true), 100);

    } catch (error) {
      console.error("Scan Error:", error);
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Connection Failed', 'Could not reach the security server.');
    } finally {
      setManualUrl('');
      setLoadingUrl('');
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!isLoading) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        handleCheck(data, 'QR Scan');
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Camera access is required.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>GRANT ACCESS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent}/>}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>WELCOME AGENT,</Text>
            <Text style={styles.username}>{username}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>SYSTEM ACTIVE</Text>
            </View>
            <TouchableOpacity 
              style={styles.newsButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/news'); 
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.accent} />
              <View style={styles.newsDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- MAIN ACTION AREA (REDESIGNED) --- */}
        <View style={styles.actionCard}>
          <Text style={styles.sectionTitle}>// QUICK SCANNER</Text>
          
          {/* BIG QR BUTTON */}
          <TouchableOpacity 
            style={styles.bigScanBtn} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsScanning(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.scanIconCircle}>
                <Ionicons name="qr-code-outline" size={50} color="#000" />
            </View>
            <Text style={styles.bigScanText}>SCAN QR CODE</Text>
            <Text style={styles.bigScanSubText}>Detect Scams Instantly</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
             <View style={styles.line} />
             <Text style={styles.dividerText}>OR CHECK URL</Text>
             <View style={styles.line} />
          </View>

          {/* MANUAL INPUT SECTION (SECONDARY) */}
          <View style={styles.manualContainer}>
             <View style={styles.inputWrapper}>
                <FontAwesome5 name="link" size={14} color={COLORS.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Paste URL to analyze..."
                  placeholderTextColor={COLORS.muted}
                  value={manualUrl}
                  onChangeText={setManualUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
             </View>
             <TouchableOpacity 
                style={styles.analyzeBtn} 
                onPress={() => handleCheck(manualUrl, 'Manual')}
                disabled={!manualUrl}
             >
                <FontAwesome5 name="arrow-right" size={16} color="#000" />
             </TouchableOpacity>
          </View>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: COLORS.accent }]}>
            <Text style={[styles.statNumber, { color: COLORS.accent }]}>{stats.safe}</Text>
            <Text style={styles.statLabel}>SECURE SCANS</Text>
          </View>
          <View style={[styles.statCard, { borderColor: COLORS.danger }]}>
            <Text style={[styles.statNumber, { color: COLORS.danger }]}>{stats.threats}</Text>
            <Text style={styles.statLabel}>THREATS BLOCKED</Text>
          </View>
        </View>

        {/* RECENT LIST */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>// RECENT INTERCEPTS</Text>
          {recentScans.length === 0 ? (
            <Text style={styles.emptyText}>NO DATA LOGGED.</Text>
          ) : (
            recentScans.map((scan, index) => (
              <View key={index} style={styles.recentItem}>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentUrl} numberOfLines={1}>{scan.url}</Text>
                  <Text style={styles.recentDate}>
                    {scan.timestamp ? new Date(scan.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}
                  </Text>
                </View>
                <View style={[
                  styles.recentBadge, 
                  { backgroundColor: scan.prediction === 'Safe' ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 75, 75, 0.1)' }
                ]}>
                  <Text style={{ 
                    color: scan.prediction === 'Safe' ? COLORS.accent : COLORS.danger, 
                    fontWeight: 'bold', 
                    fontSize: 10 
                  }}>
                    {scan.prediction.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* CAMERA MODAL */}
      <Modal visible={isScanning} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView 
            style={StyleSheet.absoluteFillObject} 
            facing={facing} 
            onBarcodeScanned={handleBarCodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.overlayText}>ALIGN QR CODE WITHIN FRAME</Text>
            <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.closeCameraBtn}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LOADER & RESULT MODALS */}
      <Modal visible={isLoading} transparent={true} animationType="none">
        <View style={styles.loaderOverlay}>
            <View style={styles.loaderBox}>
                <HackerLoader targetUrl={loadingUrl} />
            </View>
        </View>
      </Modal>

      {scanResult && (
        <ResultModal 
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          prediction={scanResult.prediction}
          url={scanResult.url}
          source={scanResult.source}
          score={scanResult.score}
          forensics={scanResult.forensics}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  greeting: { color: COLORS.muted, fontSize: 12, letterSpacing: 1 },
  username: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 255, 157, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accent },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, marginRight: 6 },
  statusText: { color: COLORS.accent, fontSize: 10, fontWeight: 'bold' },

  newsButton: { marginLeft: 10, padding: 8, backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  newsDot: { position: 'absolute', top: 5, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger },

  // --- REDESIGNED ACTION AREA ---
  actionCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 25 },
  sectionTitle: { color: COLORS.muted, fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 20 },

  // BIG SCAN BUTTON
  bigScanBtn: { 
    backgroundColor: COLORS.text, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 25,
    marginBottom: 20,
    shadowColor: COLORS.muted,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  scanIconCircle: {
    width: 70, height: 70, borderRadius: 35, 
    backgroundColor: 'rgba(0,0,0,0.1)', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 10 
  },
  bigScanText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  bigScanSubText: { color: '#333', fontSize: 12, marginTop: 4, fontWeight: '600' },

  // DIVIDER
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.muted, fontSize: 10, marginHorizontal: 10, letterSpacing: 1 },

  // MANUAL INPUT ROW
  manualContainer: { flexDirection: 'row', alignItems: 'center' },
  inputWrapper: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#121212', borderWidth: 1, borderColor: COLORS.border, 
    borderRadius: 8, paddingHorizontal: 15, height: 50, marginRight: 10 
  },
  input: { flex: 1, color: COLORS.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  analyzeBtn: { 
    width: 50, height: 50, backgroundColor: COLORS.text, 
    borderRadius: 8, justifyContent: 'center', alignItems: 'center' 
  },

  // STATS
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { flex: 0.48, backgroundColor: COLORS.card, padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: COLORS.muted, fontSize: 10, marginTop: 5, letterSpacing: 0.5 },

  // RECENT LIST
  recentSection: { marginBottom: 20 },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: COLORS.border },
  recentInfo: { flex: 1, marginRight: 10 },
  recentUrl: { color: COLORS.text, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 4 },
  recentDate: { color: COLORS.muted, fontSize: 10 },
  recentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  
  // MODALS
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  text: { color: COLORS.text, marginBottom: 20 },
  btn: { backgroundColor: COLORS.accent, padding: 15, borderRadius: 8 },
  btnText: { fontWeight: 'bold' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: COLORS.accent, backgroundColor: 'transparent' },
  overlayText: { color: '#fff', marginTop: 20, letterSpacing: 1 },
  closeCameraBtn: { position: 'absolute', top: 50, right: 20, padding: 10 },
  loaderOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  loaderBox: { width: '90%' },
});