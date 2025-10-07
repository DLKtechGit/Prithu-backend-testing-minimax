import { useEffect, useRef, useState } from 'react';
import { Image, Platform, TouchableOpacity, View, Dimensions, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, IMAGES } from '../constants/theme';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { GlobalStyleSheet } from '../constants/styleSheet';

type Props = {
  state: any,
  navigation: any,
  descriptors: any,
  postListRef: any;
};

const BottomTab = ({ state, descriptors, navigation, postListRef }: Props) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const [tabWidth, setWidth] = useState(wp('100%'));
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(true); // Loading state for profile image

  const lastTap = useRef<number>(0);

  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const storedType = await AsyncStorage.getItem('activeAccountType');
        if (storedType) {
          setActiveAccountType(storedType);
        }
      } catch (error) {
        console.log('Error fetching account type:', error);
      }
    };
    fetchAccountType();
  }, []);

  const handleHomePress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap.current && now - lastTap.current < DOUBLE_PRESS_DELAY) {
      if (postListRef.current) {
        postListRef.current.scrollToTop(); // Only scroll to top on double-tap
      }
    } else {
      navigation.navigate('Home');
    }

    lastTap.current = now;
  };

  const filteredRoutes = state.routes;

  Dimensions.addEventListener('change', val => {
    setWidth(val.window.width);
  });

  const fetchProfilePic = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        console.warn("No user token found in AsyncStorage");
        setIsProfileImageLoading(false); // Reset loading state if no token
        return;
      }

      const res = await fetch("http://192.168.1.7:5000/api/get/profile/detail", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
        setIsProfileImageLoading(false); // Reset loading state on error
        return;
      }

      const data = await res.json();

      if (data?.profile?.profileAvatar && data.profile.profileAvatar !== 'Unknown') {
        const fixedUrl = data.profile.profileAvatar;
        setProfilePic(fixedUrl);
        console.log('Profile avatar URL:', fixedUrl);
      } else {
        setProfilePic(null);
        setIsProfileImageLoading(false); // Reset loading state if no valid URL
      }
    } catch (err) {
      console.error("Error fetching profile picture:", err);
      setIsProfileImageLoading(false); // Reset loading state on error
    }
  };

  useEffect(() => {
    fetchProfilePic();
  }, []);

  // Get the correct navigation target based on account type and label
  const getNavigationTarget = (label: string, isCreator: boolean) => {
    if (label === 'Home') return 'Home';
    if (label === 'Search') return 'Search';
    if (label === 'Profile') return 'Profile';
    
    // Handle different navigation for Creator vs Regular accounts
    if (!isCreator) {
      if (label === 'Reels') return 'Reels';
      if (label === 'Chat') return 'createpost';
    } else {
      if (label === 'Reels') return 'AddStory';
      if (label === 'Chat') return 'Reels';
    }
    
    return label; // fallback
  };

  return (
    <View
      style={[{
        backgroundColor: colors.card,
        shadowColor: 'rgba(0, 0, 0, 0.60)',
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: .1,
        shadowRadius: 5,
        left: 0,
        bottom: 0,
        right: 0,
      }, Platform.OS === 'ios' && {
        backgroundColor: colors.card,
      }]}
    >
      <View
        style={[{
          height: 60,
          backgroundColor: theme.dark ? colors.background : colors.card,
          paddingTop: 5
        }, Platform.OS === 'web' && { paddingTop: 10 }]}
      >
        <View style={[GlobalStyleSheet.container, {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 0,
          paddingTop: 0,
          paddingBottom: 0,
        }]}>
          {filteredRoutes.map((route: any, index: any) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;
            const isCreator = activeAccountType === 'Creator';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (event.defaultPrevented) {
                return;
              }

              if (label === 'Home') {
                handleHomePress();
                return;
              }

              const target = getNavigationTarget(label, isCreator);
              navigation.navigate(target);
            };

            let iconSource: any = null;
            if (label === 'Home') {
              iconSource = IMAGES.home;
            } else if (label === 'Search') {
              iconSource = IMAGES.search;
            } else if (label === 'Reels') {
              iconSource = isCreator ? IMAGES.plus : IMAGES.reels;
            } else if (label === 'Chat') {
              iconSource = isCreator ? IMAGES.reels : IMAGES.tabs;
            } else if (label === 'Profile') {
              iconSource =  { uri: profilePic } ;
            }

            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'center', marginTop: 5 }}
              >
                {label === 'Profile' ? (
                    
                  <View style={{ position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                    {isProfileImageLoading && (
                      <ActivityIndicator
                        style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -10 }] }}
                        size="small"
                        color={colors.primary}
                      />
                    )}
                    <Image
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 50,
                        borderWidth: 2, // Always show border
                        // borderColor: COLORS.primary, // Always primary color
                        opacity: isProfileImageLoading ? 0.2 : 1, // Reduced opacity during loading
                      }}
                      source={iconSource}
                      onLoadStart={() => setIsProfileImageLoading(true)}
                      onLoadEnd={() => setIsProfileImageLoading(false)}
                      onError={(error) => {
                        console.log('Profile image load error:', error.nativeEvent);
                        setIsProfileImageLoading(false);
                      }}
                    />
                  </View>
                ) : (
                  <Image
                    style={{
                      width: 22,
                      height: 22,
                      // tintColor: COLORS.primary, // Always primary color
                    }}
                    source={iconSource}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default BottomTab;