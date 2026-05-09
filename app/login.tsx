import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from 'expo-local-authentication';
import { Link, useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BiometricStorage } from '../utils/BiometricStorage';
import { Logger } from '../utils/Logger';
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
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
    const [lastAttemptTime, setLastAttemptTime] = useState<number | null>(null);



    useEffect(() => {
        console.log('useEffect triggered - checking biometric availability...');
        
        checkBiometricAvailability();
    }, []); // Rulăm doar la încărcare

    // Calculează delay-ul în funcție de numărul de încercări eșuate
    const getDelayForFailedAttempts = (attempts: number): number => {
        if (attempts <= 5) return 0; // Fără pauză pentru primele 5 încercări
        if (attempts <= 10) return 10000; // 10 secunde după 5 încercări eșuate
        if (attempts <= 15) return 30000; // 30 secunde după 10 încercări eșuate
        if (attempts <= 20) return 120000; // 2 minute după 15 încercări eșuate
        if (attempts <= 25) return 300000; // 5 minute după 20 încercări eșuate
        if (attempts <= 30) return 900000; // 15 minute după 25 încercări eșuate
        return Infinity; // Blocare cont permanentă după 30+ încercări
    };

    // Verifică dacă utilizatorul este blocat și actualizează timer-ul
    useEffect(() => {
        if (lastAttemptTime && failedAttempts > 0) {
            const delay = getDelayForFailedAttempts(failedAttempts);
            if (delay === Infinity) {
                setIsBlocked(true);
                setBlockTimeRemaining(Infinity);
                return;
            }

            const elapsed = Date.now() - lastAttemptTime;
            const remaining = Math.max(0, delay - elapsed);
            if (remaining > 0) {
                setIsBlocked(true);
                setBlockTimeRemaining(remaining);
                const timer = setInterval(() => {
                    const newElapsed = Date.now() - lastAttemptTime;
                    const newRemaining = Math.max(0, delay - newElapsed);
                    
                    if (newRemaining === 0) {
                        setIsBlocked(false);
                        setBlockTimeRemaining(0);
                        clearInterval(timer);
                    } else {
                        setBlockTimeRemaining(newRemaining);
                    }
                }, 1000);

                return () => clearInterval(timer);
            } else {
                setIsBlocked(false);
                setBlockTimeRemaining(0);
            }
        }
    }, [failedAttempts, lastAttemptTime]);

    // Formatează timpul rămas în format citibil
    const formatTimeRemaining = (ms: number): string => {
        if (ms === Infinity) return 'Cont blocat permanent';
        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) return `${seconds} secunde`;
        const minutes = Math.ceil(seconds / 60);
        if (minutes < 60) return `${minutes} minute`;
        const hours = Math.ceil(minutes / 60);
        return `${hours} ore`;
    };

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
                                const response = await fetch(`${baseUrl}/auth/biometric/status/${user}`);
                                const data = await response.json();
                                if (data.biometric_available) {
                                    hasValidServerToken = true;
                                    console.log(`User ${user} has valid persistent token`);
                                } else {
                                    await BiometricStorage.deleteBiometricData(user);
                                }
                            } catch (serverError) {
                                console.error(`Error checking server status for ${user}:`, serverError);
                            }
                            
                            break;
                        }
                    } catch (error) {
                        console.error(`Error checking user ${user}:`, error);
                    }
                }
            }
            
            console.log('Biometric availability check:', { 
                hasHardware, 
                isEnrolled,
                biometricUsersCount: biometricUsers.length,
                biometricUsers: biometricUsers,
                hasValidBiometricData,
                hasValidServerToken,
                finalCondition: hasHardware && isEnrolled && hasValidBiometricData && hasValidServerToken
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
        const targetUsername = biometricUsers[0];
        
        console.log('Attempting biometric auth...');

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
        const loginData = {
            username: targetUsername,
            password: password,
            grant_type: "password"
        };
        
        const baseUrl = await NetworkConfig.getBaseUrl();

        // Folosim noul endpoint pentru autentificare directă biometrică
        const response = await fetch(`${baseUrl}/auth/biometric/direct`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });

        const data = await response.json();

        if (response.ok) {
            await SecureStore.setItemAsync('access_token', data.access_token);
            await SecureStore.setItemAsync('refresh_token', data.refresh_token);
            
            // Stochează persistent refresh token pentru biometric
            if (data.persistent_refresh_token) {
                await SecureStore.setItemAsync('persistent_refresh_token', data.persistent_refresh_token);
            }

            await SecureStore.setItemAsync('last_logged_user', bioStatus.username);

            const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
            const userRole = tokenPayload.role;

            router.replace(userRole === 'admin' ? '/admin' : '/user');
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
        
        // Verifică dacă utilizatorul este blocat
        if (isBlocked) {
            if (blockTimeRemaining === Infinity) {
                setError("Contul este blocat permanent. Contactați administratorul.");
            } else {
                setError(`Prea multe încercări eșuate. Încercați din nou în ${formatTimeRemaining(blockTimeRemaining)}.`);
            }
            return;
        }
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
            const data = await response.json();
            if (response.ok) {
                // Reset failed attempts on successful login
                setFailedAttempts(0);
                setLastAttemptTime(null);
                setIsBlocked(false);
                setBlockTimeRemaining(0);
                // Store tokens using SecureStore for maximum security
                await SecureStore.setItemAsync('access_token', data.access_token);
                await SecureStore.setItemAsync('refresh_token', data.refresh_token);
                // Stochează persistent refresh token dacă există
                if (data.persistent_refresh_token) {
                    await SecureStore.setItemAsync('persistent_refresh_token', data.persistent_refresh_token);}
                // Save password temporarily for biometric setup
                await SecureStore.setItemAsync('user_password', password);
                // Save credentials for biometric authentication if enabled for this user
                const trimmedUsername = username.trim();
                const hasExistingBiometricData = await BiometricStorage.hasBiometricData(trimmedUsername);
                await SecureStore.setItemAsync('last_logged_user', trimmedUsername);
              const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
              const userRole = tokenPayload.role;
               await SecureStore.setItemAsync('last_logged_user', trimmedUsername);

      

                if (userRole !== 'admin') {
                        // Set up biometric authentication for all non-admin users, ONLY if they haven't explicitly disabled it
                        try {
                            const hasDisabled = await BiometricStorage.hasUserDisabledBiometric(trimmedUsername);
                            if (!hasDisabled) {
                                await BiometricStorage.generateAndSaveBiometricKey(trimmedUsername);
                                await BiometricStorage.encryptPasswordWithBiometricKey(trimmedUsername, password);
                                console.log('Biometric authentication set up successfully for:', trimmedUsername);
                            } else {
                                console.log('User has explicitly disabled biometric, skipping auto-setup:', trimmedUsername);
                            }
                        } catch (bioError) {
                            console.error('Failed to set up biometric authentication:', bioError);
                            // Continue with login even if biometric setup fails
                        }
                        }
                console.log('Checking biometric save:', {
                    username: trimmedUsername,
                    hasExistingBiometricData,
                    passwordLength: password.length
                });
                
          
                // Decode JWT to get user role
                try {
                    const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
                    const userRole = tokenPayload.role;
                    
                    // Navigate based on role - direct navigation without Alert
                    if (userRole === 'admin') {
                        router.replace('/admin');
                    } else {
                        router.replace('/user');
                    }
                } catch (decodeError) {
                    console.error('Token decode error:', decodeError);
                    // Fallback to user page if we can't decode the token
                    router.replace('/user');
                }
            } else {
                // Increment failed attempts on failed login
                const newFailedAttempts = failedAttempts + 1;
                setFailedAttempts(newFailedAttempts);
                setLastAttemptTime(Date.now());
                
                // Check if this failed attempt triggers a block
                const delay = getDelayForFailedAttempts(newFailedAttempts);
                const willBeBlocked = delay > 0;
                
                console.log(' Failed login debug:', {
                    newFailedAttempts,
                    delay,
                    willBeBlocked,
                    username
                });
                
                // Log IP block if user will be blocked
                if (willBeBlocked) {
                    console.log('User will be blocked, logging IP block...');
                    const logIPBlock = async () => {
                        try {
                            const currentIP = await Logger.getCurrentIP();
                            console.log('Current IP:', currentIP);
                            await Logger.logIPBlock(username, currentIP, delay, newFailedAttempts);
                        } catch (error) {
                            console.error('Error logging IP block:', error);
                        }
                    };
                    logIPBlock();
                } else {
                    console.log('User will not be blocked, no IP block logging');
                }
                
                // Handle server errors - convert object to string
                const errorMessage = typeof data.detail === 'string' 
                    ? data.detail 
                    : JSON.stringify(data.detail) || "A apărut o eroare la autentificare.";
                
                // Add brute-force warning to error message
                if (delay === Infinity) {
                    setError(`${errorMessage}. Contul este acum blocat permanent.`);
                } else if (newFailedAttempts > 5 && newFailedAttempts % 5 === 0) {
                    setError(`${errorMessage}. Atenție: încercări eșuate: ${newFailedAttempts}. Următoarea încercare va avea o pauză de ${formatTimeRemaining(delay)}.`);
                } else {
                    setError(errorMessage);
                }
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

{isBlocked && (
  <View style={styles.lockoutWarning}>
    <Text style={styles.lockoutText}>
      {blockTimeRemaining === Infinity 
        ? '⚠️ Cont blocat permanent. Contactați administratorul.'
        : `⏰ Așteptați ${formatTimeRemaining(blockTimeRemaining)} până la următoarea încercare.`
      }
    </Text>
  </View>
)}

<View style={styles.buttonContainer}>
<TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading || isBlocked}>
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
    <TouchableOpacity style={styles.bioButton} onPress={handleBiometricAuth} disabled={isLoading || isBlocked}>
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
