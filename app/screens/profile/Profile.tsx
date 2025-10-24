import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ImageBackground, TouchableOpacity, Animated, Dimensions, Share, Alert, SafeAreaView,ActivityIndicator } from 'react-native';
import { COLORS, FONTS, IMAGES, SIZES } from '../../constants/theme';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import { LinearGradient } from 'expo-linear-gradient';
import Followbtn from '../../components/button/Followbtn';
import Sharebtn from '../../components/button/Sharebtn';
import { ScrollView } from 'react-native-gesture-handler';
import { useTheme } from '@react-navigation/native';
import ProfilePostData from './ProfilePostData';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProfileScreenProps = StackScreenProps<RootStackParamList, 'Profile'>;

const Profile = ({ navigation }: ProfileScreenProps) => {
  const [profile, setProfile] = useState<any>({
    displayName: '',
    username: '',
    bio: '',
    balance: '',
    profileAvatar: '',
  });
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState([]);
  const [postCount, setPostCount] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState<number>(0); // New state for followers count
  const [followingCount, setfollowingCount] = useState<number>(0);
  const [feedCount, setfeedCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
   const [isImageLoading, setIsImageLoading] = useState(true); // New state for image loading

  const buildUrl = (path: string | undefined | null) => {
    if (!path) return '';
    return `https://prithubackend.onrender.com/${path.replace(/\\/g, '/')}`;
  };


  // --------------------------- Skeleton Loader Component ----------------------------

const SkeletonAvatar = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmer]);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  return (
    <View style={{ backgroundColor: 'rgba(217, 217, 217, .6)', height: 110, width: 110, borderRadius: 100, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: 100,
          height: 100,
          borderRadius: 100,
          backgroundColor: '#e0e0e0',
          opacity: shimmerOpacity,
        }}
      />
    </View>
  );
};

  // Fetch active account type
  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const storedType = await AsyncStorage.getItem("activeAccountType");
        console.log(storedType);
        if (storedType) setActiveAccountType(storedType);
      } catch (err) {
        console.log("Error fetching account type:", err);
      }
    };
    fetchAccountType();
  }, []);


// Fetch followers and following count
useEffect(() => {
  const fetchFollowData = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const res = await fetch('http://192.168.1.10:5000/api/user/following/data', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const data = await res.json();
      console.log("count",data)
      if (res.ok && data.data) {
        setFollowersCount(data.data.followersCount || 0);
        setfollowingCount(data.data.followingCount || 0);
        setfeedCount(data.data.feedCount || 0)

      } else {
        console.log('Error fetching follow data:', data.message);
      }
    } catch (err) {
      console.error('Fetch follow data error:', err);
    }
  };

  fetchFollowData();
}, [activeAccountType]);



  const fetchProfile = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const res = await fetch('http://192.168.1.10:5000/api/get/profile/detail', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const data = await res.json();
       console.log("data",data)

      if (res.ok && data.profile) {
        const profileData = data.profile;
        setProfile({
          displayName: profileData.displayName || '',
          username: profileData.userName || '',
          bio: profileData.bio || '',
          balance: profileData.balance || '',
          profileAvatar: profileData.profileAvatar,
        });
      } else {
        console.log('Error fetching profile:', data.message);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

// useEffect(() => {
//     const fetchFeeds = async () => {
//       try {
//         setLoading(true);
//         const token = await AsyncStorage.getItem('userToken');
//         const notInterested = JSON.parse(await AsyncStorage.getItem('notInterested') || '[]');
//         if (!token) {
//           Alert.alert('Error', 'User not authenticated');
//           setLoading(false);
//           return;
//         }

//         const response = await fetch('http://192.168.1.10:5000/api/creator/getall/feeds', {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         const data = await response.json();
//         const feeds = (data.feeds || []).filter((feed: any) => !notInterested.includes(feed._id));
//         console.log("Fetched feeds:", feeds.map((feed: any) => ({ id: feed._id, type: feed.type })));
//         setFollowersCount(data.followersCount || 0);

//         const imagePosts = feeds
//           .filter((feed: any) => feed.type === 'image')
//           .map((feed: any) => ({
//             id: feed._id,
//             image: { uri: feed.contentUrl },
//             like: (feed.like ?? 0).toString(),
//           }));

//         const videoReels = feeds
//           .filter((feed: any) => feed.type === 'video')
//           .map((feed: any) => ({
//             id: feed._id,
//             image: { uri: feed.contentUrl.replace('/video/upload/', '/video/upload/so_0/').replace('.mp4', '.jpg') },
//             videoUrl: feed.contentUrl,
//             like: (feed.like ?? 0).toString(),
//           }));

//         setPosts(imagePosts);
//         setReels(videoReels);
//         setPostCount(imagePosts.length);
//       } catch (err: any) {
//         console.error('Fetch posts error:', err);
//         setError(err.message || 'Failed to fetch posts');
//         Alert.alert('Error', err.message || 'Failed to fetch posts');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFeeds();
//   }, []);
  
  const handleNotInterested = async (postId: string) => {
    console.log('Profile handleNotInterested called with postId:', postId);
    const notInterested = JSON.parse(await AsyncStorage.getItem('notInterested') || '[]');
    if (!notInterested.includes(postId)) {
      notInterested.push(postId);
      await AsyncStorage.setItem('notInterested', JSON.stringify(notInterested));
    }
    setPosts(prevPosts => {
      const newPosts = prevPosts.filter(post => post.id !== postId);
      setPostCount(newPosts.length);
      return newPosts;
    });
    setReels(prevReels => prevReels.filter(reel => reel.id !== postId));
  };

  const scrollRef = useRef<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const slideIndicator = scrollX.interpolate({
    inputRange: [0, SIZES.width],
    outputRange: [0, (SIZES.width - 30) / 2],
    extrapolate: 'clamp',
  });

  const onPressTouch = (val: any) => {
    setCurrentIndex(val);
    scrollRef.current?.scrollTo({
      x: SIZES.width * val,
      animated: true,
    });
  };

  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const onShare = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert("Error", "User not found");
        return;
      }

      const profileUrl = `http://192.168.1.10:5000/api/profile/${userId}`;
      const result = await Share.share({
        message: `Check out this profile: ${profileUrl}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  
  const handleSubscriptionNavigation = async () => {
    try {
      // Fetch user token
      const userToken = await AsyncStorage.getItem('userToken');
      console.log('Fetched userToken:', userToken);
      if (!userToken) {
        console.log('No userToken found, navigating to Login');
        Alert.alert('Error', 'You must be logged in to check subscription.');
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
      console.log('Subscription status response:', data);

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
      console.log('Error occurred, navigating to Subcribe');
      Alert.alert('Error', 'Something went wrong while checking subscription status.');
      navigation.navigate('Subcribe');
    }
  };

  return (
    <SafeAreaView style={[GlobalStyleSheet.container, { padding: 0, backgroundColor: theme.dark ? colors.background : colors.card, flex: 1 }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground
          style={{ width: '100%', height: 370, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, overflow: 'hidden' }}
          source={IMAGES.profilebackground}
        >
          <View style={GlobalStyleSheet.container}>
            <View style={[GlobalStyleSheet.flexalingjust, { marginTop: 10 }]}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
              >
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
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View>
              <TouchableOpacity>
                <View style={{ backgroundColor: 'rgba(217, 217, 217, .6)', height: 110, width: 110, borderRadius: 100, alignItems: 'center', justifyContent: 'center'  }}>
                  <Image
                    style={{ width: 100, height: 100, borderRadius: 100 , opacity: isImageLoading ? 0.4 : 1}}
                    source={ { uri: profile.profileAvatar } }
                     onLoadStart={() => setIsImageLoading(true)}
                    onLoadEnd={() => setIsImageLoading(false)}
                  
                  />
                  
                </View>
              </TouchableOpacity>

              {activeAccountType === "Creator" && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('EditProfile')}
                  style={{ position: 'absolute', bottom: 0, right: 0 }}
                >
                  <View style={{ backgroundColor: '#001F50', width: 36, height: 36, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ backgroundColor: '#2979F8', width: 30, height: 30, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
                      <Image
                        style={{ width: 18, height: 18, resizeMode: 'contain' }}
                        source={IMAGES.edit2}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ ...FONTS.h6, ...FONTS.fontMedium, color: COLORS.white }}>{profile.displayName}</Text>
              <Text style={{ ...FONTS.font, ...FONTS.fontRegular, color: COLORS.white, opacity: .6, marginTop: 5 }}>{profile.username}</Text>
            </View>
             <View style={{ backgroundColor: 'rgba(255, 255, 255, .1)', height: 70, width: 280, borderRadius: 12, marginTop: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
             
              
                <>
                 <View style={{ alignItems: 'center', width: '30%' }}>
                    <Text style={GlobalStyleSheet.textfont2}>{feedCount}</Text>
                    <Text style={GlobalStyleSheet.titlefont}>Post</Text>
                  </View> 
               
                  <View style={{ width: '30%' }}>
                    <TouchableOpacity style={{ alignItems: 'center' }}
                      onPress={() => navigation.navigate('Followers')}
                    >
                      <Text style={GlobalStyleSheet.textfont2}>{followersCount}</Text>
                      <Text style={GlobalStyleSheet.titlefont}>Followers</Text>
                    </TouchableOpacity>
                  </View>
                  <LinearGradient colors={['rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.20)', 'rgba(255, 255, 255, 0.00)']}
                    style={{ width: 2, height: 50, position: 'absolute', right: 100 }}
                  ></LinearGradient>
                </>
              
                <>
                  <View style={{ alignItems: 'center', width: '30%' }}>
                    <TouchableOpacity style={{ alignItems: 'center' }}
                      onPress={() => navigation.navigate('Followers')}
                    >
                      <Text style={GlobalStyleSheet.textfont2}>{followingCount}</Text>
                      <Text style={GlobalStyleSheet.titlefont}>Following</Text>
                    </TouchableOpacity>
                  </View>
                </>
              

            </View>
          </View>
        </ImageBackground>

        {activeAccountType === "Creator" && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 }}>
            <Followbtn
              onPress={() => navigation.navigate('Suggestions')}
              title='professional Dashboard'
            />
            <Sharebtn
              onPress={onShare}
              title='Share Profile'
            />
          </View>
        )}
    
          <View style={{ marginHorizontal: 15, marginTop: 20 }}>
            <Text style={{ ...FONTS.h6, ...FONTS.fontMedium, color: colors.title, fontSize: 18, fontWeight: '600' }}>Account Overview</Text>
            <View style={{ marginTop: 10, backgroundColor: colors.card, borderRadius: 15, padding: 10 }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
                onPress={() => navigation.navigate('EditProfile')}>
                <View style={{ width: 30, height: 30, backgroundColor: '#E0F2FE', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Image style={{ width: 20, height: 20, tintColor: '#60A5FA' }} source={IMAGES.user} />
                </View>
                <Text style={{ ...FONTS.font, color: colors.title, marginLeft: 12, flex: 1 }}>My Profile</Text>
                <Image style={{ width: 20, height: 20, tintColor: '#6B7280' }} source={IMAGES.rigtharrow} />
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => navigation.navigate('Friend')}>
                <View style={{ width: 30, height: 30, backgroundColor: '#D1FAE5', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Image style={{ width: 20, height: 20, tintColor: '#34D399' }} source={IMAGES.pricing} />
                </View>
                <Text style={{ ...FONTS.font, color: colors.title, marginLeft: 12, flex: 1 }}>Referral Dashboard</Text>
                <Image style={{ width: 20, height: 20, tintColor: '#6B7280' }} source={IMAGES.rigtharrow} />
              </TouchableOpacity>

             <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={handleSubscriptionNavigation}>
                <View style={{ width: 30, height: 30, backgroundColor: '#FEE2E2', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Image style={{ width: 20, height: 20, tintColor: '#F87171' }} source={IMAGES.badge} />
                </View>
                <Text style={{ ...FONTS.font, color: colors.title, marginLeft: 12, flex: 1 }}>Subscription</Text>
                <Image style={{ width: 20, height: 20, tintColor: '#6B7280' }} source={IMAGES.rigtharrow} />
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => navigation.navigate('Invite')}>
                <View style={{ width: 30, height: 30, backgroundColor: '#FEF3C7', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Image style={{ width: 20, height: 20, tintColor: '#FBBF24' }} source={IMAGES.lock} />
                </View>
                <Text style={{ ...FONTS.font, color: colors.title, marginLeft: 12, flex: 1 }}>Invite Friends</Text>
                <Image style={{ width: 20, height: 20, tintColor: '#6B7280' }} source={IMAGES.rigtharrow} />
              </TouchableOpacity>


                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => navigation.navigate('UserPostFeed')}>
                <View style={{ width: 30, height: 30, backgroundColor: '#e8fec7ff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <Image style={{ width: 20, height: 20, tintColor: '#80d455ff' }} source={IMAGES.sticker} />
                </View>
                <Text style={{ ...FONTS.font, color: colors.title, marginLeft: 12, flex: 1 }}>Our posts</Text>
                <Image style={{ width: 20, height: 20, tintColor: '#6B7280' }} source={IMAGES.rigtharrow} />
              </TouchableOpacity>
            </View>
          </View>
       

        {activeAccountType === "Creator" && (
          <View style={{ marginHorizontal: 15 }}>
            <View
              style={[
                GlobalStyleSheet.container,
                {
                  backgroundColor: theme.dark ? 'rgba(255,255,255,.1)' : '#EFF3FA',
                  padding: 10,
                  marginHorizontal: 20,
                  borderRadius: 6,
                  marginTop: 20
                }
              ]}
            >
              <Text style={{ ...FONTS.fontXs, lineHeight: 18, color: colors.title }}>{profile.bio}</Text>
            </View>
          </View>
        )}

        {activeAccountType === "Creator" && (
          <View style={GlobalStyleSheet.container}>
            <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 0 }}>
              <TouchableOpacity
                onPress={() => onPressTouch(0)}
                style={GlobalStyleSheet.TouchableOpacity2}>
                <Image
                  style={[{ width: 16, height: 16, tintColor: '#475A77' }, currentIndex == 0 && { tintColor: COLORS.primary }]}
                  source={IMAGES.profilepic}
                />
                <Text style={[{ ...FONTS.fontMedium, fontSize: 14, color: '#475A77', marginLeft: 5 }, currentIndex == 0 && { color: COLORS.primary }]}> Post</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onPressTouch(1)}
                style={GlobalStyleSheet.TouchableOpacity2}>
                <Image
                  style={[{ width: 16, height: 16, tintColor: '#475A77' }, currentIndex == 1 && { tintColor: COLORS.primary }]}
                  source={IMAGES.reels}
                />
                <Text style={[{ ...FONTS.fontMedium, fontSize: 14, color: '#475A77', marginLeft: 5 }, currentIndex == 1 && { color: COLORS.primary }]}> Reels</Text>
              </TouchableOpacity>
              <Animated.View
                style={{
                  backgroundColor: COLORS.primary,
                  width: '50%',
                  height: 2,
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  transform: [{ translateX: slideIndicator }]
                }}>
              </Animated.View>
            </View>
          </View>
        )}

        {activeAccountType === "Creator" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            scrollEventThrottle={16}
            ref={scrollRef}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(e: any) => {
              if (e.nativeEvent.contentOffset.x.toFixed(0) == SIZES.width.toFixed(0)) {
                setCurrentIndex(1)
              } else if (e.nativeEvent.contentOffset.x.toFixed(0) == 0) {
                setCurrentIndex(0)
              } else {
                setCurrentIndex(0)
              }
            }}
          >
            <View style={[GlobalStyleSheet.container, { marginTop: 5, width: SIZES.width, padding: 0 }]}>
              <ProfilePostData navigation={navigation} ProfilepicData={posts} />
            </View>
            <View style={[GlobalStyleSheet.container, { marginTop: 5, width: SIZES.width, padding: 0 }]}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {reels.map((data, index) => (
                  <View key={index} style={{ width: '33.33%', padding: 2 }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("ProfilePost")}
                    >
                      <Image
                        style={{ width: '100%', height: null, aspectRatio: 1 / 1.8 }}
                        source={data.image}
                      />
                      <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.20)', position: 'absolute', borderRadius: 15, paddingHorizontal: 10, paddingVertical: 3, top: 10, right: 10 }}>
                        <Image
                          style={{ width: 12, height: 12, resizeMode: 'contain', tintColor: '#fff' }}
                          source={IMAGES.eyeopen}
                        />
                        <Text style={{ ...FONTS.fontRegular, fontSize: 10, color: COLORS.white, lineHeight: 14 }}>{data.like}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Profile;
