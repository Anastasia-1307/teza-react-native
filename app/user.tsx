import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect } from 'react';
import UserDrawer from '../components/UserDrawer';

export default function UserPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('access_token');
      console.log('User page - checking auth, token exists:', token ? 'YES' : 'NO');
      if (!token) {
        console.log('User page - no token found, redirecting to login');
        router.replace('/login');
      } else {
        console.log('User page - token found, staying on user page');
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