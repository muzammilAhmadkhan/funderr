import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/ApiService';

const { width, height } = Dimensions.get('window');

const CampaignCreationScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

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

    // Validate input fields
    if (!title.trim()) {
      setMessage('Please enter a campaign title');
      setMessageType('error');
      return;
    }

    if (!description.trim()) {
      setMessage('Please enter a campaign description');
      setMessageType('error');
      return;
    }

    if (!fundingGoal || isNaN(parseFloat(fundingGoal)) || parseFloat(fundingGoal) <= 0) {
      setMessage('Please enter a valid funding goal amount');
      setMessageType('error');
      return;
    }

    if (!category.trim()) {
      setMessage('Please select a category');
      setMessageType('error');
      return;
    }

    setMessage('Creating your campaign...');
    setMessageType('info');
    setIsSubmitting(true);

    try {
      const campaignData = {
        title,
        description,
        goal: parseFloat(fundingGoal),
        category: category.toUpperCase(),
      };
      await ApiService.createCampaign(campaignData);
      setMessage('Your campaign has been submitted for review and will be published within 24 hours.');
      setMessageType('success');
      setTimeout(() => {
        navigation.navigate('UserInterface', { refreshCampaigns: true });
      }, 2000);
    } catch (error) {
      console.error('Campaign submission error:', error);
      setMessage('There was an error creating your campaign. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#968ca1ff']}
      style={styles.container}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Animatable.View 
              animation="fadeInDown" 
              duration={1000} 
              style={styles.headerContainer}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.headerCard}
              >
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <MaterialIcons name="arrow-back" size={24} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Campaign</Text>
                <View style={{ width: 24 }} />
              </LinearGradient>
            </Animatable.View>

            <Animatable.View
              animation="fadeIn"
              duration={800}
              style={styles.formContainer}
            >
            <Animatable.View 
              style={styles.sectionHeader}
              animation="pulse"
              iterationCount={1}
              duration={1500}
            >
              <Text style={styles.sectionTitle}>Campaign Details</Text>
              <Text style={styles.sectionSubtitle}>Fill in the information below to get started</Text>
            </Animatable.View>
            <Animatable.View 
              style={styles.inputGroup}
              animation="fadeInUp"
              delay={200}
            >
              <View style={styles.labelRow}>
                <Ionicons name="document-text-outline" size={20} color="#ffffffff" />
                <Text style={styles.inputLabel}>Campaign Title</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter a compelling campaign title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999"
              />
              <Text style={styles.inputHint}>Choose a clear and inspiring title for your campaign</Text>
            </Animatable.View>
            <Animatable.View 
              style={styles.inputGroup}
              animation="fadeInUp"
              delay={400}
            >
              <View style={styles.labelRow}>
                <Ionicons name="list-outline" size={20} color="#ffffffff" />
                <Text style={styles.inputLabel}>Campaign Description</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell people why you're raising funds and how it will make a difference..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
              <Text style={styles.inputHint}>Explain your cause, goals, and how donations will be used</Text>
            </Animatable.View>
            <Animatable.View 
              style={styles.inputGroup}
              animation="fadeInUp"
              delay={600}
            >
              <View style={styles.labelRow}>
                <Ionicons name="cash-outline" size={20} color="#ffffffff" />
                <Text style={styles.inputLabel}>Funding Goal (ETH)</Text>
              </View>
              <View style={styles.currencyInputContainer}>
                <View style={styles.currencyLabel}>
                  <Text style={styles.currencyText}>ETH</Text>
                </View>
                <TextInput
                  style={styles.currencyInput}
                  placeholder="1.5"
                  value={fundingGoal}
                  onChangeText={setFundingGoal}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <Text style={styles.inputHint}>Set a realistic target amount for your fundraising goal (in Ether)</Text>
            </Animatable.View>
            
            <Animatable.View 
              style={styles.inputGroup}
              animation="fadeInUp"
              delay={800}
            >
              <View style={styles.labelRow}>
                <Ionicons name="pricetag-outline" size={20} color="#ffffffff" />
                <Text style={styles.inputLabel}>Campaign Category</Text>
              </View>
              <View style={styles.categoryButtonsContainer}>
                {['Education', 'Health', 'Emergency', 'Water', 'Food', 'Sports', 'Arts'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonSelected
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text 
                      style={[
                        styles.categoryButtonText,
                        category === cat && styles.categoryButtonTextSelected
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>                ))}
              </View>
              <Text style={styles.inputHint}>Select the category that best describes your campaign</Text>
            </Animatable.View>
            
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
              <Animatable.View
              animation="fadeIn"
              delay={1000}
            >
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                      Submitting...
                    </Text>
                  </View>
                ) : (
                  <Animatable.View 
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    animation="pulse" 
                    iterationCount="infinite" 
                    duration={2000}
                  >
                    <Ionicons name="rocket-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Launch Campaign</Text>
                  </Animatable.View>
                )}
              </TouchableOpacity>
            </Animatable.View>

            <Animatable.View
              animation="fadeIn"
              delay={1100}
            >
              <TouchableOpacity
                style={styles.backToHomeButton}
                onPress={() => navigation.navigate('UserInterface')}
              >
                <Ionicons name="chevron-back" size={16} color="#ffffffff" />
                <Text style={styles.backToHomeText}>Back to Home</Text>
              </TouchableOpacity>
            </Animatable.View>
            <Animatable.Text 
              style={styles.reviewNote}
              animation="fadeIn"
              delay={1200}
            >
              <Ionicons name="information-circle-outline" size={14} color="#ffffffff" />
              {' '}Your campaign will be reviewed and published within 24 hours
            </Animatable.Text>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: -10,
    
  },
  safeArea: {
    flex: 1,
    paddingTop: 30,
    width: '50%',
    margin: 'auto',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : StatusBar.currentHeight + 20,
    paddingBottom: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    backgroundColor: '#9370DB', // Purple color matching app theme
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
    marginTop: 10,
    shadowColor: '#9370DB',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffffff',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    shadowColor: 'rgba(147, 112, 219, 0.1)', // Light purple shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#ffffffff',
    marginTop: 6,
    marginLeft: 4,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyLabel: {
    backgroundColor: 'rgba(147, 112, 219, 0.1)', // Light purple
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#e0e0e0',
  },
  currencyText: {
    fontSize: 16,
    color: '#ffffffff', // Changed to purple
    fontWeight: '500',
  },
  currencyInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  categoryButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffffff',
    backgroundColor: 'transparent',
    margin: 4,
  },
  categoryButtonSelected: {
    backgroundColor: '#9370DB',
  },
  categoryButtonText: {
    color: '#ffffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: 'white',
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
  submitButton: {
    backgroundColor: '#9370DB',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#9370DB', // Changed to purple shadow
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backToHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ffffffff',
    borderRadius: 10,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  backToHomeText: {
    fontSize: 15,
    color: '#ffffffff',
    fontWeight: '600',
    marginLeft: 5,
  },
  reviewNote: {
    textAlign: 'center',
    fontSize: 13,
    color: '#ffffffff',
    lineHeight: 18,
  }
});




export default CampaignCreationScreen;
