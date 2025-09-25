import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  SafeAreaView,
  Alert,
  Platform,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
  ImageBackground
} from 'react-native';

const { width, height } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/ApiService';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

const CROWDFUNDING_QUOTE =
  'Small contributions create extraordinary change';



// Define image paths (will be dynamically loaded)
const imageMapping = {
  mainpage: require('../assets/mainpage.jpg'),
  bg: require('../assets/bg.jpg'),
  roleSelection: require('../assets/RoleSelection.jpg'),
  aid: require('../assets/Aid.jpg'),
  water: require('../assets/Water.jpg'),
  mute: require('../assets/Mute.jpg'),
  dad: require('../assets/Dad.jpg'),
  vet: require('../assets/vet.jpeg'),
  arts: require('../assets/Arts education.jpg'),
  disaster: require('../assets/Disaster.jpeg'),
  communityGarden: require('../assets/Community garden.jpeg'),
  youthSports: require('../assets/Youth sport.jpg'),
  books: require('../assets/Book for kids.jpg'),

};

// Define campaigns with image keys instead of direct references
// Trending campaigns from backend
// ...existing code...

const UserInterface = ({ navigation }) => {
  // Fetch trending campaigns (approved only)
  useEffect(() => {
    const fetchTrendingCampaigns = async () => {
      try {
        const campaigns = await ApiService.listCampaigns('approved');
        // apply overrides from AsyncStorage
        try {
          const overridesRaw = await AsyncStorage.getItem('campaignOverrides');
          const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
          const applied = (campaigns || []).filter(c => {
            const id = c._id || c.id;
            const ov = overrides[id];
            return !(ov && ov.deleted);
          }).map(c => {
            const id = c._id || c.id;
            const ov = overrides[id];
            if (ov && typeof ov.raised === 'number') return { ...c, raised: ov.raised };
            return c;
          });
          setTrendingCampaigns(applied);
          setCampaignOverrides(overrides || {});
        } catch (e) {
          console.warn('Failed to apply campaign overrides', e);
          setTrendingCampaigns(campaigns);
        }
      } catch (error) {
        console.error('Error fetching trending campaigns:', error);
      }
    };
    fetchTrendingCampaigns();
  }, []);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [showExplore, setShowExplore] = useState(false);
  const [trendingCampaigns, setTrendingCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [donateAmount, setDonateAmount] = useState('');
  const [donatedCampaigns, setDonatedCampaigns] = useState([]);
  const [campaignOverrides, setCampaignOverrides] = useState({}); // { [id]: { raised?: number, deleted?: true } }
  // Wallet connection state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletProviderType, setWalletProviderType] = useState(null); // 'injected' | 'walletconnect' | null
  const [ethersProvider, setEthersProvider] = useState(null);
  const [ethersSigner, setEthersSigner] = useState(null);
  const [signedMessage, setSignedMessage] = useState(null);
  // Extract the route name to determine which tab we're on
  const activeRoute = useRoute();
  // Listen for navigation params to trigger campaign refresh
  useFocusEffect(
    React.useCallback(() => {
      if (activeRoute?.params?.refreshCampaigns && userProfile && userProfile.id) {
        const fetchUserCampaigns = async () => {
          try {
            const campaigns = await ApiService.getUserCampaigns(userProfile.id);
            // apply any local overrides
            try {
              const overridesRaw = await AsyncStorage.getItem('campaignOverrides');
              const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
              const applied = (campaigns || []).filter(c => {
                const id = c._id || c.id;
                const ov = overrides[id];
                return !(ov && ov.deleted);
              }).map(c => {
                const id = c._id || c.id;
                const ov = overrides[id];
                if (ov && typeof ov.raised === 'number') return { ...c, raised: ov.raised };
                return c;
              });
              setUserCampaigns(applied);
            } catch (e) {
              console.warn('Failed to apply campaign overrides to user campaigns', e);
              setUserCampaigns(campaigns);
            }
          } catch (error) {
            console.error('Error refreshing user campaigns:', error);
          }
        };
        fetchUserCampaigns();
      }
    }, [activeRoute?.params?.refreshCampaigns, userProfile])
  );
  const [activeTab, setActiveTab] = useState('trending');
  const [search, setSearch] = useState('');
  useFocusEffect(
    React.useCallback(() => {
      const loadUserData = async () => {
        try {
          // Get stored profile data
          const profileData = await AsyncStorage.getItem('userProfile');
          if (profileData) {
            let parsedProfile = JSON.parse(profileData);
            // Ensure id is set from _id if missing
            if (!parsedProfile.id && parsedProfile._id) {
              parsedProfile.id = parsedProfile._id;
            }
            // Load donated campaigns for this user if any
            try {
              const key = `donatedCampaigns:${parsedProfile.id || parsedProfile._id}`;
              const stored = await AsyncStorage.getItem(key);
              if (stored) setDonatedCampaigns(JSON.parse(stored));
            } catch (e) {
              console.warn('Failed to load donated campaigns', e);
            }
            setUserProfile(parsedProfile);
          } else {
            // Check if we at least have email
            const userEmail = await AsyncStorage.getItem('userEmail');
            if (userEmail) {
              setUserProfile({ email: userEmail });
            }
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      };
      loadUserData();
      return () => {}; // Cleanup function
    }, [])
  );

  // Fetch user's campaigns when userProfile is set and has a valid id
  useEffect(() => {
    const fetchUserCampaigns = async () => {
      console.log('Fetching user campaigns for userProfile:', userProfile);
      if (userProfile && userProfile.id) {
        try {
          const campaigns = await ApiService.getUserCampaigns(userProfile.id);
          console.log('Fetched campaigns:', campaigns);
          setUserCampaigns(campaigns);
        } catch (error) {
          console.error('Error fetching user campaigns:', error);
        }
      } else {
        console.warn('userProfile or userProfile.id is missing, cannot fetch campaigns');
      }
    };
    fetchUserCampaigns();
  }, [userProfile]);
// Handle profile view
  // Fetch user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadUserData = async () => {
        try {
          // Get user role
          const role = await AsyncStorage.getItem('userRole');
          setUserRole(role);

          // If no role, force user to RoleSelection
          if (!role) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'RoleSelection' }]
            });
            return;
          }
          // Get stored profile data
          const profileData = await AsyncStorage.getItem('userProfile');
          if (profileData) {
            let parsedProfile = JSON.parse(profileData);
            if (!parsedProfile.id && parsedProfile._id) {
              parsedProfile.id = parsedProfile._id;
            }
            setUserProfile(parsedProfile);
          } else {
            // Check if we at least have email
            const userEmail = await AsyncStorage.getItem('userEmail');
            if (userEmail) {
              setUserProfile({ email: userEmail });
            }
          }
          // Fetch user's campaigns for notification
          try {
            if (userProfile && userProfile.id) {
              const campaigns = await ApiService.getUserCampaigns(userProfile.id);
              setUserCampaigns(campaigns);
            }
          } catch (error) {
            console.error('Error fetching user campaigns:', error);
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      };

      loadUserData();
      return () => {}; // Cleanup function
    }, [])
  );// Handle profile view
  const handleProfileOpen = async () => {
    setShowProfile(true);
    setProfileLoading(true);
    setProfileError(null);
    
    try {
      // Use ApiService to get the user profile
      const { ApiService } = require('../services/ApiService');
      const profileData = await ApiService.getUserProfile();
      
      if (profileData) {
        setUserProfile({
          ...profileData,
          avatar: imageMapping.roleSelection,
          // Ensure name is set - use a default if not available
          name: profileData.name || 
                profileData.fullName || 
                (profileData.role === 'donor' ? 'Donor User' : 'Campaign Creator')
        });
      } else {
        throw new Error('Profile not found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileError('Profile not found or failed to load.');
      
      // Fallback to basic data from AsyncStorage if API call fails
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        const userRole = await AsyncStorage.getItem('userRole');
        
        if (userEmail) {
          setUserProfile({
            email: userEmail,
            name: userRole === 'donor' ? 'Donor User' : 'Campaign Creator',
            role: userRole,
            avatar: imageMapping.roleSelection
          });
          setProfileError(null); // Clear error if we can show something
        }
      } catch (fallbackError) {
        console.error('Fallback profile fetch failed:', fallbackError);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Instead of removing all user data, we'll:
      // 1. Store a backup of important user information
      const userEmail = await AsyncStorage.getItem('userEmail');
      const userRole = await AsyncStorage.getItem('userRole');
      const userProfile = await AsyncStorage.getItem('userProfile');
      
      // 2. Remove authentication token to log out
      await AsyncStorage.removeItem('userToken');
      
      // 3. Store a flag indicating this is a returning user
      await AsyncStorage.setItem('returningUser', 'true');
      
      // 4. Preserve the email for easier login next time
      if (userEmail) {
        await AsyncStorage.setItem('lastEmail', userEmail);
      }
      
      // 5. Store profile data in a backup key
      if (userProfile) {
        await AsyncStorage.setItem('savedUserProfile', userProfile);
      }
      
      // 6. Store user role in a backup key
      if (userRole) {
        await AsyncStorage.setItem('savedUserRole', userRole);
      }
      
      // Navigate to auth stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }]
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'Please try again');
    }
  };const renderCampaignCard = (campaign, index, isExplore = false) => {
    // Use try/catch to handle potential image loading issues
    let imageSource;
    try {
      imageSource = imageMapping[campaign.imageKey];
    } catch (e) {
      // If there's an error with the specific image, default to mainpage
      console.warn(`Error loading image for campaign: ${campaign.title}`, e);
      imageSource = imageMapping.mainpage;
    }

    if (isExplore) {
      // Render the explore card style similar to the image
      return (
        <Animatable.View
          key={campaign.id}
          animation="fadeInUp"
          duration={700}
          delay={index * 100} // Staggered animation
          style={styles.exploreCardContainer}
        >
          <TouchableOpacity 
            style={styles.exploreCard}
            onPress={() => Alert.alert('Campaign Details', `You selected: ${campaign.title}`)}
            activeOpacity={0.8}
          >
            <ImageBackground 
              source={imageSource}
              style={styles.exploreCardBg}
              imageStyle={{ borderRadius: 10 }}
            >
              <View style={styles.exploreCardOverlay}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{campaign.category}</Text>
                </View>
              </View>
            </ImageBackground>
            <View style={styles.exploreCardContent}>
              <Text style={styles.exploreCardTitle}>{campaign.title}</Text>
              <Text style={styles.exploreCardDesc}>{campaign.desc}</Text>
              
              <View style={styles.fundingInfo}>
                <Text style={styles.fundingAmount}>ETH {campaign.raised.toLocaleString()}</Text>
                <Text style={styles.fundingGoal}>of ETH {campaign.goal.toLocaleString()}</Text>
              </View>
              
              <TouchableOpacity style={styles.viewCampaignButton} onPress={() => { setSelectedCampaign(campaign); setShowCampaignModal(true); }}>
                <Text style={styles.viewCampaignText}>View Campaign</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animatable.View>
      );
    }

    // Standard campaign card for non-explore view
    return (
      <Animatable.View
        key={campaign.id}
        animation="fadeInUp"
        duration={700}
        delay={index * 150} // Staggered animation
      >
        <TouchableOpacity 
          style={styles.campaignCard}
          onPress={() => Alert.alert('Campaign Details', `You selected: ${campaign.title}`)}
          activeOpacity={0.7}
        >
          <Image 
            source={imageSource} 
            style={styles.campaignImage}
            defaultSource={Platform.OS === 'android' ? imageMapping.mainpage : undefined}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.campaignTitle}>{campaign.title}</Text>
            <Text style={styles.campaignDesc}>{campaign.desc}</Text>
            {campaign.raised && (
              <Text style={styles.campaignDesc}>
                ETH {campaign.raised.toLocaleString()} of ETH {campaign.goal.toLocaleString()}
              </Text>
            )}
            <TouchableOpacity style={[styles.viewCampaignButton, {alignSelf: 'flex-start', marginTop: 8}]} onPress={() => { setSelectedCampaign(campaign); setShowCampaignModal(true); }}>
              <Text style={styles.viewCampaignText}>View Campaign</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animatable.View>
    );
  };  // Function to handle campaign creation
  const handleStartCampaign = () => {
    navigation.navigate('CampaignCreation');
  };
  
  // Function to handle exploring campaigns
  const handleExplore = () => {
    setShowExplore(true);
    setActiveTab('trending'); // Default to trending tab when opening explore
  };

  // Handle donate action (static / local state only)
  const handleDonate = () => {
    const amt = Number(donateAmount);
    if (!selectedCampaign || !amt || isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid donation amount');
      return;
    }
    const campaignId = selectedCampaign._id || selectedCampaign.id;

    // Prevent donating more than remaining required amount (if a numeric goal exists)
    try {
      const goalVal = selectedCampaign && selectedCampaign.goal !== undefined && selectedCampaign.goal !== null ? Number(selectedCampaign.goal) : Infinity;
      const raisedVal = selectedCampaign && selectedCampaign.raised !== undefined && selectedCampaign.raised !== null ? Number(selectedCampaign.raised) : 0;
      const remaining = isFinite(goalVal) ? Math.max(0, goalVal - raisedVal) : Infinity;
      if (remaining <= 0) {
        Alert.alert('Campaign fully funded', 'This campaign has already reached its goal.');
        return;
      }
      if (isFinite(remaining) && amt > remaining) {
        Alert.alert('Amount exceeds remaining target', `You can only donate up to ${remaining} ETH to this campaign.`);
        return;
      }
    } catch (e) {
      // If parsing fails, fall back to default behavior (allow donation)
      console.warn('Failed to validate donation amount against campaign goal', e);
    }

    (async () => {
      try {
        // Try updating on backend first
        const updatedRemote = await ApiService.updateCampaign(campaignId, { raised: (selectedCampaign.raised || 0) + amt });

        // If updated successfully, apply remote response to local state
        setTrendingCampaigns(prev => prev.map(c => (c._id === campaignId || c.id === campaignId) ? { ...c, raised: updatedRemote.raised } : c).filter(c => (c.raised || 0) < (c.goal || Infinity)));
        setUserCampaigns(prev => prev.map(c => (c._id === campaignId || c.id === campaignId) ? { ...c, raised: updatedRemote.raised } : c).filter(c => (c.raised || 0) < (c.goal || Infinity)));

        // If goal reached or exceeded, delete remotely and locally
        if ((updatedRemote.raised || 0) >= (updatedRemote.goal || Infinity)) {
          try {
            await ApiService.deleteCampaign(campaignId);
          } catch (e) {
            console.warn('Failed to delete campaign remotely', e);
          }
          setTrendingCampaigns(prev => prev.filter(c => !(c._id === campaignId || c.id === campaignId)));
          setUserCampaigns(prev => prev.filter(c => !(c._id === campaignId || c.id === campaignId)));
          // Congratulate donor locally
          try { Alert.alert('Thank you!', 'This donation completed the campaign.'); } catch (e) { /* ignore for web fallback */ }
        }

        // Reconciliation: remove any local override for this campaign since server accepted the change
        try {
          const overridesRaw = await AsyncStorage.getItem('campaignOverrides');
          const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
          if (overrides && (overrides[campaignId] || overrides[campaignId] === 0)) {
            delete overrides[campaignId];
            await AsyncStorage.setItem('campaignOverrides', JSON.stringify(overrides));
            setCampaignOverrides(overrides);
          }
        } catch (e) {
          console.warn('Failed to reconcile campaign override after remote update', e);
        }

      } catch (err) {
        console.warn('Remote update failed, falling back to local update', err);

        // Local fallback: update in-memory
        setTrendingCampaigns(prev => {
          const updated = prev.map(c => {
            if ((c.id && c.id === campaignId) || (c._id && c._id === campaignId)) {
              return { ...c, raised: (c.raised || 0) + amt };
            }
            return c;
          });
          return updated.filter(c => (c.raised || 0) < (c.goal || Infinity));
        });

        setUserCampaigns(prev => {
          const updated = prev.map(c => {
            if ((c.id && c.id === campaignId) || (c._id && c._id === campaignId)) {
              return { ...c, raised: (c.raised || 0) + amt };
            }
            return c;
          });
          // Determine if campaign reached its goal after local update
          try {
            const matching = updated.find(c => (c._id === campaignId || c.id === campaignId));
            if (matching && isFinite(matching.goal) && (matching.raised || 0) >= matching.goal) {
              try { Alert.alert('Thank you!', 'This donation completed the campaign.'); } catch (e) { }
            }
          } catch (e) { }
          return updated.filter(c => (c.raised || 0) < (c.goal || Infinity));
        });
      }
    })();

    // (donatedCampaigns is updated below once to avoid duplicates)

    // Persist campaign override (raised or deleted) so it survives reloads
    (async () => {
      try {
        const overridesRaw = await AsyncStorage.getItem('campaignOverrides');
        const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
        const current = overrides[campaignId] || {};
        const newRaised = (current.raised || selectedCampaign.raised || 0) + amt;
        if (newRaised >= (selectedCampaign.goal || Infinity)) {
          overrides[campaignId] = { deleted: true };
        } else {
          overrides[campaignId] = { ...current, raised: newRaised };
        }
        await AsyncStorage.setItem('campaignOverrides', JSON.stringify(overrides));
        setCampaignOverrides(overrides);
      } catch (e) {
        console.warn('Failed to persist campaign override', e);
      }
    })();

    // Add to donatedCampaigns for this user (avoid duplicates)
    setDonatedCampaigns(prev => {
      const exists = prev.some(c => (c.id && c.id === (selectedCampaign.id || selectedCampaign._id)) || (c._id && c._id === (selectedCampaign._id || selectedCampaign.id)));
      if (exists) return prev.map(c => {
        if ((c.id && c.id === selectedCampaign.id) || (c._id && c._id === selectedCampaign._id)) {
          return { ...c, raised: (c.raised || 0) + amt };
        }
        return c;
      });
      const newEntry = { ...(selectedCampaign || {}), raised: (selectedCampaign.raised || 0) + amt };
      const updated = [newEntry, ...prev];

      // Persist to AsyncStorage per-user if available
      (async () => {
        try {
          if (userProfile && (userProfile.id || userProfile._id)) {
            const key = `donatedCampaigns:${userProfile.id || userProfile._id}`;
            await AsyncStorage.setItem(key, JSON.stringify(updated));
          }
        } catch (e) {
          console.warn('Failed to persist donated campaigns', e);
        }
      })();

      return updated;
    });

    // Close modal and reset amount
    setShowCampaignModal(false);
    setSelectedCampaign(null);
    setDonateAmount('');
  };

  // Wallet helpers
  const connectWallet = async () => {
    // Web - injected provider (MetaMask)
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          setEthersProvider(provider);
          setEthersSigner(signer);
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
          setWalletProviderType('injected');
          setWalletModalOpen(false);
          return;
        }
      } catch (e) {
        console.warn('User rejected wallet connection or error occurred', e);
        Alert.alert('Wallet Connection Failed', 'Please allow the connection in your wallet.');
        return;
      }
    }

    // Mobile or no injected provider - show guidance
    Alert.alert('No Web3 Wallet Detected', 'Please install MetaMask (desktop) or connect using WalletConnect (mobile)');
  };

  const signTestMessage = async () => {
    if (!ethersSigner) {
      Alert.alert('No signer', 'Connect wallet first');
      return;
    }
    try {
      const msg = `Funderr test signature @ ${new Date().toISOString()}`;
      const signature = await ethersSigner.signMessage(msg);
      setSignedMessage(signature);
      Alert.alert('Signed', 'Message signed successfully');
    } catch (e) {
      console.warn('Signing failed', e);
      Alert.alert('Signing failed', 'Please approve the signing in your wallet.');
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletProviderType(null);
  };

  // Computed: remaining amount for the selected campaign (in ETH)
  const selectedRemaining = (() => {
    if (!selectedCampaign) return Infinity;
    const goalVal = selectedCampaign.goal !== undefined && selectedCampaign.goal !== null ? Number(selectedCampaign.goal) : Infinity;
    const raisedVal = selectedCampaign.raised !== undefined && selectedCampaign.raised !== null ? Number(selectedCampaign.raised) : 0;
    return isFinite(goalVal) ? Math.max(0, goalVal - raisedVal) : Infinity;
  })();

  // Is the Donate button currently disabled due to goal reached or input exceeding remaining?
  const donateExceedsRemaining = (() => {
    const amt = Number(donateAmount);
    if (!isFinite(selectedRemaining)) return false; // no limit
    // Only consider "exceeds remaining" when user has entered a valid numeric amount
    if (donateAmount === '' || donateAmount == null) return false;
    if (isNaN(amt)) return false;
    return amt > selectedRemaining;
  })();

  // Separate flag to determine if Donate button should be disabled (invalid input or exceeds remaining)
  const donateDisabled = (() => {
    const amt = Number(donateAmount);
    if (!donateAmount || donateAmount.trim() === '') return true; // require input
    if (isNaN(amt) || amt <= 0) return true; // invalid numeric
    if (isFinite(selectedRemaining) && amt > selectedRemaining) return true; // over limit
    return false;
  })();

  // Handler that clamps the entered donation amount to the remaining amount (if there is a limit)
  const handleDonateAmountChange = (val) => {
    // Allow empty string
    if (!val || val.trim() === '') {
      setDonateAmount('');
      return;
    }
    // Allow numeric input, but clamp to remaining when finite
    const parsed = Number(val);
    if (isNaN(parsed)) {
      // keep as-is to allow user to edit; validation prevents non-numeric donations
      setDonateAmount(val);
      return;
    }
    if (isFinite(selectedRemaining) && parsed > selectedRemaining) {
      setDonateAmount(String(selectedRemaining));
      return;
    }
    setDonateAmount(String(val));
  };
  
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);
  
  return (
  <View style={{flex: 1}}>
    
      {/* Only render Campaign History Modal and its container when showHistory is true */}
      {showHistory && (
        <View style={styles.modalBackdrop50}>
          <View style={styles.historyModal}>
            <Text style={styles.historyTitle}>Your Campaign History</Text>
            <ScrollView style={styles.historyScroll}>
              {userCampaigns.length === 0 ? (
                <Text>No campaigns found.</Text>
              ) : (
                userCampaigns.map(campaign => (
                  <View key={campaign._id} style={styles.historyItem}>
                    <Text style={styles.historyItemTitle}>{campaign.title}</Text>
                    <Text style={[styles.historyItemStatus, {color: campaign.status === 'pending' ? '#1976d2' : campaign.status === 'rejected' ? '#d32f2f' : '#388e3c'}]}>
                      {campaign.status.toUpperCase()}
                    </Text>
                    {campaign.status === 'rejected' && (
                      <TouchableOpacity onPress={() => {setSelectedReason(campaign.rejectionReason || 'No reason provided'); setShowReasonModal(true);}} style={styles.seeDetailsBtn}>
                        <Text style={styles.seeDetailsText}>See Details</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.historyCloseBtn} onPress={() => setShowHistory(false)}>
              <Text style={styles.historyCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Campaign View Modal */}
      {showCampaignModal && selectedCampaign && (
        <View style={styles.modalBackdrop}>
          <View style={styles.campaignModal}>
            <Image
              source={imageMapping[selectedCampaign.imageKey] || imageMapping.mainpage}
              style={styles.campaignModalImage}
              resizeMode="cover"
            />
            <Text style={styles.campaignModalTitle}>{selectedCampaign.title}</Text>
            <Text style={styles.campaignModalDesc}>{selectedCampaign.desc}</Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(100, ((selectedCampaign.raised||0) / (selectedCampaign.goal||1)) * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>Raised: ETH {selectedCampaign.raised || 0} / {selectedCampaign.goal || 'N/A'}</Text>
            </View>

            <TextInput
              placeholder='Enter amount to donate (ETH)'
              value={donateAmount}
              onChangeText={handleDonateAmountChange}
              keyboardType='numeric'
              style={styles.donateInput}
            />

            {/* Remaining and validation hints */}
            {isFinite(selectedRemaining) && (
              <Text style={styles.remainingText}>Remaining: {selectedRemaining} ETH</Text>
            )}
            {(donateAmount && !isNaN(Number(donateAmount)) && donateExceedsRemaining) && (
              <Text style={styles.errorText}>Amount exceeds remaining target</Text>
            )}

            <View style={styles.campaignModalActions}>
              <TouchableOpacity
                onPress={handleDonate}
                style={[styles.primaryBtn, donateDisabled && styles.primaryBtnDisabled]}
                disabled={donateDisabled}
              >
                <Text style={styles.primaryBtnText}>Donate to Campaign</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowCampaignModal(false); setSelectedCampaign(null); setDonateAmount(''); }} style={styles.closeLink}>
                <Text style={styles.closeLinkText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Wallet Modal */}
      {walletModalOpen && (
        <View style={styles.modalBackdrop}>
          <View style={styles.walletModal}>
            <Text style={styles.walletModalTitle}>Wallet Connection</Text>
            {walletConnected ? (
              <View>
                <Text style={styles.walletConnectedText}>Connected: {walletAddress}</Text>
                <TouchableOpacity onPress={() => { disconnectWallet(); setWalletModalOpen(false); }} style={styles.disconnectBtn}>
                  <Text style={styles.disconnectBtnText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.walletModalHelp}>Connect your web3 wallet to interact with blockchain features.</Text>
                <TouchableOpacity onPress={connectWallet} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Connect Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { Alert.alert('Mobile Wallet', 'Use WalletConnect-enabled wallets.'); }} style={styles.helpLink}>
                  <Text style={styles.helpLinkText}>Need help? Connect via WalletConnect (coming soon)</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => setWalletModalOpen(false)} style={styles.closeModalLink}>
              <Text style={styles.closeLinkText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Reason Modal */}
      {showReasonModal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.reasonModal}>
            <Text style={styles.reasonTitle}>Rejection Reason</Text>
            <Text style={styles.reasonText}>{selectedReason}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowReasonModal(false)}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <LinearGradient
        colors={['#667eea', '#764ba2', '#8469a0ff']}
        style={[styles.animatedGradient, {position: 'absolute', width: '100%', height: '100%'}]}
      />
      <View style={styles.glassOverlay} />
      <SafeAreaView style={[styles.safeArea, {flex: 1}]}>      {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            style={{ position: 'absolute', left: 0, marginLeft: 15, zIndex: 2 }}
          >
            <Ionicons name="home" size={32} color="#764ba2" style={{ backgroundColor: '#fff', borderRadius: 20, padding: 2, shadowColor: '#764ba2', shadowOpacity: 0.3, shadowRadius: 6 }} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>F</Text>
              </View>
              <Animatable.Text
                animation="fadeInDown"
                duration={1200}
                style={styles.logoTitleAnimated}
              >
                Funderr
              </Animatable.Text>
            </View>
          </View>
          {/* Admin Portal Button - visible only to admin users */}
          {userRole === 'admin' && (
            <TouchableOpacity
              style={{ position: 'absolute', right: 56, marginRight: 15, zIndex: 2, backgroundColor: '#feca57', borderRadius: 20, padding: 6 }}
              onPress={() => navigation.navigate('AdminPortal')}
            >
              <Ionicons name="shield-checkmark" size={28} color="#764ba2" />
            </TouchableOpacity>
          )}
          {/* Wallet connect button - only for donors and campaign creators */}
          {(userRole === 'donor' || userRole === 'campaign_creator') && (
            <TouchableOpacity
              style={{ position: 'absolute', right: 96, marginRight: 15, zIndex: 2 }}
              onPress={() => setWalletModalOpen(true)}
            >
              <Ionicons name="wallet" size={26} color={walletConnected ? '#2ecc71' : '#764ba2'} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ position: 'absolute', right: 0, marginRight: 15, zIndex: 2 }}
            onPress={handleProfileOpen}
          >
            <Ionicons name="person-circle" size={32} color="#222" />
          </TouchableOpacity>
        </View>
      
      <ScrollView 
        style={styles.mainScrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >{/* Hero Section without Background Image */}
      <View style={styles.heroOverlay}>
        <Animatable.Text 
          animation="fadeInDown" 
          duration={1200} 
          style={styles.heroTitle}
        >
          Welcome to Funderr
        </Animatable.Text>
        <Animatable.Text 
          animation="fadeInUp" 
          duration={1200} 
          delay={400}
          style={styles.heroSubtitle}
        >
          Empowering dreams through innovative crowdfunding. Connect with 
          supporters worldwide and transform your vision into reality.
        </Animatable.Text>
        <View style={styles.buttonContainer}>
          {userRole === 'campaign_creator' ? (
            <Animatable.View animation="fadeIn" duration={800} delay={800} style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
              <TouchableOpacity 
                style={styles.mainActionButton}
                onPress={handleStartCampaign}
              >
                <Text style={styles.mainActionButtonText}>Start Your Campaign</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainActionButton, {marginLeft: 12, backgroundColor: '#764ba2'}]}
                onPress={() => setShowHistory(true)}
              >
                <Text style={[styles.mainActionButtonText, {color:'#fff'}]}>Campaign History</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.mainActionButton, {marginLeft: 12, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#fff'}]}
                onPress={handleExplore}
              >
                <Text style={styles.mainActionButtonText}>Explore Campaigns</Text>
              </TouchableOpacity>
            </Animatable.View>
          ) : (
            <Animatable.View animation="fadeIn" duration={800} delay={1000}>
              <TouchableOpacity 
                style={[styles.mainActionButton, {backgroundColor: 'transparent', borderWidth: 2, borderColor: '#fff'}]}
                onPress={handleExplore}
              >
                <Text style={styles.mainActionButtonText}>Explore Campaigns</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}
        </View>
      </View>

      {/* Quote */}
      <View style={styles.quoteContainer}>
        <Text style={styles.quote}>"{CROWDFUNDING_QUOTE}"</Text>
      </View>

      {/* Only render campaigns section when showExplore is true, nothing otherwise */}
      {showExplore ? (
        <View style={styles.campaignsSection}>
          {/* Exploration view */}
          <View style={{position: 'relative', flex: 1, minHeight: 400, borderRadius: 24, overflow: 'hidden', marginBottom: 24}}>
            <LinearGradient
              colors={['#667eea', '#764ba2', '#8469a0ff']}
              style={{...StyleSheet.absoluteFillObject, zIndex: 0}}
            />
            <View style={{...StyleSheet.absoluteFillObject, zIndex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 24, borderWidth: 0, shadowColor: '#fff', shadowOpacity: 0.08, shadowRadius: 24}} />
            <View style={[styles.exploreContainer, {zIndex: 2, backgroundColor: 'transparent'}]}>
            <View style={styles.exploreHeader}>
              <Animatable.Text animation="fadeInDown" duration={900} style={[styles.exploreTitle, {color: '#fff', textShadowColor: '#764ba2', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 8}]}>Explore Campaigns</Animatable.Text>
              <TouchableOpacity 
                style={styles.closeExploreBtn}
                onPress={() => setShowExplore(false)}
              >
                <Ionicons name="close-circle" size={28} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
              {/* Search Bar in Explore View */}
            <Animatable.View 
              style={styles.searchContainer}
              animation="fadeIn"
              duration={500}
            >
              <Ionicons name="search" size={22} color="#ff6b6b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title, description or category..."
                placeholderTextColor="#764ba2"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {search.trim() !== '' && (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchButton}>
                  <Ionicons name="close-circle" size={18} color="#9370DB" />
                </TouchableOpacity>
              )}
            </Animatable.View>
              {/* Search Results Count */}
            {search.trim() !== '' && (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.searchResultsText}>
                  {activeTab === 'trending' 
                    ? trendingCampaigns.filter(campaign => 
                        campaign.title.toLowerCase().includes(search.toLowerCase()) ||
                        (campaign.description ? campaign.description.toLowerCase().includes(search.toLowerCase()) : false) ||
                        campaign.category.toLowerCase().includes(search.toLowerCase())
                      ).length 
                    : donatedCampaigns.filter(campaign => 
                        campaign.title.toLowerCase().includes(search.toLowerCase()) ||
                        (campaign.description ? campaign.description.toLowerCase().includes(search.toLowerCase()) : false) ||
                        campaign.category.toLowerCase().includes(search.toLowerCase())
                      ).length
                  } results found for "{search}"
                </Text>
              </View>
            )}
            
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
                onPress={() => setActiveTab('trending')}
              >
                <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>Trending Campaigns</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'donated' && styles.activeTab]}
                onPress={() => setActiveTab('donated')}
              >
                <Text style={[styles.tabText, activeTab === 'donated' && styles.activeTabText]}>Donated Campaigns</Text>
              </TouchableOpacity>
            </View>
              {/* Show either trending campaigns in grid or donated campaigns based on active tab */}
            {activeTab === 'trending' ? (
              <View style={styles.exploreCampaignsList}>
                {trendingCampaigns
                  .filter(campaign => 
                    search.trim() === '' || 
                    campaign.title.toLowerCase().includes(search.toLowerCase()) ||
                    campaign.description.toLowerCase().includes(search.toLowerCase()) ||
                    campaign.category.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((campaign, index) => renderCampaignCard(campaign, index, true))}
                {trendingCampaigns.filter(campaign => 
                  search.trim() !== '' && 
                  !campaign.title.toLowerCase().includes(search.toLowerCase()) &&
                  !campaign.description.toLowerCase().includes(search.toLowerCase()) &&
                  !campaign.category.toLowerCase().includes(search.toLowerCase())
                ).length === trendingCampaigns.length && (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No campaigns found matching "{search}"</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.exploreCampaignsList}>
                {donatedCampaigns && donatedCampaigns.length > 0 ? (
                  donatedCampaigns
                    .filter(campaign => search.trim() === '' || campaign.title.toLowerCase().includes(search.toLowerCase()) || campaign.description.toLowerCase().includes(search.toLowerCase()) || campaign.category.toLowerCase().includes(search.toLowerCase()))
                    .map((campaign, index) => renderCampaignCard(campaign, index, true))
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>You haven't donated to any campaigns yet.</Text>
                  </View>
                )}
              </View>
            )}
            </View>
          </View>
        </View>
      ) : null}
      {showProfile && (
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModal}>
            <TouchableOpacity style={styles.closeProfileBtn} onPress={() => setShowProfile(false)}>
              <Ionicons name="close" size={24} color="#9370DB" />
            </TouchableOpacity>
            
            {profileLoading ? (
              <View style={styles.profileLoadingContainer}>
                <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.profileLoadingText}>
                  Loading Profile...
                </Animatable.Text>
              </View>
            ) : profileError ? (
              <View style={styles.profileErrorContainer}>
                <MaterialIcons name="error-outline" size={40} color="#f44336" />
                <Text style={styles.profileErrorText}>{profileError}</Text>
              </View>
            ) : userProfile ? (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.profileScrollView}>
                <Animatable.View animation="fadeIn" duration={500} style={styles.profileContent}>
                  <Image 
                    source={userProfile.avatar || imageMapping.roleSelection} 
                    style={styles.profileAvatar}
                    defaultSource={imageMapping.roleSelection}
                  />
                  
                  <Animatable.Text animation="fadeInUp" delay={100} style={styles.profileName}>
                    {userProfile.name || userProfile.fullName || 'User'}
                  </Animatable.Text>
                  
                  <View style={styles.profileRoleBadge}>
                    <MaterialIcons 
                      name={userProfile.role === 'donor' ? 'favorite' : 'campaign'} 
                      size={16} 
                      color="#fff" 
                      style={styles.profileRoleIcon} 
                    />
                    <Text style={styles.profileRoleText}>
                      {userProfile.role === 'donor' ? 'Donor' : 'Campaign Creator'}
                    </Text>
                  </View>
                  
                  <Animatable.View animation="fadeInUp" delay={200} style={styles.profileDetailSection}>
                    <Text style={styles.profileLabel}>Email:</Text>
                    <Text style={styles.profileValue}>{userProfile.email}</Text>
                  
                    {userProfile.phone && (
                      <>
                        <Text style={styles.profileLabel}>Phone:</Text>
                        <Text style={styles.profileValue}>{userProfile.phone}</Text>
                      </>
                    )}
                    
                    {userProfile.address && (
                      <>
                        <Text style={styles.profileLabel}>Address:</Text>
                        <Text style={styles.profileValue}>{userProfile.address}</Text>
                      </>
                    )}
                    
                    {userProfile.organization && (
                      <>
                        <Text style={styles.profileLabel}>Organization:</Text>
                        <Text style={styles.profileValue}>{userProfile.organization}</Text>
                      </>
                    )}
                    
                    {userProfile.role === 'donor' && userProfile.paymentMethods && (
                      <>
                        <Text style={styles.profileLabel}>Payment Methods:</Text>
                        <Text style={styles.profileValue}>{userProfile.paymentMethods}</Text>
                      </>
                    )}
                    
                    {userProfile.role === 'campaign' && userProfile.campaignCount && (
                      <>
                        <Text style={styles.profileLabel}>Campaigns Created:</Text>
                        <Text style={styles.profileValue}>{userProfile.campaignCount}</Text>
                      </>
                    )}
                  </Animatable.View>
                  
                  <TouchableOpacity 
                    style={styles.logoutButton} 
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="logout" size={18} color="#fff" style={{marginRight: 8}} />
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                  </TouchableOpacity>
                </Animatable.View>
              </ScrollView>
            ) : (
              <View style={styles.profileErrorContainer}>
                <Text style={styles.profileErrorText}>No profile found</Text>
              </View>
            )}
          </View>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
    </View>
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
    backgroundColor: 'transparent',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },  noResultsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  searchResultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  searchResultsText: {
  mainActionButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    marginHorizontal: 8,
    marginBottom: 16,
    minWidth: 180,
    alignItems: 'center',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#feca57',
  },
  mainActionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 1,
    textShadowColor: '#ff6b6b',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  animatedGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 0,
    borderWidth: 0,
    shadowColor: '#fff',
    shadowOpacity: 0.1,
    shadowRadius: 40,
  },
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9370DB', // Purple color
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoTitle: {
    display: 'none',
  },
  logoTitleAnimated: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#764ba2',
    textAlign: 'center',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
    marginVertical: 8,
    flexShrink: 1,
  },
  startCampaignButton: {
    backgroundColor: '#C19A6B', // Bronze-gold color
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startCampaignText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  heroBackground: {
    // No longer used, background image removed
    display: 'none',
  },
  heroOverlay: {
    minHeight: height * 0.45,
    width: '100%',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(147, 112, 219, 0.10)',
    borderRadius: 32,
    shadowColor: '#fff',
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },  mainActionButton: {
    backgroundColor: '#9370DB', // Purple color for the Start Your Campaign button
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    marginHorizontal: 8,
    marginBottom: 16,
    minWidth: 180,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  mainActionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },  quoteContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#9370DB', // Purple color for quote background
  },
  quote: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },  campaignsSection: {
    backgroundColor: '#f7f9fc',
    paddingVertical: 8,
    marginTop: 8,
    minHeight: 0,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9370DB',
    textAlign: 'center',
    opacity: 0.7,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#9370DB', // Purple color
  },
  profileIconContainer: {
    backgroundColor: '#f0eaff',
    borderRadius: 20,
    padding: 6,
    marginLeft: 8,
    elevation: 2,
  },  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(147, 112, 219, 0.08)',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffffff',
    backgroundColor: 'transparent',
  },
  clearSearchButton: {
    padding: 4,
  },tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#e6e8fa',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#9370DB', // Purple color
  },
  tabText: {
    fontSize: 16,
    color: '#9370DB', // Purple color
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  campaignsList: {
    flex: 1,
    marginHorizontal: 20,
  },  campaignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#9370DB', // Purple color
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  campaignImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 16,
    resizeMode: 'cover',
    backgroundColor: '#e6e8fa',
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9370DB', // Purple color
    marginBottom: 4,
  },  campaignDesc: {
    fontSize: 14,
    color: '#555',
  },
  fundingText: {
    fontSize: 12,
    color: '#9370DB',
    fontWeight: '600',
    marginTop: 4,
  },
  // Explore view styles
  exploreContainer: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    padding: 10,
    paddingBottom: 20,
  },
  exploreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  exploreTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#9370DB',
  },
  closeExploreBtn: {
    padding: 5,
  },
  exploreCampaignsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  exploreCardContainer: {
    width: '48%',
    marginBottom: 15,
  },
  exploreCard: {
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  exploreCardBg: {
    height: 120,
    width: '100%',
  },
  exploreCardOverlay: {
    flex: 1,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9370DB',
  },
  exploreCardContent: {
    padding: 10,
  },
  exploreCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9370DB',
    marginBottom: 2,
  },
  exploreCardDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  fundingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  fundingAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  fundingGoal: {
    fontSize: 13,
    color: '#777',
    marginLeft: 5,
  },  viewCampaignButton: {
    backgroundColor: '#9370DB', // Changed to purple
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  viewCampaignText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',  },
  profileModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147, 112, 219, 0.3)', // Purple color with opacity
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileModal: {
    width: 320,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#9370DB', // Purple color
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(147, 112, 219, 0.3)',
  },
  profileScrollView: {
    width: '100%',
    maxHeight: '100%',
  },
  profileContent: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  closeProfileBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: 'rgba(147, 112, 219, 0.1)',
    padding: 6,
    borderRadius: 20,
  },
  profileLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  profileLoadingText: {
    fontSize: 18,
    color: '#9370DB',
    fontWeight: '600',
  },
  profileErrorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  profileErrorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    marginTop: 16,
    borderWidth: 3,
    borderColor: '#9370DB', // Purple color
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9370DB', // Purple color
    marginBottom: 8,
    textAlign: 'center',
  },
  profileRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9370DB',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  profileRoleIcon: {
    marginRight: 4,
  },
  profileRoleText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  profileDetailSection: {
    width: '100%',
    paddingTop: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(147, 112, 219, 0.2)',
  },
  profileLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontWeight: '600',
  },
  profileValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#9370DB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  }
});

// NOTE: styles added below by patch - keep grouped for readability
const extraStyles = StyleSheet.create({
  modalBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 200
  },
  modalBackdrop50: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', zIndex: 99, width: '50%', margin: 'auto'
  },
  historyModal: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%'
  },
  historyTitle: { fontWeight: 'bold', fontSize: 20, color: '#764ba2', marginBottom: 16 },
  historyScroll: { maxHeight: 300 },
  historyItem: { marginBottom: 14, padding: 10, borderRadius: 8, backgroundColor: '#f7f7f7' },
  historyItemTitle: { fontWeight: 'bold' },
  historyItemStatus: { fontWeight: 'bold' },
  seeDetailsBtn: { marginTop: 6, backgroundColor: '#feca57', borderRadius: 6, padding: 6, alignSelf: 'flex-start' },
  seeDetailsText: { color: '#764ba2' },
  historyCloseBtn: { marginTop: 18, backgroundColor: '#764ba2', borderRadius: 8, padding: 10, alignSelf: 'center' },
  historyCloseText: { color: '#fff' },

  campaignModal: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '90%', maxWidth: 520 },
  campaignModalImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  campaignModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#764ba2', marginBottom: 6 },
  campaignModalDesc: { color: '#333', marginBottom: 10 },
  progressContainer: { width: '100%', marginBottom: 10 },
  progressTrack: { height: 14, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#9370DB' },
  progressText: { textAlign: 'center', marginTop: 6, color: '#764ba2' },
  donateInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, marginBottom: 12 },
  campaignModalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  primaryBtn: { backgroundColor: '#9370DB', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold' },
  closeLink: { padding: 8 },
  closeLinkText: { color: '#764ba2' },

  remainingText: { fontSize: 13, color: '#333', marginBottom: 6 },
  errorText: { fontSize: 13, color: '#d32f2f', marginBottom: 6 },
  primaryBtnDisabled: { backgroundColor: '#bba8df', opacity: 0.7 },

  walletModal: { backgroundColor: '#fff', borderRadius: 12, padding: 18, width: '85%', maxWidth: 420 },
  walletModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#764ba2', marginBottom: 8 },
  walletConnectedText: { marginBottom: 8 },
  disconnectBtn: { backgroundColor: '#f44336', padding: 10, borderRadius: 8 },
  disconnectBtnText: { color: '#fff' },
  walletModalHelp: { marginBottom: 10 },
  helpLink: { padding: 8 },
  helpLinkText: { color: '#764ba2' },
  closeModalLink: { marginTop: 12, alignSelf: 'flex-end' },

  reasonModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' },
  reasonTitle: { fontWeight: 'bold', fontSize: 18, color: '#d32f2f', marginBottom: 12 },
  reasonText: { color: '#222', marginBottom: 12 },
});

// Merge extraStyles into styles object by copying properties so existing code can reference styles.* uniformly
Object.assign(styles, extraStyles);

export default UserInterface;
