import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import AdminDrawer from '../components/AdminDrawer';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return <AdminDrawer />;
}

AdminPage.screenOptions = {
  headerBackVisible: false,
  headerLeft: () => null,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  logoutContainer: {
    paddingBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});