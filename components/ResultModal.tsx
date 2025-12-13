import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

// Define the shape of the forensics data
export interface ForensicsData {
  domain_age_days: number | null;
  registrar: string;
  ssl_issuer: string;
  is_suspicious_age: boolean;
  is_suspicious_issuer: boolean;
  abuse_email?: string; // Added for reporting
}

interface ResultModalProps {
  isVisible: boolean;
  onClose: () => void;
  prediction: "Safe" | "Malicious" | "Suspicious";
  url: string;
  source?: string;
  score?: number; // Added score prop
  forensics?: ForensicsData; 
}

export const ResultModal = ({
  isVisible,
  onClose,
  prediction,
  url,
  source,
  score,
  forensics,
}: ResultModalProps) => {
  // Dynamic colors/icons based on prediction
  const getStatusColor = () => {
    if (prediction === "Safe") return "#5cb85c";
    if (prediction === "Suspicious") return "#f0ad4e";
    return "#d9534f";
  };

  const getStatusIcon = () => {
    if (prediction === "Safe") return "checkmark-circle";
    if (prediction === "Suspicious") return "warning";
    return "alert-circle";
  };

  // --- REPORTING ACTIONS ---
  const handleReportToGoogle = () => {
    if (!url) return;
    const googleUrl = `https://safebrowsing.google.com/safebrowsing/report_phish/?url=${encodeURIComponent(url)}`;
    Linking.openURL(googleUrl);
  };

  const handleReportToRegistrar = () => {
    const email = forensics?.abuse_email;
    if (!email) {
      Alert.alert("No Email Found", "Could not find an abuse contact for this domain.");
      return;
    }

    const subject = `Abuse Report: Malicious Website Detected - ${url}`;
    const body = `
      To ${forensics.registrar || "Domain Registrar"},

      I am reporting a malicious website hosted on your network.
      
      URL: ${url}
      Detection Source: CyberGuard AI
      Reason: Phishing / Malicious Content Detected
      
      Please investigate and suspend this domain immediately.
    `;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoUrl);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* 1. Header Section */}
            <View
              style={[styles.header, { backgroundColor: getStatusColor() }]}
            >
              <Ionicons name={getStatusIcon()} size={60} color="#fff" />
              <Text style={styles.resultText}>{prediction.toUpperCase()}</Text>
              
              {/* Show Score if available */}
              {score !== undefined && (
                 <Text style={styles.scoreText}>Trust Score: {score}/10</Text>
              )}

              <Text style={styles.sourceText}>
                Detected by: {source || "Unknown"}
              </Text>
            </View>

            {/* 2. URL Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Scanned URL:</Text>
              <Text style={styles.urlText}>{url}</Text>
            </View>

            {/* 3. Advanced Forensics Section */}
            {forensics && (
              <View style={styles.forensicsContainer}>
                <Text style={styles.sectionTitle}>🛡️ Domain Intelligence</Text>

                {/* Domain Age */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Domain Age:</Text>
                  <Text
                    style={[
                      styles.rowValue,
                      forensics.is_suspicious_age && styles.warningText,
                    ]}
                  >
                    {forensics.domain_age_days
                      ? `${forensics.domain_age_days} Days`
                      : "Unknown"}
                    {forensics.is_suspicious_age && " (New!)"}
                  </Text>
                </View>

                {/* Registrar */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Registrar:</Text>
                  <Text style={styles.rowValue}>
                    {forensics.registrar || "Hidden"}
                  </Text>
                </View>

                {/* SSL Issuer */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>SSL Issuer:</Text>
                  <Text
                    style={[
                      styles.rowValue,
                      forensics.is_suspicious_issuer && styles.warningText,
                    ]}
                  >
                    {forensics.ssl_issuer || "None"}
                  </Text>
                </View>
              </View>
            )}

            {/* 4. REPORT THREAT SECTION (Only for Non-Safe sites) */}
            {(prediction === 'Malicious' || prediction === 'Suspicious') && (
              <View style={styles.reportContainer}>
                <Text style={styles.reportTitle}>⚠️ ACTION REQUIRED</Text>
                
                <View style={styles.reportButtonsRow}>
                  {/* Google Button */}
                  <TouchableOpacity 
                    onPress={handleReportToGoogle}
                    style={[styles.reportButton, { borderColor: '#d9534f' }]}
                  >
                    <MaterialIcons name="security" size={24} color="#d9534f" />
                    <Text style={[styles.reportButtonText, { color: '#d9534f' }]}>
                      Report to Google
                    </Text>
                  </TouchableOpacity>

                  {/* Registrar Button (Only if email exists) */}
                  {forensics?.abuse_email && (
                    <TouchableOpacity 
                      onPress={handleReportToRegistrar}
                      style={[styles.reportButton, { borderColor: '#f0ad4e' }]}
                    >
                      <MaterialIcons name="email" size={24} color="#f0ad4e" />
                      <Text style={[styles.reportButtonText, { color: '#f0ad4e' }]}>
                        Email Registrar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 5. Close Button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: getStatusColor() },
              ]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close Report</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    maxHeight: "85%",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    padding: 30,
  },
  resultText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
    letterSpacing: 1,
  },
  scoreText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 5,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sourceText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 5,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: {
    fontSize: 14,
    color: "gray",
    marginBottom: 5,
  },
  urlText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  forensicsContainer: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2c3e50",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  rowValue: {
    fontSize: 14,
    color: '#333',
    maxWidth: '60%',
    textAlign: 'right',
  },
  warningText: {
    color: "#d9534f",
    fontWeight: "bold",
  },
  // Report Styles
  reportContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 15,
    textAlign: 'center',
  },
  reportButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reportButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  reportButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  closeButton: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});