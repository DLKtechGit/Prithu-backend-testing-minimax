 
// BottomTab.tsx
import { useEffect, useRef, useState } from 'react';
import { Image, Platform, TouchableOpacity, View, Animated, Text, Dimensions } from 'react-native';
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
 
  const tabWD =
    tabWidth < SIZES.container ? tabWidth / filteredRoutes.length : SIZES.container / filteredRoutes.length;
 
  const circlePosition = useRef(new Animated.Value(0)).current;
 
  Dimensions.addEventListener('change', val => {
    setWidth(val.window.width);
  });
 
  const fetchProfilePic = async () => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      console.warn("No user token found in AsyncStorage");
      return;
    }

    const res = await fetch("https://ddbb.onrender.com/api/get/profile/detail", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json();

    if (data?.profile?.profileAvatar && data.profile.profileAvatar !== 'Unknown') {
      // ✅ prepend your server URL and replace backslashes
      const fixedUrl = `https://ddbb.onrender.com/${data.profile.profileAvatar.replace(/\\/g, '/')}`;
      setProfilePic(fixedUrl);
    } else {
      // fallback to null so IMAGES.profile is used
      setProfilePic(null);
    }
  } catch (err) {
    console.error("Error fetching profile picture:", err);
  }
};

 
  useEffect(() => {
    fetchProfilePic();
  }, []);
 
  useEffect(() => {
    Animated.spring(circlePosition, {
      toValue: state.index * tabWD,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth, activeAccountType]);
 
  const onTabPress = (index: number) => {
    const tabW =
      tabWidth < SIZES.container ? tabWidth / 5 : SIZES.container / 5;
 
    Animated.spring(circlePosition, {
      toValue: index * tabW,
      useNativeDriver: true,
    }).start();
  };
 
  return (
    <View
      style={[{
        backgroundColor: colors.card,
        shadowColor: 'rgba(0, 0, 0, 0.60)',
        shadowOffset: { width: 0, height: 0 },
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
          <Animated.View
            style={{
              position: 'absolute',
              height: '100%',
              width: tabWidth < SIZES.container ? tabWidth / 5 : SIZES.container / 5,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ translateX: circlePosition }],
            }}
          >
            <View
              style={{
                height: 40,
                width: 40,
                borderRadius: 38,
                backgroundColor: COLORS.primary,
                opacity: .15,
                marginTop: 5,
              }}
            />
          </Animated.View>
          {filteredRoutes.map((route: any, index: any) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;
 
            const isFocused = state.routes[state.index].key === route.key;
 
            const isCreator = activeAccountType === 'Creator';
 
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
 
              if (label === 'Home') {
                handleHomePress();
                return;
              }
 
              if (!isCreator) {
                if (label === 'Reels') {
                  navigation.navigate('Reels');
                  return;
                }
                if (label === 'Chat') {
                  navigation.navigate('createpost');
                  return;
                }
              } else {
                if (label === 'Reels') {
                  navigation.navigate('createpost');
                  return;
                }
                if (label === 'Chat') {
                  navigation.navigate('Reels');
                  return;
                }
              }
 
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate({ name: route.name, merge: true });
                onTabPress(index);
              }
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
            }
 
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={.8}
                onPress={onPress}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'center',
                  marginTop: 5,
                }}
              >
                {label === 'Profile' ? (
                  <Image
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 50,
                      borderWidth: isFocused ? 2 : 0,
                      borderColor: isFocused ? COLORS.primary : 'transparent',
                    }}
                    source={profilePic ? { uri: profilePic } : IMAGES.profile}
                  />
                ) : (
                  <Image
                    style={{
                      width: 22,
                      height: 22,
                      opacity: isFocused ? 1 : .4,
                      tintColor: isFocused ? COLORS.primary : colors.text,
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
 