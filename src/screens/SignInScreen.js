import React, { useState, useLayoutEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions,
  StatusBar
} from 'react-native';
import { AuthService } from '../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState('muz3@gmail.com');
  const [password, setPassword] = useState('12345678');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: code+new password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.headerButton}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.headerButtonGradient}
          >
            <Ionicons name="home" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      ),
      headerTitle: '',
      headerTransparent: true,
    });
  }, [navigation]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };  const validatePassword = (password) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    setPasswordError('');
    return true;  };const handleSignIn = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      setMessage('Please check email and password fields.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('Signing in...');
    setMessageType('info');
    
    try {      // Call the AuthService which will try to connect to the real backend
      console.log('Calling AuthService.signIn for:', email);
      const response = await AuthService.signIn(email, password);
      console.log('Authentication response received:', response);
      if (!response || !response.token) {
        console.error('Invalid response format:', response);
        throw new Error('Invalid credentials or server error');
      }
      // Set the user info in AsyncStorage (if not already done by AuthService)
      if (response.token) await AsyncStorage.setItem('userToken', response.token);
      if (response.userId) await AsyncStorage.setItem('userId', response.userId);
      if (email) await AsyncStorage.setItem('userEmail', email);
      // Fetch user profile from backend to get the latest role
      const { ApiService } = require('../services/ApiService');
      let userProfile = null;
      try {
        userProfile = await ApiService.getUserProfile();
        if (userProfile && userProfile.role) {
          await AsyncStorage.setItem('userRole', userProfile.role);
        } else {
          await AsyncStorage.removeItem('userRole');
        }
        // Also store the full userProfile for later screens
        await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      } catch (e) {
        await AsyncStorage.removeItem('userRole');
        await AsyncStorage.removeItem('userProfile');
      }
      setIsLoading(false);
      setMessage('Login successful!');
      setMessageType('success');
      // Wait for AsyncStorage writes to complete before navigating
      setTimeout(() => {
        if (userProfile && userProfile.role === 'admin') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' }]
          });
          setTimeout(() => {
            navigation.navigate('AdminPortal');
          }, 300);
        } else {
          const validRoles = ['donor', 'campaign_creator'];
          if (userProfile && validRoles.includes(userProfile.role)) {
            if (userProfile.name) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp' }]
              });
            } else {
              if (userProfile.role === 'donor') {
                navigation.navigate('DonorProfileCreation');
              } else {
                navigation.navigate('CampaignProfileCreation');
              }
            }
          } else {
            navigation.navigate('RoleSelection');
          }
        }
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      // Check if it's a network error
      if (error.message && error.message.includes('Network Error')) {
        setMessage('Unable to connect to the server. Please check your internet connection.');
      } else if (error.response && error.response.status === 401) {
        setMessage('Invalid email or password. Please try again.');
      } else if (error.message && (
          error.message.toLowerCase().includes('password') || 
          error.message.toLowerCase().includes('invalid') ||
          error.message.toLowerCase().includes('credentials')
        )) {
        // Handle specific auth errors from our AuthService
        setMessage(error.message);
      } else {
        setMessage('Authentication failed. Please check your credentials and try again.');
      }
      setMessageType('error');
      console.error('Login error:', error);
    }
  };

  const handleForgotPassword = async () => {
    setForgotMessage('');
    if (!forgotEmail) {
      setForgotMessage('Please enter your email.');
      return;
    }
    setForgotLoading(true);
    try {
      await ApiService.requestPasswordReset(forgotEmail);
      setForgotMessage('A code has been sent to your email.');
      setResetStep(2);
    } catch (err) {
      setForgotMessage('Failed to send reset code.');
    }
    setForgotLoading(false);
  };

  const handleResetPassword = async () => {
    setForgotMessage('');
    if (!resetCode || !newPassword) {
      setForgotMessage('Please enter the code and new password.');
      return;
    }
    setForgotLoading(true);
    try {
      await ApiService.resetPassword(forgotEmail, resetCode, newPassword);
      setForgotMessage('Password reset successful! You can now sign in.');
      setTimeout(() => {
        setShowForgot(false);
        setResetStep(1);
        setForgotEmail('');
        setResetCode('');
        setNewPassword('');
      }, 1500);
    } catch (err) {
      setForgotMessage('Failed to reset password. Check your code and try again.');
    }
    setForgotLoading(false);
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#667eea']}
      style={styles.background}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.centeredWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animatable.View 
          animation="fadeInUp" 
          duration={800} 
          style={styles.card}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.90)']}
            style={styles.cardGradient}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#ff6b6b', '#feca57', '#48dbfb']}
                style={styles.logoCircle}
              >
                <MaterialIcons name="volunteer-activism" size={32} color="white" />
              </LinearGradient>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue funding dreams</Text>
            </View>

            <View style={styles.inputContainer}>
              <LinearGradient
                colors={['#f8f9fa', '#e9ecef']}
                style={styles.inputGradient}
              >
                <MaterialIcons name="email" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#6c757d"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </LinearGradient>
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <View style={styles.inputContainer}>
              <LinearGradient
                colors={['#f8f9fa', '#e9ecef']}
                style={styles.inputGradient}
              >
                <MaterialIcons name="lock" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#6c757d"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                  <MaterialIcons 
                    name={passwordVisible ? 'visibility-off' : 'visibility'} 
                    size={20} 
                    color="#667eea" 
                  />
                </TouchableOpacity>
              </LinearGradient>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#cccccc', '#aaaaaa'] : ['#ff6b6b', '#feca57']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.link}>
                Don't have an account? <Text style={styles.linkBold}>Create Account</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotLink}>Forgot Password?</Text>
            </TouchableOpacity>

            {message ? (
              <Animatable.View 
                animation="fadeIn" 
                style={[styles.messageContainer, messageType === 'success' ? styles.successContainer : styles.errorContainer]}
              >
                <MaterialIcons 
                  name={messageType === 'success' ? 'check-circle' : 'error'} 
                  size={20} 
                  color={messageType === 'success' ? '#4CAF50' : '#F44336'} 
                />
                <Text style={[styles.message, messageType === 'success' ? styles.success : styles.error]}>
                  {message}
                </Text>
              </Animatable.View>
            ) : null}
          </LinearGradient>
        </Animatable.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height,
  },
  centeredWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerButton: {
    marginLeft: 15,
    marginTop: 10,
  },
  headerButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 16,
    fontWeight: '500',
  },
  button: {
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#ff6b6b',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  link: {
    textAlign: 'center',
    marginTop: 16,
    color: '#667eea',
    fontSize: 16,
    fontWeight: '500',
  },
  linkBold: {
    fontWeight: 'bold',
    color: '#764ba2',
  },
  forgotLink: {
    textAlign: 'center',
    marginTop: 12,
    color: '#ff6b6b',
    fontSize: 15,
    fontWeight: '600',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
  },
  successContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  message: {
    marginLeft: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#F44336',
  },
});

export default SignInScreen;
