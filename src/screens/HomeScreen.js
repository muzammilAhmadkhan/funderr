import React, { useLayoutEffect, useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  StatusBar
} from 'react-native';
import { MaterialIcons, Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

// Use useWindowDimensions hook instead of static dimensions to respond to orientation changes
import { useWindowDimensions } from 'react-native';

export default function HomeScreen({ navigation }) {
  // Get dynamic window dimensions for better responsiveness
  const { width, height } = useWindowDimensions();
  
  // Professional crowdfunding stats
  const [stats, setStats] = useState({
    totalRaised: 0,
    activeCampaigns: 0,
    successfulProjects: 0
  });
  
  // Animation references
  const logoRef = useRef(null);
  const titleRef = useRef(null);
  const heroRef = useRef(null);
  const statsRefs = [useRef(null), useRef(null), useRef(null)];
  const featureRefs = [useRef(null), useRef(null), useRef(null)];
  const buttonRef = useRef(null);
  
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);
  
  useEffect(() => {
    // Sequence animations with timing
    const animationDelay = 300;
    
    setTimeout(() => {
      logoRef.current?.fadeIn(1000);
    }, animationDelay);
    
    setTimeout(() => {
      titleRef.current?.fadeInDown(800);
    }, animationDelay + 400);
    
    setTimeout(() => {
      heroRef.current?.fadeIn(800);
    }, animationDelay + 800);
    
    // Animate stats with staggered effect
    statsRefs.forEach((ref, index) => {
      setTimeout(() => {
        ref.current?.fadeInUp(800);
      }, animationDelay + 1200 + (index * 200));
    });
    
    // Animate features
    featureRefs.forEach((ref, index) => {
      setTimeout(() => {
        ref.current?.fadeInUp(800);
      }, animationDelay + 2000 + (index * 300));
    });
    
    setTimeout(() => {
      buttonRef.current?.pulse(1000);
    }, animationDelay + 3200);

    // Simulate real crowdfunding stats
    const interval = setInterval(() => {
      setStats(prev => ({
        totalRaised: prev.totalRaised + Math.floor(Math.random() * 50) + 10,
        activeCampaigns: Math.floor(Math.random() * 500) + 1200,
        successfulProjects: Math.floor(Math.random() * 50) + 850
      }));
    }, 5000);

    // Initial stats
    setStats({
      totalRaised: 2547830,
      activeCampaigns: 1247,
      successfulProjects: 892
    });

    return () => clearInterval(interval);
  }, []);
  
  const showHelp = () => {
    Alert.alert('Help & Support', 'Need assistance? Contact our support team at support@funderr.com or browse our FAQ section.');
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Colorful Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#667eea']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Animatable.View 
            ref={logoRef} 
            animation="fadeIn" 
            duration={1000} 
            delay={300} 
            style={styles.logoContainer}
          >
            <LinearGradient
              colors={['#ff6b6b', '#feca57', '#48dbfb']}
              style={styles.logoCircle}
            >
              <MaterialIcons name="volunteer-activism" size={28} color="white" />
            </LinearGradient>
          </Animatable.View>
          
          <Animatable.Text 
            ref={titleRef}
            animation="fadeInDown" 
            duration={800} 
            delay={700}
            style={styles.headerTitle}
          >
            Funderr
          </Animatable.Text>
          
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={showHelp} style={styles.helpButton}>
              <MaterialIcons name="help-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animatable.View
          ref={heroRef}
          animation="fadeIn" 
          duration={800} 
          delay={1100}
          style={styles.heroSection}
        >
          <LinearGradient
            colors={['#ff9a9e', '#fecfef', '#fecfef']}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Image 
                source={{
                  uri: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
                }}
                style={styles.heroImage}
                defaultSource={{uri: 'https://via.placeholder.com/400x200/2E86AB/ffffff?text=Crowdfunding'}}
              />
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>
                  Fund Dreams.{'\n'}Change Lives.
                </Text>
                <Text style={styles.heroSubtitle}>
                  Connect with meaningful projects and make a lasting impact through secure, transparent crowdfunding.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Live Stats Section */}
        <LinearGradient
          colors={['#a8edea', '#fed6e3']}
          style={styles.statsSection}
        >
          <Text style={styles.sectionTitle}>Platform Impact</Text>
          <View style={styles.statsContainer}>
            <Animatable.View 
              ref={statsRefs[0]}
              animation="fadeInUp"
              duration={800}
              delay={1400}
              style={styles.statCard}
            >
              <LinearGradient
                colors={['#56ab2f', '#a8e6cf']}
                style={styles.statIcon}
              >
                <MaterialIcons name="attach-money" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.statValue}>${formatNumber(stats.totalRaised)}</Text>
              <Text style={styles.statLabel}>Total Raised</Text>
            </Animatable.View>

            <Animatable.View 
              ref={statsRefs[1]}
              animation="fadeInUp"
              duration={800}
              delay={1600}
              style={styles.statCard}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.statIcon}
              >
                <MaterialIcons name="campaign" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.statValue}>{formatNumber(stats.activeCampaigns)}</Text>
              <Text style={styles.statLabel}>Active Campaigns</Text>
            </Animatable.View>

            <Animatable.View 
              ref={statsRefs[2]}
              animation="fadeInUp"
              duration={800}
              delay={1800}
              style={styles.statCard}
            >
              <LinearGradient
                colors={['#ff9a9e', '#fad0c4']}
                style={styles.statIcon}
              >
                <MaterialIcons name="celebration" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.statValue}>{formatNumber(stats.successfulProjects)}</Text>
              <Text style={styles.statLabel}>Success Stories</Text>
            </Animatable.View>
          </View>
        </LinearGradient>
          
        {/* Features Section */}
        <LinearGradient
          colors={['#ffecd2', '#fcb69f']}
          style={styles.featuresSection}
        >
          <Text style={styles.sectionTitle}>Why Choose Funderr?</Text>
          
          <Animatable.View 
            ref={featureRefs[0]}
            animation="fadeInUp"
            duration={800}
            delay={2000}
            style={styles.featureCard}
          >
            <View style={styles.featureHeader}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.featureIcon}
              >
                <MaterialIcons name="verified-user" size={28} color="white" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Secure & Verified</Text>
            </View>
            <Text style={styles.featureText}>
              Every campaign is thoroughly vetted. All transactions are encrypted and protected by blockchain technology.
            </Text>
          </Animatable.View>

          <Animatable.View 
            ref={featureRefs[1]}
            animation="fadeInUp"
            duration={800}
            delay={2300}
            style={styles.featureCard}
          >
            <View style={styles.featureHeader}>
              <LinearGradient
                colors={['#ff9a9e', '#fecfef']}
                style={styles.featureIcon}
              >
                <MaterialIcons name="analytics" size={28} color="white" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Full Transparency</Text>
            </View>
            <Text style={styles.featureText}>
              Track exactly how your contributions are used with real-time updates and detailed progress reports.
            </Text>
          </Animatable.View>

          <Animatable.View 
            ref={featureRefs[2]}
            animation="fadeInUp"
            duration={800}
            delay={2600}
            style={styles.featureCard}
          >
            <View style={styles.featureHeader}>
              <LinearGradient
                colors={['#56ab2f', '#a8e6cf']}
                style={styles.featureIcon}
              >
                <MaterialIcons name="groups" size={28} color="white" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Community Driven</Text>
            </View>
            <Text style={styles.featureText}>
              Join a community of changemakers. Connect with project creators and fellow supporters worldwide.
            </Text>
          </Animatable.View>
        </LinearGradient>
        
        {/* Call to Action */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.ctaSection}
        >
          <Animatable.View 
            ref={buttonRef}
            animation="pulse" 
            easing="ease-out"
            iterationCount={1}
            duration={1000}
            delay={3200}
          >
            <TouchableOpacity 
              style={styles.ctaButton} 
              onPress={() => navigation.navigate('SignIn')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ff6b6b', '#feca57']}
                style={styles.ctaButtonGradient}
              >
                <Text style={styles.ctaButtonText}>Start Funding Dreams</Text>
                <MaterialIcons name="arrow-forward" size={22} color="white" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.ctaSubtext}>
              Join thousands of supporters making a difference
            </Text>
          </Animatable.View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },

  // Header Section
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  logoContainer: {
    marginRight: 12,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerRight: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Body Section
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // Hero Section
  heroSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  heroGradient: {
    padding: 0,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroImage: {
    width: '40%',
    height: 180,
    resizeMode: 'cover',
  },
  heroTextContainer: {
    flex: 1,
    padding: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
    fontWeight: '500',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 25,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginTop: 10,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  featureText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 25,
    marginLeft: 78,
    fontWeight: '400',
  },

  // Call to Action Section
  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    marginTop: 10,
  },
  ctaButton: {
    borderRadius: 30,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  ctaButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 260,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  ctaSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
