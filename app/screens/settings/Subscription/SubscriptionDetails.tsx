

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../Navigations/RootStackParamList';
import { GlobalStyleSheet } from '../../../constants/styleSheet';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../../layout/Header';
import { IMAGES } from '../../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type SubscriptionDetailsProps = StackScreenProps<RootStackParamList, 'SubscriptionDetails'>;

const SubscriptionDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { plan } = route.params as { plan: any }; // Plan details passed from Settings
  const theme = useTheme();
  const { colors } = theme;
  const [userToken, setUserToken] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
  const [popupMessage, setPopupMessage] = useState(''); // Message for the popup
  const [popupSubtitle, setPopupSubtitle] = useState(''); // Subtitle for the popup
  const [isCancelConfirm, setIsCancelConfirm] = useState(false); // State to track cancel confirmation
  const fadeAnim = useState(new Animated.Value(0))[0]; // Animation value for fade and position

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        console.log('Fetched userToken:', token);
        setUserToken(token);
      } catch (error) {
        console.error('Error fetching userToken:', error);
        setPopupMessage('Error!');
        setPopupSubtitle('Failed to retrieve authentication token');
        setShowPopup(true);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (showPopup) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsCancelConfirm(false)); // Reset isCancelConfirm when animation ends
    }
  }, [showPopup, fadeAnim]);

  // Function to format date to MM/DD/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  // Format duration from durationDays
  const formatDuration = (durationDays: number) => {
    if (!durationDays) return 'N/A';
    return `${durationDays} days`;
  };

  // Function to handle cancel subscription
  const handleCancelSubscription = () => {
    console.log('Plan object:', plan);
    console.log('Sending subscriptionId:', plan.id);

    if (!plan.id) {
      setPopupMessage('Error!');
      setPopupSubtitle('Subscription ID is missing');
      setShowPopup(true);
      return;
    }

    if (!userToken) {
      setPopupMessage('Error!');
      setPopupSubtitle('Authentication token is missing');
      setShowPopup(true);
      return;
    }

    setPopupMessage('Confirm Cancellation');
    setPopupSubtitle('Are you sure you want to cancel your subscription?');
    setIsCancelConfirm(true);
    setShowPopup(true);
  };

  // Handle popup button press
  const handlePopupAction = async () => {
    if (isCancelConfirm) {
      try {
        const response = await fetch('http://192.168.1.42:5000/api/user/cancel/subscription', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            subscriptionId: plan.id,
          }),
        });

        const data = await response.json();
        console.log('Cancel API Response:', data);

        if (response.ok) {
          setPopupMessage('Success');
          setPopupSubtitle(data.message);
          setIsCancelConfirm(false);
          setShowPopup(true);
          setTimeout(() => {
            navigation.goBack();
          }, 1000); // Delay navigation to show success message
        } else {
          setPopupMessage('Error!');
          setPopupSubtitle(data.message || 'Failed to cancel subscription');
          setIsCancelConfirm(false);
          setShowPopup(true);
        }
      } catch (error) {
        console.error('Cancel Subscription Error:', error);
        setPopupMessage('Error!');
        setPopupSubtitle(`An error occurred: ${error.message || 'Unknown error'}`);
        setIsCancelConfirm(false);
        setShowPopup(true);
      }
    } else {
      setShowPopup(false);
    }
  };

  // Custom Popup Component
  const Popup = () => (
    <Animated.View style={[styles.popupOverlay, {
      opacity: fadeAnim,
      transform: [{
        translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0] // Slide from 300 (bottom) to 0 (top)
        })
      }]
    }]}>
      <View style={styles.popupContainer}>
        <Image
          source={IMAGES.bugrepellent} // Replace with your character image
          style={styles.popupImage}
        />
        <Text style={styles.popupTitle}>{popupMessage}</Text>
        <Text style={styles.popupSubtitle}>{popupSubtitle}</Text>
        {isCancelConfirm ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.popupButton, { flex: 1, marginRight: 10 }]} onPress={handlePopupAction}>
              <Text style={styles.popupButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.popupButton, { flex: 1, backgroundColor: '#ccc' }]} onPress={() => setShowPopup(false)}>
              <Text style={[styles.popupButtonText, { color: '#333' }]}>No</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.popupButton} onPress={handlePopupAction}>
            <Text style={styles.popupButtonText}>Let's Go</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <Header title="Subscription Details" />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.yourPlanText, { color: colors.title }]}>Your Plan</Text>
          <View style={styles.planHeader}>
            <Image
              style={styles.planIcon}
              source={IMAGES.crown} // Replace with your crown icon or appropriate image
            />
            <View style={styles.currentPlanBadge}>
              <Text style={[styles.planName, { color: '#000' }]}>Current Plan</Text>
            </View>
          </View>
          <View style={styles.detailContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Cost</Text>
            <Text style={[styles.value, { color: colors.title }]}>₹{Math.ceil(plan.price / 30)}/month</Text>
          </View>
          <View style={styles.detailContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Duration</Text>
            <Text style={[styles.value, { color: colors.title }]}>{formatDuration(plan.duration)}</Text>
          </View>
          <View style={styles.detailContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Next Billing Date</Text>
            <Text style={[styles.value, { color: colors.title }]}>{formatDate(plan.endDate)}</Text>
          </View>
          <View style={styles.subscriptionDetailsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription}>
              <Text style={styles.cancelButtonText}>Cancel subscription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {showPopup && <Popup />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.09,
    alignItems: 'center',
  },
  card: {
    width: '95%',
    borderRadius: 12,
    padding: width * 0.05,
    marginBottom: height * 0.07,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  yourPlanText: {
    fontSize: width * 0.045,
    fontWeight: '600',
    marginBottom: height * 0.02,
    textAlign: 'left',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: height * 0.03,
  },
  planIcon: {
    width: width * 0.12,
    height: width * 0.12,
  },
  currentPlanBadge: {
    backgroundColor: '#d4edbcff',
    borderRadius: 20,
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.03,
  },
  planName: {
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  detailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.025,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  label: {
    fontSize: width * 0.042,
    fontWeight: '500',
    color: '#666',
  },
  value: {
    fontSize: width * 0.042,
    fontWeight: '600',
    maxWidth: width * 0.5, // Prevent overflow for long text
  },
  subscriptionDetailsContainer: {
    paddingVertical: height * 0.03,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: height * 0.03,
  },
  cancelButton: {
    backgroundColor: '#e84253ff',
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: width * 0.042,
    fontWeight: '600',
    color: '#fff',
  },
  popupOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    elevation: 10,
  },
  popupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  popupSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  popupButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  popupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
});

export default SubscriptionDetails;