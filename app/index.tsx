import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
 
export default function IndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/home');
    }, 100);
    
    return () => clearTimeout(timeout);
  }, []);
  
  return <View />;
}