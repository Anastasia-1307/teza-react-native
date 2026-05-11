import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from 'expo-local-authentication';
import { Link, useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BiometricStorage } from '../utils/BiometricStorage';
import { NetworkConfig } from '../utils/NetworkConfig';



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#e1c697ff',
  },
  form: {
    backgroundColor: '#2ec4b6',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '600',
    color: '#fff'
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 10
  },
  inputWithIcon: {
    backgroundColor: '#fff',
    padding: 10,
    paddingRight: 40,
    borderRadius: 8
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }]
  },
  errorText: {
    color: 'red'
  },
  buttonContainer: {
    marginTop: 20
  },
  button: {
    backgroundColor: "#8b5e3c",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 30,
    alignItems: 'center'
  },
  linkText: {
    color: '#000'
  },
  bioButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bioButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  lockoutWarning: {
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  lockoutText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  attemptsCounter: {
    backgroundColor: '#ffa726',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  attemptsText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  }
});

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [hidePassword, setHidePassword] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showBioButton, setShowBioButton] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);



    useEffect(() => {
        console.log('useEffect triggered - checking biometric availability...');
        
        checkBiometricAvailability();
    }, []); // Rulăm doar la încărcare

    
    useEffect(() => {
    
        if (username.length > 0) {
            console.log('Username changed:', username);
        }
  
    }, [username]);

    const checkBiometricAvailability = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const biometricUsers = await BiometricStorage.getBiometricUsersList();
            console.log('Raw biometricUsers result:', biometricUsers, 'Type:', typeof biometricUsers, 'Length:', biometricUsers.length);
            const hasBiometricUsers = biometricUsers.length > 0;
            // Verificăm dacă există date biometrice valide pentru oricare utilizator
            let hasValidBiometricData = false;
            let hasValidServerToken = false;
            if (hasBiometricUsers) {
                // Verificăm fiecare utilizator din listă
                for (const user of biometricUsers) {
                    try {
                        console.log(`Checking user: ${user}`);
                        const bioStatus = await BiometricStorage.getBiometricStatus(user);
                        console.log(`Status for ${user}:`, bioStatus);
                        if (bioStatus.enabled) {
                            hasValidBiometricData = true;
                            console.log(`Found valid biometric data for user: ${user}`);
                            // Verificăm și starea token-ului persistent din baza de date
                            try {
                                const baseUrl = await NetworkConfig.getBaseUrl();
                                const response = await fetch(`${baseUrl}/auth/biometric/status/${user}`, {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    }
                                });
                                
                                console.log(`🌐 Server response status for ${user}:`, response.status);
                                console.log(`🌐 Server response headers:`, Object.fromEntries(response.headers.entries()));
                                
                                // Check if response is actually JSON before parsing
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
                console.log(`🌐 Server response data for ${user}:`, data);
            } else {
                // If not JSON, create a generic error structure
                const text = await response.text();
                data = { detail: `Server error: ${response.status}` };
                console.error('Non-JSON response from server:', text);}
            if (data.has_persistent_token === true) {
            hasValidServerToken = true;
            console.log(`✅ Found user ${user} with valid server token!`);
            break; // Break only if we found both local data AND server token
            } else if (data.reason === 'admin_user_not_allowed') {
            console.log(`❌ User ${user} is admin - biometric auth not allowed, continuing search...`);
            } else { console.log(`❌ User ${user} has local biometric data but no valid server token, continuing search...`);}
            } catch (serverError: any) {
            console.error(`❌ Error checking server status for ${user}:`, serverError);
            console.error(`❌ Server error details:`, {
            message: serverError.message,
            status: serverError.status,
            stack: serverError.stack});
            }} } catch (error) { console.error(`Error checking user ${user}:`, error);}}}
            
            console.log('🔍 DETAILED Biometric availability check:', { 
                hasHardware, 
                isEnrolled,
                biometricUsersCount: biometricUsers.length,
                biometricUsers: biometricUsers,
                hasValidBiometricData,
                hasValidServerToken,
                finalCondition: hasHardware && isEnrolled && hasValidBiometricData && hasValidServerToken,
                step1_hardware: hasHardware ? '✅' : '❌',
                step2_enrolled: isEnrolled ? '✅' : '❌', 
                step3_local_data: hasValidBiometricData ? '✅' : '❌',
                step4_server_token: hasValidServerToken ? '✅' : '❌'
            });
            
         
            if (hasHardware && isEnrolled && hasValidBiometricData && hasValidServerToken) {
                setShowBioButton(true);
                console.log('Biometric button should show - system ready');
            } else {
                setShowBioButton(false);
                console.log('Biometric button hidden - conditions not met', {
                    hardware: hasHardware,
                    enrolled: isEnrolled,
                    hasBiometricUsers: hasBiometricUsers,
                    hasValidBiometricData,
                    hasValidServerToken
                });
            }
        } catch (error) {
            console.error('Error checking biometric availability:', error);
            setShowBioButton(false);
        }
    };

   const handleBiometricAuth = async () => {
    try {
        // Obține lista de utilizatori cu biometric activat
        const biometricUsers = await BiometricStorage.getBiometricUsersList();
        
        if (biometricUsers.length === 0) {
            setError('Nu există utilizatori cu autentificare biometrică configurată.');
            return;
        }
        // Găsește primul utilizator care nu este admin
        let targetUsername = null;
        const baseUrl = await NetworkConfig.getBaseUrl();
        
        for (const user of biometricUsers) {
            try {
                const response = await fetch(`${baseUrl}/auth/biometric/status/${user}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.reason !== 'admin_user_not_allowed') {
                        targetUsername = user;
                        console.log('Found valid user for biometric auth:', user);
                        break;
                    } }
            } catch (error) {
                console.error('Error checking user role for biometric auth:', error);
            }
        }
        
        if (!targetUsername) {
            setError('Nu există utilizatori cu biometrică validă pentru autentificare.');
            return;
        }
        
        console.log('Attempting biometric auth for user:', targetUsername);

        // Autentificare biometrică
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: `Autentificare biometrică`,
            cancelLabel: 'Anulează',
            fallbackLabel: 'Folosește parola',
        });

        if (result.success) {
            console.log('Biometric auth successful');
            await performBiometricLogin(targetUsername);
        }

    } catch (error: any) {
        console.error('Biometric auth error:', error);
        if (error.message && error.message.includes('Autentificarea biometrică este necesară')) {
            setError('Datele biometrice trebuie reconfigurate. Te rugăm să te autentifici cu parola.');
        } else {
            setError('Autentificarea biometrică a eșuat.');
        }
    }
};


const performBiometricLogin = async (targetUsername: string) => {
    setIsLoading(true);
    setError("");
    try {
        // Verificăm statusul biometric
        const bioStatus = await BiometricStorage.getBiometricStatus(targetUsername);
        if (!bioStatus.enabled) {
            setError('Autentificarea biometrică nu este activată pentru acest utilizator.');
            return;
        }
        
        // Verificăm dacă utilizatorul este admin (biometric auth doar pentru useri obișnuiți)
        try {
            const baseUrl = await NetworkConfig.getBaseUrl();
            const response = await fetch(`${baseUrl}/auth/biometric/status/${targetUsername}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.reason === 'admin_user_not_allowed') {
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking user role for biometric auth:', error);
        }
        console.log('Performing biometric login...');
        // Decriptează parola cu cheia AES biometrică
        let password: string;
        try {
            password = await BiometricStorage.decryptPasswordWithBiometricKey(targetUsername);
        } catch (decryptError: any) {
            console.error('Decrypt error:', decryptError);
            if (decryptError.message && (decryptError.message.includes('Autentificarea biometrică este necesară') || 
            decryptError.message.includes('Biometric key not found'))) {
            setError('Datele biometrice trebuie reconfigurate. Te rugăm să te autentifici cu parola.');
                // Ștergem datele biometrice vechi pentru a forța reconfigurarea
                await BiometricStorage.deleteBiometricData(targetUsername);
            } else {
                setError('Nu s-a putut decripta parola. Loghează-te cu parola.'); }
            return;
        }
        if (!password) {
            setError('Nu s-a putut decripta parola. Loghează-te cu parola.');
            return;
        }
        const loginData = { username: targetUsername, password: password, grant_type: "password"};
        const baseUrl = await NetworkConfig.getBaseUrl();
        // Folosim noul endpoint pentru autentificare directă biometrică
        const response = await fetch(`${baseUrl}/auth/biometric/direct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(loginData),
         });

        // Check if response is actually JSON before parsing
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // If not JSON, create a generic error structure
                const text = await response.text();
                data = { detail: `Server error: ${response.status}` };
                console.error('Non-JSON response from server:', text);   }
        if (response.ok) {
            await SecureStore.setItemAsync('access_token', data.access_token);
            await SecureStore.setItemAsync('refresh_token', data.refresh_token);
            
            // Stochează persistent refresh token pentru biometric
            if (data.persistent_refresh_token) {
                await SecureStore.setItemAsync('persistent_refresh_token', data.persistent_refresh_token);
            }
            await SecureStore.setItemAsync('last_logged_user', bioStatus.username);
            // Use server-provided redirect information
            const redirectPath = data.redirect_to || '/user';
            console.log('Biometric auth redirecting to:', redirectPath, 'User role:', data.user_role);
            console.log('Full server response:', data);
            
            // Verify tokens are stored before redirect
            const accessToken = await SecureStore.getItemAsync('access_token');
            const refreshToken = await SecureStore.getItemAsync('refresh_token');
            console.log('Tokens stored - Access:', accessToken ? 'YES' : 'NO', 'Refresh:', refreshToken ? 'YES' : 'NO');
            router.replace(redirectPath);
        } else {
            setError(data.detail || "Eroare la autentificare");
        }

    } catch (error) {
        console.error('Biometric login error:', error);
        setError("Eroare conexiune.");
    } finally {
        setIsLoading(false);
    }
};
    const handleLogin = async () => {
        setError("");
        
                // Validation
        if(username.trim() === "" || password.trim() === "" ) {
            setError("Toate câmpurile sunt obligatorii.");
            return;
        }
        setIsLoading(true);

        try {
            // Create JSON data for custom LoginForm
            const loginData = {
                username: username.trim(),
                password: password.trim(),
                grant_type: "password",
                
            };

            const baseUrl = await NetworkConfig.getBaseUrl();
            // Use fetch API
            const response = await fetch(`${baseUrl}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });
            // Check if response is actually JSON before parsing
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // If not JSON, create a generic error structure
                const text = await response.text();
                data = { detail: `Server error: ${response.status}` };
                console.error('Non-JSON response from server:', text);
            }
            if (response.ok) {
                // Reset failed attempts on successful login
                setFailedAttempts(0);
                // Store tokens using SecureStore for maximum security
                await SecureStore.setItemAsync('access_token', data.access_token);
                await SecureStore.setItemAsync('refresh_token', data.refresh_token);
                const trimmedUsername = username.trim();
                await SecureStore.setItemAsync('last_logged_user', trimmedUsername);

                // Auto-setup biometric data if user hasn't explicitly disabled it
                try {
                    const hasDisabledBio = await BiometricStorage.hasUserDisabledBiometric(trimmedUsername);
                    if (!hasDisabledBio) {
                        await BiometricStorage.saveBiometricData(trimmedUsername, password.trim());
                        console.log('Biometric data auto-saved for user:', trimmedUsername);
                    } else {
                        console.log('User previously disabled biometric, skipping auto-setup');
                    }
                } catch (bioError) {
                    console.error('Error auto-saving biometric data:', bioError);
                }

                // Use server-provided redirect information
                try {
                    const redirectPath = data.redirect_to || '/user';
                    const userRole = data.user_role || 'unknown';
                    console.log('Password auth redirecting to:', redirectPath, 'User role:', userRole);
                    
                    // Navigate based on server-provided redirect path
                    router.replace(redirectPath);
                } catch (redirectError) {
                    console.error('Redirect error:', redirectError);
                    // Fallback to user page if redirect fails
                    router.replace('/user');
                }
            } else {
                // Increment failed attempts on failed login
                const newFailedAttempts = failedAttempts + 1;
                setFailedAttempts(newFailedAttempts);
                
                // Handle server errors - convert object to string
                const errorMessage = typeof data.detail === 'string' 
                    ? data.detail 
                    : JSON.stringify(data.detail) || "A apărut o eroare la autentificare.";
                
                setError(errorMessage);
            }
        } catch (error) {
            console.error('Login error:', error);
            setError("Nu s-a putut conecta la server. Verificați conexiunea la internet.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}> 
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 40, paddingTop: 40 }}>
<View style={styles.form}>
<Text style={styles.title}>Autentificare</Text>
<Text style={styles.label}>Nume de utilizator</Text>
<TextInput style={styles.input} autoComplete="off" placeholder="Nume de utilizator" value={username} onChangeText={setUsername}/>
<Text style={styles.label}>Parola</Text>
<View style={styles.inputContainer}>
<TextInput 
  style={styles.inputWithIcon} 
  autoComplete="off"
  placeholder="Parola" 
  secureTextEntry={hidePassword} 
  value={password} 
  onChangeText={setPassword}
/>
<TouchableOpacity style={styles.eyeIcon} onPress={() => setHidePassword(!hidePassword)}>
  <Ionicons
    name={hidePassword ? "eye-off" : "eye"}
    size={24}
    color="gray"
  />
</TouchableOpacity>
</View>
{error ? <Text style={styles.errorText}>{error}</Text> : null}


<View style={styles.buttonContainer}>
<TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
    <Text style={styles.buttonText}>{isLoading ? "Se încarcă..." : "Autentificare"}</Text>
</TouchableOpacity>
</View>
<View style={styles.linkContainer}>
  <Link href="/register">
    <Text style={styles.linkText}>Nu ai cont? Înregistrează-te</Text>
  </Link>
</View>

{showBioButton && (
  <View style={{ alignItems: 'center', marginTop: 20 }}>
    <TouchableOpacity style={styles.bioButton} onPress={handleBiometricAuth} disabled={isLoading}>
      <Ionicons name="finger-print" size={20} color="#fff" />
      <Text style={styles.bioButtonText}>Autentificare biometrică</Text>
    </TouchableOpacity>
  </View>
)}

</View>
        </ScrollView>
        
    </KeyboardAvoidingView>
    )
}
