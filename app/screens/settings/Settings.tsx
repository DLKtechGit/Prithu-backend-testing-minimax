import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, IMAGES } from '../../constants/theme';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import api from '../../../apiInterpretor/apiInterceptor';
import { StyleSheet } from 'react-native';

type SettingsScreenProps = StackScreenProps<RootStackParamList, 'Settings'>;

const SettingData = [
  // {
  //   id: "section1",
  //   image: IMAGES.user,
  //   text: "Account Type",
  //   navigate: 'AccountType'
  // },
  {
    id: "1",
    image: IMAGES.bell,
    text: "Notification",
    navigate: 'SettingNotification'
  },
  {
    id: "2",
    image: IMAGES.verified,
    text: "Security",
    navigate: 'Security'
  },
  {
    id: "3",
    image: IMAGES.usename,
    text: "Account",
    navigate: 'Account'
  },
  {
    id: "4",
    image: IMAGES.about,
    text: "About",
    navigate: 'About'
  },
  {
    id: "5",
    image: IMAGES.save,
    text: "Save",
    navigate: 'Save'
  },
  {
    id: "6",
    image: IMAGES.components,
    text: "Feed",
    navigate: 'feed'
  },
  {
    id: "7",
    image: IMAGES.theme,
    text: "Theme",
    navigate: 'Theme'
  },
  {
    id: "8",
    image: IMAGES.payment,
    text: "Payment",
    navigate: 'Theme'
  },
  {
    id: "9",
    image: IMAGES.Referrals,
    text: "Referrals Dashboard",
    navigate: 'Friend'
  },
  {
    id: "10",
    image: IMAGES.Sub,
    text: "Subscription",
    navigate: 'Subcribe'
  },
  {
    id: "11",
    image: IMAGES.Invite,
    text: "Invite Friends",
    navigate: 'Invite'
  },
  {
    id: "12",
    image: IMAGES.logout,
    text: "Log out",
    isLogout: true
  },
];

const Settings = ({ navigation }: SettingsScreenProps) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
  const [popupMessage, setPopupMessage] = useState(''); // Message for the popup
  const [popupSubtitle, setPopupSubtitle] = useState(''); // Subtitle for the popup
  const [isLogoutConfirm, setIsLogoutConfirm] = useState(false); // State to track logout confirmation
  const fadeAnim = useState(new Animated.Value(0))[0]; // Animation value for fade and position

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
      }).start(() => setIsLogoutConfirm(false)); // Reset isLogoutConfirm when animation ends
    }
  }, [showPopup, fadeAnim]);

  const handleLogout = async () => {
    setPopupMessage('Logout');
    setPopupSubtitle('Are you sure you want to logout?');
    setIsLogoutConfirm(true);
    setShowPopup(true);
  };

  const handleItemPress = async (item: any) => {
    if (item.isLogout) {
      handleLogout();
    } else if (item.text === "Subscription") {
      try {
        // Fetch user token
        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
          console.log('No userToken found, navigating to Login');
          setPopupMessage('Error!');
          setPopupSubtitle('You must be logged in to check subscription.');
          setShowPopup(true);
          navigation.navigate('Login');
          return;
        }

        // Check subscription status
        const res = await fetch('http://192.168.1.10:5000/api/user/user/subscriptions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
        });

        const data = await res.json();
        console.log('Subscription status response:', data.plan._id);
    

        if (res.ok && data.plan && data.plan.isActive === true) {
          // User has an active subscription, navigate to SubscriptionDetails
          console.log('Active subscription found, navigating to SubscriptionDetails');
          navigation.navigate('SubscriptionDetails', {
            plan: {
              id: data.plan._id,
              name: data.plan.planId.name || 'Premium Plan',
              price: data.plan.planId.price,
              duration: data.plan.planId.durationDays || 'Unknown',
              userName: data.plan.userId.name || 'Unknown',
              userEmail: data.plan.userId.email || 'Unknown',
              startDate: data.plan.startDate || 'N/A',
              endDate: data.plan.endDate || 'N/A',
            },
          });
        } else {
          // No active subscription (isActive: false or no plan), navigate to Subcribe
          console.log('No active subscription (isActive: false or no plan), navigating to Subcribe');
          navigation.navigate('Subcribe');
        }
      } catch (error) {
        navigation.navigate('Subcribe');
      }
    } else {
      navigation.navigate(item.navigate as keyof RootStackParamList);
    }
  };

  // Handle popup button press
  const handlePopupAction = async () => {
    if (isLogoutConfirm) {
      try {
        // Get sessionId, deviceId, and token from storage
        const sessionId = await AsyncStorage.getItem("sessionId");
        const deviceId = await AsyncStorage.getItem("deviceId");
        const token = await AsyncStorage.getItem("userToken");
        const userId = await AsyncStorage.getItem("userId");

        // // 🔥 Call backend logout with body + headers
        // await api.post(
        //   "/api/user/logout",
        //   { sessionId, deviceId },
        //   {
        //     headers: {
        //       Authorization: `Bearer ${token}`,
        //     },
        //   }
        // );

        // Stop heartbeat & disconnect socket (optional but recommended)
        // stopHeartbeat();
        // disconnectSocket();

        // Clear all storage
        await AsyncStorage.multiRemove([
          "userToken",
          "refreshToken",
          "sessionId",
          "deviceId",
          "userId",
          "AppLanguage",
          "FeedLanguage",
          "hasInterestedCategory",
          "userId"
        ]);

        // Navigate to login
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      } catch (e) {
        console.error("Failed to logout", e);
        setPopupMessage('Error!');
        setPopupSubtitle('Failed to logout. Please try again.');
        setShowPopup(true);
      }
      setIsLogoutConfirm(false);
    }
    setShowPopup(false);
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
        {isLogoutConfirm ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.popupButton, { flex: 1, marginRight: 10 }]} onPress={handlePopupAction}>
              <Text style={styles.popupButtonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.popupButton, { flex: 1, backgroundColor: '#ccc' }]} onPress={() => setShowPopup(false)}>
              <Text style={[styles.popupButtonText, { color: '#333' }]}>Cancel</Text>
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
    <SafeAreaView style={{ backgroundColor: colors.card, flex: 1 }}>
      <Header
        title="Settings"
      />
      <View style={[GlobalStyleSheet.container, { marginTop: 10 }]}>
        {SettingData.map((data, index) => {
          return (
            <View key={index} style={{ marginHorizontal: -15 }}>
              <TouchableOpacity
                onPress={() => handleItemPress(data)}
                style={[GlobalStyleSheet.flexalingjust, {
                  height: 48,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  marginHorizontal: 15
                }]}
              >
                <View style={GlobalStyleSheet.flexaling}>
                  <Image
                    style={[GlobalStyleSheet.image2, {
                      height: 20,
                      width: 20,
                      resizeMode: 'contain',
                      tintColor: data.isLogout ? COLORS.danger : colors.title
                    }]}
                    source={data.image}
                  />
                  <Text style={[GlobalStyleSheet.textfont, {
                    fontSize: 15,
                    marginLeft: 10,
                    color: data.isLogout ? COLORS.danger : colors.title
                  }]}>{data.text}</Text>
                </View>
                {!data.isLogout && (
                  <Image
                    style={[GlobalStyleSheet.image2, {
                      height: 15,
                      width: 15,
                      resizeMode: 'contain',
                      tintColor: colors.title
                    }]}
                    source={IMAGES.rigtharrow}
                  />
                )}
              </TouchableOpacity>
            </View>
          )
        })}
      </View>
      {showPopup && <Popup />}
    </SafeAreaView>
  );
};

export default Settings;

// Styles for the Popup
const styles = StyleSheet.create({
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