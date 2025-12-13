import { Text, View, StyleSheet, Button, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7; 

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const [isScanned, setIsScanned] = useState(false);
  
  // --- NEW: Camera Reset Key ---
  // This helps us force the camera to "refresh" every time we visit the screen
  const [cameraKey, setCameraKey] = useState(0);

  useFocusEffect(
    React.useCallback(() => { 
      setIsScanned(false);
      // Incrementing this key forces React to destroy and recreate the Camera component
      // This makes the camera "forget" the last scan so it can scan it again immediately.
      setCameraKey(prev => prev + 1);
    }, [])
  );

  useEffect(() => { requestPermission(); }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (isScanned) return;
    setIsScanned(true);

    router.replace({ 
      pathname: '/(tabs)/home', 
      params: { scannedUrl: data } 
    });
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>We need camera permission</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- ADD THE KEY PROP HERE --- */}
      <CameraView
        key={cameraKey} 
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.focusedContainer}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
            <Text style={styles.instructionText}>Place QR Code in the frame</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { marginBottom: 10, fontSize: 16 },
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  middleRow: { flexDirection: 'row', height: SCAN_AREA_SIZE },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: 20 },
  focusedContainer: { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#00FF00', borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  instructionText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});