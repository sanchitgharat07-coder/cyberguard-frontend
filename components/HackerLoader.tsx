import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export const HackerLoader = ({ targetUrl }: { targetUrl: string }) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const cleanUrl = targetUrl.replace('https://', '').replace('http://', '').split('/')[0];
    
    const sequence = [
      `> INITIALIZING PROTOCOL v2.0...`,
      `> TARGET: ${cleanUrl}`,
      `> ESTABLISHING SECURE HANDSHAKE...`,
      `> CHECKING SSL CERTIFICATES... [OK]`,
      `> QUERYING VIRUSTOTAL DB...`,
      `> PERFORMING WHOIS LOOKUP...`,
      `> ANALYZING THREAT VECTORS...`,
      `> DECRYPTING REPORT...`,
      `> ACCESS GRANTED.`
    ];

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < sequence.length) {
        setLogs(prev => [...prev, sequence[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 250); // Add a new line every 250ms

    return () => clearInterval(interval);
  }, [targetUrl]);

  return (
    <View style={styles.terminalWindow}>
      <View style={styles.headerBar}>
        <View style={styles.dotRed} />
        <View style={styles.dotYellow} />
        <View style={styles.dotGreen} />
        <Text style={styles.headerTitle}>root@cyberguard:~</Text>
      </View>
      <View style={styles.consoleContent}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
        {/* The Blinking Cursor */}
        <Text style={styles.cursor}>_</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  terminalWindow: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    minHeight: 300,
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  headerBar: {
    backgroundColor: '#1a1a1a',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff5f56', marginRight: 6 },
  dotYellow: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffbd2e', marginRight: 6 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#27c93f', marginRight: 10 },
  headerTitle: {
    color: '#888',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 5,
  },
  consoleContent: {
    padding: 15,
  },
  logText: {
    color: '#00ff9d', // Classic Hacker Green
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  cursor: {
    color: '#00ff9d',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  }
});