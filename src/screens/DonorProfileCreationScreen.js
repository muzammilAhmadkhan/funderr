import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const DonorProfileCreationScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Get user email from AsyncStorage when component mounts
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (userEmail) {
          setEmail(userEmail);
        }
      } catch (error) {
        console.error('Error retrieving user email:', error);
      }
    };
    getUserEmail();
  }, []);

  // Set up header options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ marginLeft: 15 }}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={{ borderRadius: 20, padding: 8 }}
          >
            <MaterialIcons name="home" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      ),
      headerTitle: '',
      headerTransparent: true,
    });
  }, [navigation]);

  const handleSubmit = async () => {
    // Clear previous messages
    setMessage('');
    setMessageType('');
    
    // Form validation
    if (!name || !phone || !address) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (phone.length < 10) {
      setMessage('Please enter a valid phone number');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('Creating your profile...');
    setMessageType('info');

    try {
      // Get user email and ID from storage
      const userId = await AsyncStorage.getItem('userId');
      const userEmail = email || await AsyncStorage.getItem('userEmail');
      if (!userId || !userEmail) {
        setMessage('Session error. Please sign in again.');
        setMessageType('error');
        setIsLoading(false);
        return;
      }
      // Save profile to backend
      const { ApiService } = require('../services/ApiService');
      await ApiService.updateUserProfile({
        role: 'donor',
        name,
        phone,
        address,
        email: userEmail
      });
      await AsyncStorage.setItem('profileComplete', 'true');
      setMessage('Your donor profile has been created successfully!');
      setMessageType('success');
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp', params: { screen: 'UserInterface' } }]
        });
      }, 2000);
    } catch (error) {
      console.error('Profile creation error:', error);
      setMessage('Failed to create your profile. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <LinearGradient
      colors={['#ff9a9e', '#fecfef', '#ffecd2']}
      style={styles.background}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.centeredWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Animatable.View
            style={styles.card}
            animation="fadeInUp"
            duration={800}
            delay={300}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.90)']}
              style={styles.cardGradient}
            >
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#56ab2f', '#a8e6cf', '#ff6b6b']}
                  style={styles.logoCircle}
                >
                  <MaterialIcons name="volunteer-activism" size={32} color="white" />
                </LinearGradient>
                <Text style={styles.title}>Create Donor Profile</Text>
                <Text style={styles.subtitle}>Tell us about yourself to get started</Text>
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

              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.inputGradient}
                >
                  <MaterialIcons name="phone" size={20} color="#ff9a9e" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor="#6c757d"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </LinearGradient>
              </View>

              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.inputGradient}
                >
                  <MaterialIcons name="location-on" size={20} color="#ff9a9e" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Address"
                    placeholderTextColor="#6c757d"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </LinearGradient>
              </View>

              {message ? (
                <Animatable.View
                  style={[
                    styles.messageContainer,
                    messageType === 'success' ? styles.successMessage :
                    messageType === 'error' ? styles.errorMessage :
                    styles.infoMessage
                  ]}
                  animation="fadeInUp"
                  duration={500}
                >
                  <Animatable.Text
                    style={styles.messageText}
                    animation="pulse"
                    iterationCount={messageType === 'error' ? 2 : 1}
                  >
                    {message}
                  </Animatable.Text>
                </Animatable.View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#cccccc', '#aaaaaa'] : ['#ff6b6b', '#feca57']}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={[styles.buttonText, { marginLeft: 8 }]}>Creating Profile...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Create Profile</Text>
                      <MaterialIcons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                    </>
                  )}
                </LinearGradient>
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
    width,
    height,
  },
  centeredWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#9370DB', // Purple color
  },
  input: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#9370DB', // Purple color
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    marginTop: 5,
  },
  successMessage: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  errorMessage: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  infoMessage: {
    backgroundColor: 'rgba(147, 112, 219, 0.2)', // Purple color with opacity
    borderColor: '#9370DB', // Purple color
    borderWidth: 1,
  },
  messageText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});




export default DonorProfileCreationScreen;
