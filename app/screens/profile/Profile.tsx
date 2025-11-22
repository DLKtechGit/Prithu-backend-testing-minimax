import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Share,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, FONTS, IMAGES, SIZES } from '../../constants/theme';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import Followbtn from '../../components/button/Followbtn';
import Sharebtn from '../../components/button/Sharebtn';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import api from '../../../apiInterpretor/apiInterceptor';

type ProfileScreenProps = StackScreenProps<RootStackParamList, 'Profile'>;

const Profile = ({ navigation }: ProfileScreenProps) => {
  const mountedRef = useRef(true);

  const [profile, setProfile] = useState<any>({
    displayName: '',
    username: '',
    bio: '',
    balance: '',
    profileAvatar: '',
    coverPhoto: '',
  });

  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [feedCount, setFeedCount] = useState<number>(0);

  const [activeAccountType, setActiveAccountType] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Posts / Reels for this user
  const [profilePosts, setProfilePosts] = useState<any[]>([]);
  const [reelsPosts, setReelsPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  // Tabs
  const scrollRef = useRef<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const slideIndicator = scrollX.interpolate({
    inputRange: [0, SIZES.width],
    outputRange: [0, (SIZES.width - 30) / 2],
    extrapolate: 'clamp',
  });

  const onPressTouch = (val: number) => {
    setCurrentIndex(val);
    scrollRef.current?.scrollTo({
      x: SIZES.width * val,
      animated: true,
    });
  };

  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch active account type
  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const storedType = await AsyncStorage.getItem('activeAccountType');
        if (storedType) setActiveAccountType(storedType);
      } catch (err) {
        console.log('Error fetching account type:', err);
      }
    };
    fetchAccountType();
  }, []);

  // Fetch follow + feed counts
  useEffect(() => {
    const fetchFollowData = async () => {
      try {
        const response = await api.get('/api/user/following/data');
        const data = response.data;
        if (data.data) {
          setFollowersCount(data.data.followersCount || 0);
          setFollowingCount(data.data.followingCount || 0);
          setFeedCount(data.data.feedCount || 0);
        }
      } catch (err) {
        console.error('Fetch follow data error:', err);
      }
    };

    fetchFollowData();
  }, [activeAccountType]);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/api/get/profile/detail');
      if (!mountedRef.current) return;

      const data = response.data;
      if (data.profile) {
        const profileData = data.profile;
        setProfile({
          displayName: profileData.displayName || profileData.userName || '',
          username: profileData.userName || '',
          bio: profileData.bio || '',
          balance: profileData.balance || '',
          profileAvatar: profileData.profileAvatar,
          coverPhoto: profileData.coverPhoto || '',
        });
      } else {
        const errorMsg = data.message || 'Failed to fetch profile';
        if (mountedRef.current) {
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      if (mountedRef.current) {
        setError('Network error occurred');
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Fetch this user's own posts (like UserPostFeed)
  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true);
      const userId = await AsyncStorage.getItem('userId');

      if (!userId) {
        console.log('Missing userId');
        setLoadingPosts(false);
        return;
      }

      const res = await api.post('/api/user/get/post', {
        currentUserId: userId,
      });

      const feeds = res.data.feeds || [];

      const images = feeds.filter((f: any) => !f.contentUrl.endsWith('.mp4'));
      const videos = feeds.filter((f: any) => f.contentUrl.endsWith('.mp4'));

      setProfilePosts(
        images.map((f: any) => ({
          image: f.contentUrl,
          likeCount: f.likeCount || 0,
        }))
      );

      setReelsPosts(
        videos.map((f: any) => ({
          thumbnail: f.contentUrl
            .replace('/video/upload/', '/video/upload/so_0/')
            .replace('.mp4', '.jpg'),
          videoUrl: f.contentUrl,
          views: f.likeCount || 0,
        }))
      );
    } catch (err: any) {
      console.log(
        'Error fetching user posts:',
        err?.response?.data || err?.message
      );
      setProfilePosts([]);
      setReelsPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh all data in parallel
      await Promise.all([
        fetchProfile(),
        fetchUserPosts(),
        (async () => {
          const response = await api.get('/api/user/following/data');
          const data = response.data;
          if (data.data) {
            setFollowersCount(data.data.followersCount || 0);
            setFollowingCount(data.data.followingCount || 0);
            setFeedCount(data.data.feedCount || 0);
          }
        })(),
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile]);


  const onShare = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const profileUrl = `https://prithubackend.onrender.com/api/profile/${userId}`;
      const result = await Share.share({
        message: `Check out this profile: ${profileUrl}`,
      });

      if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const handleSubscriptionNavigation = async () => {
    try {
      const response = await api.get('/api/user/user/subscriptions');
      const data = response.data;

      if (data.plan && data.plan.isActive === true) {
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
        navigation.navigate('Subcribe');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Something went wrong while checking subscription status.'
      );
      navigation.navigate('Subcribe');
    }
  };

  return (
    <SafeAreaView
      style={[
        GlobalStyleSheet.container,
        { padding: 0, backgroundColor: colors.card, flex: 1 },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* COVER PHOTO + HEADER + FOLLOW BUTTON */}
        <ImageBackground
          style={{
            width: '100%',
            height: 260,
          }}
          imageStyle={{ resizeMode: 'cover' }}
          source={
            profile.coverPhoto
              ? { uri: profile.coverPhoto }
              : IMAGES.profilebackground
          }
        >
          <View style={[GlobalStyleSheet.container, { marginTop: 10 }]}>
            <View style={GlobalStyleSheet.flexalingjust}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Image
                  style={{ width: 18, height: 18, tintColor: '#fff' }}
                  source={IMAGES.arrowleft}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
              >
                <View style={GlobalStyleSheet.background}>
                  <Image
                    style={[GlobalStyleSheet.image, { tintColor: COLORS.white }]}
                    source={IMAGES.setting}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Center Follow button */}
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingBottom: 20,
            }}
          >
            {/* <TouchableOpacity
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: COLORS.white,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowOffset: { width: 0, height: 6 },
                shadowRadius: 10,
                elevation: 4,
              }}
              onPress={() => {
                // you can add real follow logic here
                Alert.alert('Follow', 'Follow button pressed');
              }}
            >
              <Text
                style={{
                  ...FONTS.fontMedium,
                  fontSize: 15,
                  color: COLORS.primary,
                }}
              >
                Follow
              </Text>
            </TouchableOpacity> */}
          </View>
        </ImageBackground>

        {/* WHITE CARD WITH AVATAR + NAME + BIO + STATS */}
        <View
          style={{
            marginTop: -100,
            paddingHorizontal: 16,
            paddingBottom: 10,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              paddingTop: 60,
              paddingHorizontal: 16,
              paddingBottom: 20,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                position: 'absolute',
                top: 40,
                left: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(217, 217, 217, .6)',
                  height: 96,
                  width: 96,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 999,
                    opacity: isImageLoading ? 0.4 : 1,
                  }}
                  source={
                    profile.profileAvatar
                      ? { uri: profile.profileAvatar }
                      : IMAGES.user
                  }
                  onLoadStart={() => setIsImageLoading(true)}
                  onLoadEnd={() => setIsImageLoading(false)}
                />
              </View>

              {activeAccountType === 'Creator' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('EditProfile')}
                  style={{ position: 'absolute', bottom: -2, right: -2 }}
                >
                  <View
                    style={{
                      backgroundColor: '#001F50',
                      width: 32,
                      height: 32,
                      borderRadius: 50,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: '#2979F8',
                        width: 26,
                        height: 26,
                        borderRadius: 50,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image
                        style={{
                          width: 16,
                          height: 16,
                          resizeMode: 'contain',
                        }}
                        source={IMAGES.edit2}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Name + username on the right */}
            <View style={{ marginLeft: 120 }}>
              <Text
                style={{
                  ...FONTS.h6,
                  ...FONTS.fontMedium,
                  color: colors.title,
                  fontSize: 18,
                }}
              >
                {profile.displayName || profile.username}
              </Text>

              {!!profile.username && (
                <Text
                  style={{
                    ...FONTS.font,
                    ...FONTS.fontRegular,
                    color: COLORS.text,
                    opacity: 0.7,
                    marginTop: 4,
                  }}
                >
                  @{profile.username}
                </Text>
              )}
            </View>

            {/* BIO full-width horizontal row */}
            {!!profile.bio && (
              <Text
                style={{
                  ...FONTS.font,
                  ...FONTS.fontRegular,
                  color: colors.title,
                  marginTop: 12,
                  lineHeight: 18,
                  marginLeft: 126,
                  marginRight: 16,
                }}
              >
                {profile.bio}
              </Text>
            )}

            {/* TWO BUTTONS under bio */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 16,
                paddingHorizontal: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile')}
                style={{
                  flex: 1,
                  marginRight: 6,
                  backgroundColor: COLORS.primary,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: COLORS.white, ...FONTS.fontMedium }}>
                  Edit Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onShare}
                style={{
                  flex: 1,
                  marginLeft: 6,
                  backgroundColor: colors.card,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: COLORS.primary, ...FONTS.fontMedium }}>
                  Share Profile
                </Text>
              </TouchableOpacity>
            </View>


            {/* Stats row: Posts / Followers / Following */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 18,
              }}
            >
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={GlobalStyleSheet.textfont2}>{feedCount}</Text>
                <Text style={GlobalStyleSheet.titlefont}>Posts</Text>
              </View>

              <TouchableOpacity
                style={{ alignItems: 'center', flex: 1 }}
                onPress={() => navigation.navigate('Followers')}
              >
                <Text style={GlobalStyleSheet.textfont2}>{followersCount}</Text>
                <Text style={GlobalStyleSheet.titlefont}>Followers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: 'center', flex: 1 }}
                onPress={() => navigation.navigate('Followers')}
              >
                <Text style={GlobalStyleSheet.textfont2}>{followingCount}</Text>
                <Text style={GlobalStyleSheet.titlefont}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Creator buttons under card (optional) */}
        {activeAccountType === 'Creator' && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginTop: 16,
            }}
          >
            <Followbtn
              onPress={() => navigation.navigate('Suggestions')}
              title="Professional Dashboard"
            />
            <Sharebtn onPress={onShare} title="Share Profile" />
          </View>
        )}

        {/* POSTS / REELS TABS & CONTENT (UserPostFeed style) */}
        <View style={{ marginTop: 20, marginBottom: 20 }}>
          {/* Tabs */}
          <View style={GlobalStyleSheet.container}>
            <View
              style={{
                flexDirection: 'row',
                marginTop: 0,
                marginBottom: 0,
              }}
            >
              <TouchableOpacity
                onPress={() => onPressTouch(0)}
                style={GlobalStyleSheet.TouchableOpacity2}
              >
                <Image
                  style={[
                    { width: 16, height: 16, tintColor: '#475A77' },
                    currentIndex === 0 && { tintColor: COLORS.primary },
                  ]}
                  source={IMAGES.profilepic}
                />
                <Text
                  style={[
                    {
                      ...FONTS.fontMedium,
                      fontSize: 14,
                      color: '#475A77',
                      marginLeft: 5,
                    },
                    currentIndex === 0 && { color: COLORS.primary },
                  ]}
                >
                  Post
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onPressTouch(1)}
                style={GlobalStyleSheet.TouchableOpacity2}
              >
                <Image
                  style={[
                    { width: 16, height: 16, tintColor: '#475A77' },
                    currentIndex === 1 && { tintColor: COLORS.primary },
                  ]}
                  source={IMAGES.reels}
                />
                <Text
                  style={[
                    {
                      ...FONTS.fontMedium,
                      fontSize: 14,
                      color: '#475A77',
                      marginLeft: 5,
                    },
                    currentIndex === 1 && { color: COLORS.primary },
                  ]}
                >
                  Reels
                </Text>
              </TouchableOpacity>

              <Animated.View
                style={{
                  backgroundColor: COLORS.primary,
                  width: '50%',
                  height: 2,
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  transform: [{ translateX: slideIndicator }],
                }}
              />
            </View>
          </View>

          {/* Tab Content */}
          {loadingPosts ? (
            <View
              style={{
                height: SIZES.height * 0.4,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <ScrollView
              horizontal
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              ref={scrollRef}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              onMomentumScrollEnd={(e: any) => {
                const xOffset = e.nativeEvent.contentOffset.x;
                setCurrentIndex(xOffset >= SIZES.width / 2 ? 1 : 0);
              }}
            >
              {/* POSTS GRID */}
              <View
                style={[
                  GlobalStyleSheet.container,
                  { marginTop: 5, width: SIZES.width, padding: 0 },
                ]}
              >
                {profilePosts.length === 0 ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: SIZES.height - 250,
                    }}
                  >
                    <Text>No posts yet</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {profilePosts.map((data: any, index) => (
                      <View key={index} style={{ width: '33.33%' }}>
                        <TouchableOpacity
                          style={{ padding: 2 }}
                          onPress={() =>
                            navigation.navigate('UserPostDetail', { data })
                          }
                        >
                          <Image
                            style={{
                              width: '100%',
                              height: null,
                              aspectRatio: 1,
                            }}
                            source={{ uri: data.image }}
                          />
                          <View
                            style={{
                              flexDirection: 'row',
                              gap: 5,
                              alignItems: 'center',
                              backgroundColor: 'rgba(255, 255, 255, 0.20)',
                              position: 'absolute',
                              borderRadius: 15,
                              paddingHorizontal: 10,
                              paddingVertical: 3,
                              bottom: 10,
                              left: 10,
                            }}
                          >
                            <Image
                              style={{
                                width: 10,
                                height: 10,
                                resizeMode: 'contain',
                                tintColor: '#fff',
                              }}
                              source={IMAGES.like}
                            />
                            <Text
                              style={{
                                ...FONTS.fontRegular,
                                fontSize: 10,
                                color: COLORS.white,
                              }}
                            >
                              {data.likeCount || 0}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* REELS GRID */}
              <View
                style={[
                  GlobalStyleSheet.container,
                  { marginTop: 5, width: SIZES.width, padding: 0 },
                ]}
              >
                {reelsPosts.length === 0 ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: SIZES.height - 250,
                    }}
                  >
                    <Text>No reels yet</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {reelsPosts.map((data: any, index) => (
                      <View
                        key={index}
                        style={{ width: '33.33%', padding: 2 }}
                      >
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate('UserReelDetail', { data })
                          }
                        >
                          <Image
                            style={{
                              width: '100%',
                              height: null,
                              aspectRatio: 1 / 1.9,
                            }}
                            source={{ uri: data.thumbnail }}
                          />
                          <View
                            style={{
                              flexDirection: 'row',
                              gap: 5,
                              alignItems: 'center',
                              backgroundColor: 'rgba(255, 255, 255, 0.20)',
                              position: 'absolute',
                              borderRadius: 15,
                              paddingHorizontal: 10,
                              paddingVertical: 3,
                              top: 10,
                              right: 10,
                            }}
                          >
                            <Image
                              style={{
                                width: 12,
                                height: 12,
                                resizeMode: 'contain',
                                tintColor: '#fff',
                              }}
                              source={IMAGES.eyeopen}
                            />
                            <Text
                              style={{
                                ...FONTS.fontRegular,
                                fontSize: 10,
                                color: COLORS.white,
                              }}
                            >
                              {data.views || 0}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
