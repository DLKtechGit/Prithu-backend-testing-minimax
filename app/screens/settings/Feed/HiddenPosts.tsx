import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlobalStyleSheet } from '../../../constants/styleSheet';
import { ScrollView } from 'react-native-gesture-handler';
import { IMAGES, COLORS, FONTS, SIZES } from '../../../constants/theme';
import Header from '../../../layout/Header';
import { useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../Navigations/RootStackParamList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

type HiddenPostsScreenProps = StackScreenProps<RootStackParamList, 'HiddenPosts'>;

const HiddenPosts = ({ navigation }: HiddenPostsScreenProps) => {
  const scrollRef = useRef<any>();
  const [currentIndex, setCurrentIndex] = useState<any>(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [profilePosts, setProfilePosts] = useState<any[]>([]);
  const [reelsPosts, setReelsPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  // Fetch Hidden Posts
  const fetchHiddenPosts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
       console.log(token)
      if (!token) {
        console.log('❌ No token found in AsyncStorage');
        setLoading(false);
        return;
      }

      // CORRECTED API ENDPOINT
      const res = await axios.get(
        'http://192.168.1.17:5000/api/get/user/hide/post', // Updated endpoint
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('✅ Hidden Posts API Response:', res.data);

      // Check if the response structure matches your backend
      const allHiddenPosts = res.data.data || res.data.hiddenPosts || [];

      // Separate images & videos by contentUrl extension or type field if available
      const images = allHiddenPosts.filter((post: any) => {
        const url = post.contentUrl || post.url || '';
        return url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
      });
      
      const videos = allHiddenPosts.filter((post: any) => {
        const url = post.contentUrl || post.url || '';
        return url.match(/\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i);
      });

      // Map with correct structure
      setProfilePosts(
        images.map((post: any) => ({
          id: post._id,
          image: post.contentUrl || post.url,
        //   likeCount: post.likesCount || post.totalLikes || 0,
          title: post.title || '',
          createdAt: post.createdAt,
          createdBy: post.createdByAccount || post.createdBy,
        }))
      );

      setReelsPosts(
        videos.map((post: any) => ({
          id: post._id,
          thumbnail: post.contentUrl || post.url,
          views: post.views || post.totalViews || 0,
          title: post.title || '',
          createdAt: post.createdAt,
          createdBy: post.createdByAccount || post.createdBy,
        }))
      );
    } catch (err: any) {
      console.log(
        '❌ Error fetching hidden posts:',
        err.response?.data || err.message
      );
      setProfilePosts([]);
      setReelsPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHiddenPosts();
  }, []);

  return (
    <SafeAreaView
      style={[
        GlobalStyleSheet.container,
        { padding: 0, backgroundColor: colors.card, flex: 1 },
      ]}
    >
      <Header title="Hidden Posts" />
      <View style={{ backgroundColor: colors.card, flex: 1 }}>
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={GlobalStyleSheet.container}>
              <View style={{ flexDirection: 'row', marginTop: 0, marginBottom: 0 }}>
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
                if (
                  e.nativeEvent.contentOffset.x.toFixed(0) ===
                  SIZES.width.toFixed(0)
                ) {
                  setCurrentIndex(1);
                } else if (e.nativeEvent.contentOffset.x.toFixed(0) === 0) {
                  setCurrentIndex(0);
                } else {
                  setCurrentIndex(0);
                }
              }}
            >
              {/* Hidden Posts */}
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
                      height: SIZES.height - 200,
                    }}
                  >
                    <Text style={{ color: colors.text, ...FONTS.fontMedium }}>
                      No hidden posts found
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {profilePosts.map((data: any, index) => (
                      <View key={index} style={{ width: '33.33%' }}>
                        <TouchableOpacity
                          style={{ padding: 2 }}
                          onPress={() => navigation.navigate('HiddenPostDetail', { data })}
                        >
                          <Image
                            style={{ width: '100%', height: null, aspectRatio: 1 }}
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
                            {/* <Image
                              style={{
                                width: 10,
                                height: 10,
                                resizeMode: 'contain',
                                tintColor: '#fff',
                              }}
                              source={IMAGES.like}
                            /> */}
                            {/* <Text
                              style={{
                                ...FONTS.fontRegular,
                                fontSize: 10,
                                color: COLORS.white,
                                lineHeight: 14,
                              }}
                            >
                              {data.likeCount || 0}
                            </Text> */}
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Hidden Reels */}
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
                      height: SIZES.height - 200,
                    }}
                  >
                    <Text style={{ color: colors.text, ...FONTS.fontMedium }}>
                      No hidden reels found
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {reelsPosts.map((data: any, index) => (
                      <View key={index} style={{ width: '33.33%', padding: 2 }}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('HiddenReelDetail', { data })}
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
                                lineHeight: 14,
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
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default HiddenPosts;