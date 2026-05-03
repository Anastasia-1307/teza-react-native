import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
// @ts-ignore - NetworkConfig is JS file
import { NetworkConfig } from '../utils/NetworkConfig';

interface UserLog {
  id: string;
  user_id: string;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  details: string | null;
  created_at: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const baseUrl = await NetworkConfig.getBaseUrl();
      const token = await getToken();
      console.log('AdminLogs - Base URL:', baseUrl);
      console.log('AdminLogs - Using token:', token ? 'YES' : 'NO');
      
      const response = await fetch(`${baseUrl}/user-logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        console.error('Failed to fetch logs:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      console.log('AdminLogs - Token length:', token ? token.length : 'null');
      console.log('AdminLogs - Token first 20 chars:', token ? token.substring(0, 20) + '...' : 'null');
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
        return '#4CAF50';
      case 'logout':
        return '#FF9800';
      case 'login_failed':
      case 'bio_login_failed':
        return '#F44336';
      case 'password_created':
        return '#2196F3';
      case 'password_updated':
        return '#9C27B0';
      case 'password_deleted':
        return '#795548';
      case 'ip_blocked':
        return '#FF5722';
      default:
        return '#607D8B';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Se încarcă logurile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ultimele 100 loguri</Text>
      <ScrollView
        style={styles.scrollView}
      >
        {logs.length === 0 ? (
          <Text style={styles.noLogsText}>Nu există loguri disponibile</Text>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logHeader}>
                <Text style={[styles.actionText, { color: getActionColor(log.action) }]}>
                  {log.action.toUpperCase()}
                </Text>
                <Text style={styles.dateText}>{formatDate(log.created_at)}</Text>
              </View>
              {log.user_id && (
                <Text style={styles.detailText}>User ID: {log.user_id}</Text>
              )}
              {log.ip_address && (
                <Text style={styles.detailText}>IP: {log.ip_address}</Text>
              )}
              {log.details && (
                <Text style={styles.detailText}>Detalii: {log.details}</Text>
              )}
              {log.user_agent && (
                <Text style={styles.userAgentText} numberOfLines={2}>
                  {log.user_agent}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  logItem: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  detailText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  userAgentText: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  noLogsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});