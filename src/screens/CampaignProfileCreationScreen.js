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
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';


const CampaignProfileCreationScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Get user email when component mounts
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (!userEmail) {
          console.warn('User email not found in storage');
        }
      } catch (error) {
        console.error('Error retrieving user email:', error);
      }
    };
    getUserEmail();
  }, []);

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
    
    // Validation
    if (!name || !organization || !description) {
      setMessage('Please fill in all fields.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('Creating your profile...');
    setMessageType('info');

    try {
      // Get email and userId from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      const userId = await AsyncStorage.getItem('userId');
      if (!email || !userId) {
        setMessage('Session error. Please sign in again.');
        setMessageType('error');
        setIsLoading(false);
        return;
      }
      // Save profile to backend
      const { ApiService } = require('../services/ApiService');
      await ApiService.updateUserProfile({
        role: 'campaign_creator',
        name,
        organization,
        description,
        email
      });
      await AsyncStorage.setItem('profileComplete', 'true');
      setMessage('Your campaign creator profile has been created successfully!');
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
  // ...existing code...
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
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Animatable.View
            style={styles.card}
            animation="fadeInUp"
            duration={800}
            delay={300}
          >
            <LinearGradient
              colors={['#fff', '#f7f7fa']}
              style={styles.cardGradient}
            >
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#ff6b6b', '#feca57', '#48dbfb']}
                  style={styles.logoCircle}
                >
                  <MaterialIcons name="campaign" size={32} color="white" />
                </LinearGradient>
                <Text style={styles.title}>Campaign Creator Profile</Text>
                <Text style={styles.subtitle}>Tell us about your organization and campaign</Text>
              </View>
              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.inputGradient}
                >
                  <MaterialIcons name="person" size={20} color="#ff9a9e" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your Name"
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
                  <MaterialIcons name="business" size={20} color="#ff9a9e" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Organization Name"
                    placeholderTextColor="#6c757d"
                    value={organization}
                    onChangeText={setOrganization}
                  />
                </LinearGradient>
              </View>
              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.inputGradient}
                >
                  <MaterialIcons name="description" size={20} color="#ff9a9e" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Campaign Description"
                    placeholderTextColor="#6c757d"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
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
}


const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
  },
  centeredWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
    alignSelf: 'center',
  },
  cardGradient: {
    borderRadius: 16,
    padding: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9370DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#764ba2',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 18,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputGradient: {
    borderRadius: 10,
    padding: 1,
  },
  input: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#764ba2',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
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
    backgroundColor: 'rgba(147, 112, 219, 0.2)',
    borderColor: '#764ba2',
    borderWidth: 1,
  },
  messageText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default CampaignProfileCreationScreen;
