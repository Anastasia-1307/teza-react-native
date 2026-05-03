import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect } from 'react';
import UserDrawer from '../components/UserDrawer';

export default function UserPage() {
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

  return <UserDrawer />;
}

UserPage.screenOptions = {
  headerBackVisible: false,
  headerLeft: () => null,
};