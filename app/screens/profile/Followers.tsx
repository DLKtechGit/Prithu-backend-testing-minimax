import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, IMAGES, SIZES } from '../../constants/theme';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import Sharebtn from '../../components/button/Sharebtn';
import { useTheme, useNavigation, useRoute } from '@react-navigation/native';
import Followbtn from '../../components/button/Followbtn';
import ChatoptionSheet from '../../components/bottomsheet/ChatoptionSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../apiInterpretor/apiInterceptor';

const Followers = () => {
  const moresheet = useRef<any>();
  const scrollRef = useRef<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  // State for data
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);

  // State to track follow status
  const [followStates, setFollowStates] = useState<{ [key: string]: boolean }>({});
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  // Get params from navigation
  const { profileUserId, roleRef, initialTab = 0 } = route.params || {};

  const buildUrl = (path: string | undefined | null) => {
    if (!path || path === 'Unavailable') return IMAGES.profile;
    const cleanPath = path.replace(/\\/g, '/').replace(/^.*?\/uploads/, '/uploads');
    return { uri: `${cleanPath}` };
  };

  // Fetch active account type
  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const storedType = await AsyncStorage.getItem("activeAccountType");
        if (storedType) setActiveAccountType(storedType);
      } catch (err) {
        console.log("Error fetching account type:", err);
      }
    };
    fetchAccountType();
  }, []);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
    };
    getCurrentUser();
  }, []);

  // Set initial tab
  useEffect(() => {
    if (initialTab !== undefined) {
      setCurrentIndex(initialTab);
      scrollRef.current?.scrollTo({
        x: SIZES.width * initialTab,
        animated: false,
      });
    }
  }, [initialTab]);

  // Fetch followers data
  useEffect(() => {
    const fetchFollowersData = async () => {
      try {
        // Use profileUserId if provided, otherwise use logged-in user's ID
        let targetUserId = profileUserId;
        if (!targetUserId) {
          targetUserId = await AsyncStorage.getItem('userId');
        }

        if (!targetUserId) {
          Alert.alert('Error', 'User not found');
          return;
        }

        // Fetch followers for the target user
        const followersResponse = await api.post(`/api/individual/user/followers`, {
          userId: targetUserId
        });
        console.log("📥 Followers Response:", followersResponse.data);

        if (followersResponse.data) {
          const formattedFollowers = Array.isArray(followersResponse.data.followers)
            ? followersResponse.data.followers.map((f: any, index: number) => ({
              id: `follower_${index}`,
              title: f.displayName || f.userName,
              text: f.userName,
              image: f.profileAvatar,
              hasStory: false,
              userId: f.userId,
              type: 'follower'
            }))
            : [];

          setFollowers(formattedFollowers);
          setFollowersCount(followersResponse.data.count || 0);
        }

      } catch (err) {
        console.log("❌ Followers fetch error:", err.response?.data || err);
      }
    };

    fetchFollowersData();
  }, [profileUserId]);

  // Fetch following data
  useEffect(() => {
    const fetchFollowingData = async () => {
      try {
        // Use profileUserId if provided, otherwise use logged-in user's ID
        let targetUserId = profileUserId;
        if (!targetUserId) {
          targetUserId = await AsyncStorage.getItem('userId');
        }

        if (!targetUserId) return;

        // Fetch following for the target user
        const followingResponse = await api.post(`/api/individual/user/following`, {
          userId: targetUserId
        });
        console.log("📥 Following Response:", followingResponse.data);

        if (followingResponse.data) {
          const formattedFollowing = Array.isArray(followingResponse.data.following)
            ? followingResponse.data.following.map((f: any, index: number) => ({
              id: `following_${index}`,
              title: f.displayName || f.userName,
              text: f.userName,
              image: f.profileAvatar,
              hasStory: false,
              userId: f.userId,
              type: 'following'
            }))
            : [];

          setFollowing(formattedFollowing);
          setFollowingCount(followingResponse.data.count || 0);

          // Initialize follow states
          const initialStates = formattedFollowing.reduce((acc: any, item: any) => {
            acc[item.id] = true; // Already following
            return acc;
          }, {});
          setFollowStates(initialStates);
        }

      } catch (err) {
        console.log("❌ Following fetch error:", err.response?.data || err);
      }
    };

    fetchFollowingData();
  }, [profileUserId]);

  const toggleFollowState = (id: string) => {
    setFollowStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  // Filter data based on search query
  const filterData = (data: any[]) => {
    if (!searchQuery.trim()) return data;

    return data.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderUserItem = (data: any, isFollowersTab: boolean) => (
    <View key={data.id} style={[GlobalStyleSheet.flexalingjust, { paddingHorizontal: 15, marginBottom: 15 }]}>
      <View style={[GlobalStyleSheet.flexaling, { flex: 1 }]}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('AnotherProfile', {
              profileUserId: data.userId,
              roleRef: 'User'
            });
          }}
          style={{ marginRight: 12 }}
        >
          <View style={{ position: 'relative' }}>
            <Image
              style={{ width: 50, height: 50, borderRadius: 25 }}
              source={data.image ? buildUrl(data.image) : IMAGES.profile}
            />
            {data.hasStory && (
              <Image
                style={{
                  width: 58,
                  height: 58,
                  position: 'absolute',
                  top: -4,
                  left: -4,
                  resizeMode: 'contain'
                }}
                source={IMAGES.cricle}
              />
            )}
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('AnotherProfile', {
                profileUserId: data.userId,
                roleRef: 'User'
              });
            }}
          >
            <Text style={[GlobalStyleSheet.textfont, { color: colors.title, marginBottom: 2 }]}>
              {data.title}
            </Text>
          </TouchableOpacity>
          <Text style={{ ...FONTS.fontXs, color: colors.text }}>@{data.text}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={GlobalStyleSheet.flexaling}>
        {isFollowersTab && activeAccountType === 'Creator' ? (
          // Followers tab for Creator - Show Remove/Follow buttons
          <View>
            {followStates[data.id] ? (
              <Sharebtn
                title='Remove'
                onPress={() => toggleFollowState(data.id)}
              />
            ) : (
              <Followbtn
                title="Follow"
                onPress={() => toggleFollowState(data.id)}
              />
            )}
          </View>
        ) : (
          // Following tab or Individual account - Show Following/Follow buttons
          <View>
            {followStates[data.id] ? (
              <Sharebtn
                title='Following'
                onPress={() => toggleFollowState(data.id)}
              />
            ) : (
              <Followbtn
                title="Follow"
                onPress={() => toggleFollowState(data.id)}
              />
            )}
          </View>
        )}

        {/* More options button */}
        {/* <TouchableOpacity
          onPress={() => moresheet.current.openSheet()}
          style={{ paddingLeft: 10 }}
        >
          <Image
            style={[GlobalStyleSheet.image, { tintColor: colors.title, width: 15, height: 15 }]}
            source={IMAGES.more}
          />
        </TouchableOpacity> */}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[GlobalStyleSheet.container, { padding: 0, backgroundColor: colors.card, flex: 1 }]}>
      <Header title="Followers & Following" />
      <View style={{ flex: 1 }}>
        {/* Tab Header */}
        <View style={GlobalStyleSheet.container}>
          <View style={{ flexDirection: 'row', position: 'relative' }}>
            <TouchableOpacity
              onPress={() => onPressTouch(0)}
              style={[GlobalStyleSheet.TouchableOpacity2, { flex: 1 }]}
            >
              <Text style={[
                GlobalStyleSheet.titlefont2,
                {
                  color: currentIndex === 0 ? colors.title : colors.text,
                  textAlign: 'center'
                }
              ]}>
                {followersCount} {followersCount === 1 ? 'Follower' : 'Followers'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onPressTouch(1)}
              style={[GlobalStyleSheet.TouchableOpacity2, { flex: 1 }]}
            >
              <Text style={[
                GlobalStyleSheet.titlefont2,
                {
                  color: currentIndex === 1 ? colors.title : colors.text,
                  textAlign: 'center'
                }
              ]}>
                {followingCount} Following
              </Text>
            </TouchableOpacity>

            <Animated.View
              style={{
                backgroundColor: colors.title,
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

        {/* Horizontal Scroll View for Tabs */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e: any) => {
            const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SIZES.width);
            setCurrentIndex(pageIndex);
          }}
          scrollEventThrottle={16}
        >
          {/* Followers Tab */}
          <View style={[GlobalStyleSheet.container, { padding: 0, width: SIZES.width }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={GlobalStyleSheet.container}>
                {/* Search Bar */}
                <View style={{ marginTop: 10, paddingHorizontal: 15 }}>
                  <TextInput
                    placeholder='Search followers...'
                    placeholderTextColor={colors.placeholder}
                    style={[
                      GlobalStyleSheet.inputBox,
                      {
                        backgroundColor: colors.input,
                        paddingLeft: 15,
                      },
                    ]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* Section Title */}
              <View style={{ paddingHorizontal: 15, marginVertical: 10 }}>
                <Text style={{ ...FONTS.fontRegular, ...FONTS.h6, color: colors.title }}>
                  {activeAccountType === 'Creator' ? 'All Followers' : 'Followers'}
                </Text>
              </View>

              {/* Followers List */}
              {filterData(followers).length > 0 ? (
                filterData(followers).map((data: any) => renderUserItem(data, true))
              ) : (
                <View style={{ paddingHorizontal: 15, alignItems: 'center', marginTop: 50 }}>
                  <Text style={{ ...FONTS.fontRegular, color: colors.text, textAlign: 'center' }}>
                    {searchQuery ? 'No followers match your search' : 'No followers yet'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Following Tab */}
          <View style={[GlobalStyleSheet.container, { padding: 0, width: SIZES.width }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={GlobalStyleSheet.container}>
                {/* Search Bar */}
                <View style={{ marginTop: 10, paddingHorizontal: 15 }}>
                  <TextInput
                    placeholder='Search following...'
                    placeholderTextColor={colors.placeholder}
                    style={[
                      GlobalStyleSheet.inputBox,
                      {
                        backgroundColor: colors.input,
                        paddingLeft: 15,
                      },
                    ]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* Section Title */}
              <View style={{ paddingHorizontal: 15, marginVertical: 10 }}>
                <Text style={{ ...FONTS.fontRegular, ...FONTS.h6, color: colors.title }}>
                  Following
                </Text>
              </View>

              {/* Following List */}
              {filterData(following).length > 0 ? (
                filterData(following).map((data: any) => renderUserItem(data, false))
              ) : (
                <View style={{ paddingHorizontal: 15, alignItems: 'center', marginTop: 50 }}>
                  <Text style={{ ...FONTS.fontRegular, color: colors.text, textAlign: 'center' }}>
                    {searchQuery ? 'No following match your search' : 'Not following anyone yet'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      <ChatoptionSheet
        ref={moresheet}
        deleteChat={false}
      />
    </SafeAreaView>
  );
};

export default Followers;