import React, { useState, useLayoutEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions, StatusBar, ScrollView
} from 'react-native';
import { AuthService } from '../services/AuthService';
import { ApiService } from '../services/ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeMessage, setCodeMessage] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);

  const { width, height } = Dimensions.get('window');

  const getPasswordStrength = (pass) => {
    if (pass.length > 7 && /[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) {
      return 'Strong';
    } else if (pass.length > 5) {
      return 'Moderate';
    } else {
      return 'Weak';
    }
  };

  const validateName = (name) => {
    if (!name || name.trim() === '') {
      setNameError('Name is required');
      return false;
    }
    setNameError('');
    return true;
  };

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
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };  

  const handleSendCode = async () => {
    setCodeMessage('');
    if (!validateEmail(email)) return;
    setCodeLoading(true);
    try {
      await ApiService.requestSignupCode(email);
      setCodeSent(true);
      setCodeMessage('A code has been sent to your email.');
      setCanResend(false);
      setResendTimer(120);
      // Start timer for resend
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setCodeMessage('Failed to send code.');
    }
    setCodeLoading(false);
  };

  const handleSignUp = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      setMessage('Please check all fields.');
      setMessageType('error');
      return;
    }
    if (!codeSent) {
      setMessage('Please verify your email with the code.');
      setMessageType('error');
      return;
    }
    if (!code) {
      setMessage('Please enter the code sent to your email.');
      setMessageType('error');
      return;
    }
    setIsLoading(true);
    setMessage('Verifying code...');
    setMessageType('info');
    try {
      // Verify code using the new endpoint
      await ApiService.verifySignupCode(email, code);
      setMessage('Code verified. Creating your account...');
      // Now create the user
      const response = await AuthService.signUp(name, email, password, undefined);
      
      // After successful sign-up, also sign in the user automatically
      const signInResponse = await AuthService.signIn(email, password);
      
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('userToken', signInResponse.token);
      await AsyncStorage.setItem('userId', signInResponse.userId);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userName', name);
      
      setIsLoading(false);
      setMessage('Account created successfully!');
      setMessageType('success');
      
      // Navigate to sign in screen after a short delay
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      setMessage('Invalid code or registration failed.');
      setMessageType('error');
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.headerButton}>
          <LinearGradient
            colors={['#ff9a9e', '#fecfef']}
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
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
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
              <MaterialIcons name="person-add" size={32} color="white" />
            </LinearGradient>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our crowdfunding community</Text>
              </View>

              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.inputGradient}
                >
                  <MaterialIcons name="person" size={20} color="#ff9a9e" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#6c757d"
                    value={name}
                    onChangeText={setName}
                  />
                </LinearGradient>
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.inputGradient}
                >
                  <MaterialIcons name="email" size={20} color="#ff9a9e" style={styles.inputIcon} />
                  <TextInput
                    style={styles.emailInput}
                    placeholder="Email Address"
                    placeholderTextColor="#6c757d"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </LinearGradient>
              </View>

              <TouchableOpacity
                style={styles.sendCodeButton}
                onPress={handleSendCode}
                disabled={codeLoading || !canResend}
              >
                <LinearGradient
                  colors={codeLoading || !canResend ? ['#cccccc', '#aaaaaa'] : ['#667eea', '#764ba2']}
                  style={styles.sendCodeGradient}
                >
                  <MaterialIcons 
                    name={codeSent ? "refresh" : "send"} 
                    size={18} 
                    color="white" 
                    style={styles.sendCodeIcon} 
                  />
                  <Text style={styles.sendCodeText}>
                    {codeLoading ? 'Sending...' : canResend ? (codeSent ? 'Resend Code' : 'Send Code') : `Resend (${resendTimer}s)`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              {codeMessage ? (
                <Animatable.View animation="fadeIn" style={styles.codeMessageContainer}>
                  <MaterialIcons name="info" size={16} color="#667eea" />
                  <Text style={styles.codeMessage}>{codeMessage}</Text>
                </Animatable.View>
              ) : null}

              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.inputGradient}
                >
                  <MaterialIcons name="lock" size={20} color="#ff9a9e" style={styles.inputIcon} />
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
                      color="#ff9a9e" 
                    />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

              <View style={styles.strengthContainer}>
                <Text style={[styles.strengthText, {
                  color: getPasswordStrength(password) === 'Strong' ? '#28a745' :
                    getPasswordStrength(password) === 'Moderate' ? '#feca57' : '#dc3545'
                }]}>
                  Password Strength: {getPasswordStrength(password)}
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.inputGradient}
                >
                  <MaterialIcons name="lock-outline" size={20} color="#ff9a9e" style={styles.inputIcon} />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm Password"
                    placeholderTextColor="#6c757d"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!confirmPasswordVisible}
                  />
                  <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
                    <MaterialIcons 
                      name={confirmPasswordVisible ? 'visibility-off' : 'visibility'} 
                      size={20} 
                      color="#ff9a9e" 
                    />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
              {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.inputGradient}
                >
                  <MaterialIcons name="verified-user" size={20} color="#ff9a9e" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter verification code"
                    placeholderTextColor="#6c757d"
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="none"
                  />
                </LinearGradient>
              </View>

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

              <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]} 
                onPress={handleSignUp}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#cccccc', '#aaaaaa'] : ['#ff6b6b', '#feca57']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.link}>
                  Already have an account? <Text style={styles.linkBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
  },
  centeredWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  card: {
    borderRadius: 16,
    padding: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 16,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#764ba2',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#2c3e50',
  },
  emailInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#2c3e50',
  },
  passwordInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#2c3e50',
  },
  sendCodeButton: {
    marginBottom: 16,
    marginTop: 8,
  },
  sendCodeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  sendCodeIcon: {
    marginRight: 8,
  },
  sendCodeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  codeMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
  },
  codeMessage: {
    color: '#667eea',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
  },
  successContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  message: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#F44336',
  },
  button: {
    marginBottom: 24,
    marginTop: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#ff6b6b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  link: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
  },
  linkBold: {
    fontWeight: '700',
    color: '#667eea',
  },
});

export default SignUpScreen;
