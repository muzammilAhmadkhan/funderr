import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const RoleSelectionScreen = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  

  useEffect(() => {
    const checkAdminRole = async () => {
      const userRole = await AsyncStorage.getItem('userRole');
      if (userRole === 'admin') {
        navigation.replace('AdminPortal');
      }
    };
    checkAdminRole();
  }, []);

  // Animation reference
  const logoAnimation = {
    0: { scale: 1 },
    0.5: { scale: 1.1 },
    1: { scale: 1 }
  };

  // When user selects a role
  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
  };
  
  // Continue with selected role
  const handleContinue = async () => {
    if (!selectedRole) return;
    try {
      setIsLoading(true);
      // Update user profile in backend with selected role
      const { ApiService } = require('../services/ApiService');
      await ApiService.updateUserProfile({ role: selectedRole });
      await AsyncStorage.setItem('userRole', selectedRole);
      // Add a slight delay to show loading state
      setTimeout(() => {
        if (selectedRole === 'donor') {
          navigation.navigate('DonorProfileCreation');
        } else if (selectedRole === 'campaign_creator') {
          navigation.navigate('CampaignProfileCreation');
        }
        setIsLoading(false);
      }, 800);
    } catch (e) {
      console.error('Error saving role:', e);
      setIsLoading(false);
    }
  };

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

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#667eea']}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Animatable.View 
              animation="fadeInDown" 
              duration={1000} 
              style={styles.headerContainer}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.logoContainer}
              >
                <Animatable.Text animation={logoAnimation} iterationCount="infinite" duration={3000} style={styles.logoText}>
                  funderr
                </Animatable.Text>
                <Text style={styles.tagline}>Empowering Change Together</Text>
              </LinearGradient>
            </Animatable.View>
            
            <Animatable.View 
              animation="fadeInUp"
              duration={1000} 
              style={styles.contentContainer}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.90)']}
                style={styles.contentGradient}
              >
                <View style={styles.titleContainer}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.titleIconContainer}
                  >
                    <MaterialIcons name="person-add" size={24} color="white" />
                  </LinearGradient>
                  <Text style={styles.title}>Choose Your Path</Text>
                  <Text style={styles.subtitle}>How would you like to make a difference today?</Text>
                </View>
                
                <View style={styles.roleCardsContainer}>
                  <TouchableOpacity
                    style={[styles.roleCard, selectedRole === 'donor' && styles.roleCardSelected]}
                    onPress={() => handleRoleSelect('donor')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={selectedRole === 'donor' ? ['#ff6b6b', '#feca57'] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                      style={styles.roleCardGradient}
                    >
                      <LinearGradient
                        colors={['#ff6b6b', '#ff9a9e']}
                        style={styles.roleIconContainer}
                      >
                        <MaterialIcons name="favorite" size={28} color="white" />
                      </LinearGradient>
                      <View style={styles.roleTextContainer}>
                        <Text style={[styles.roleTitle, selectedRole === 'donor' && styles.selectedText]}>
                          Donor
                        </Text>
                        <Text style={[styles.roleDescription, selectedRole === 'donor' && styles.selectedDescription]}>
                          Support causes and make a meaningful impact with your contributions
                        </Text>
                      </View>
                      {selectedRole === 'donor' && (
                        <View style={styles.checkmarkContainer}>
                          <MaterialIcons name="check-circle" size={24} color="white" />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.roleCard, selectedRole === 'campaign_creator' && styles.roleCardSelected]}
                    onPress={() => handleRoleSelect('campaign_creator')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={selectedRole === 'campaign_creator' ? ['#667eea', '#764ba2'] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                      style={styles.roleCardGradient}
                    >
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.roleIconContainer}
                      >
                        <MaterialIcons name="campaign" size={28} color="white" />
                      </LinearGradient>
                      <View style={styles.roleTextContainer}>
                        <Text style={[styles.roleTitle, selectedRole === 'campaign_creator' && styles.selectedText]}>
                          Campaign Creator
                        </Text>
                        <Text style={[styles.roleDescription, selectedRole === 'campaign_creator' && styles.selectedDescription]}>
                          Launch fundraising campaigns and bring your vision to life
                        </Text>
                      </View>
                      {selectedRole === 'campaign_creator' && (
                        <View style={styles.checkmarkContainer}>
                          <MaterialIcons name="check-circle" size={24} color="white" />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={[styles.continueButton, (!selectedRole || isLoading) && styles.continueButtonDisabled]}
                  onPress={handleContinue}
                  disabled={!selectedRole || isLoading}
                >
                  <LinearGradient
                    colors={(!selectedRole || isLoading) ? ['#cccccc', '#aaaaaa'] : ['#56ab2f', '#a8e6cf']}
                    style={styles.continueButtonGradient}
                  >
                    {isLoading ? (
                      <Text style={styles.continueButtonText}>Setting up...</Text>
                    ) : (
                      <>
                        <Text style={styles.continueButtonText}>Continue</Text>
                        {selectedRole && (
                          <MaterialIcons name="arrow-forward" size={20} color="white" style={styles.continueIcon} />
                        )}
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animatable.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : StatusBar.currentHeight + 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#2c3e50',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 16,
    color: '#2c3e50',
    marginTop: 5,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: 'auto',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  contentGradient: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    minHeight: 500,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#764ba2',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  subtitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#764ba2',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  },
  roleCardsContainer: {
    marginBottom: 32,
  },
  roleCard: {
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  roleCardSelected: {
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  roleCardGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  selectedText: {
    color: 'white',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  selectedDescription: {
    color: 'rgba(255,255,255,0.9)',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  continueButton: {
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#56ab2f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    shadowOpacity: 0.1,
  },
  continueButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  continueIcon: {
    marginLeft: 8,
  },
});

export default RoleSelectionScreen;
