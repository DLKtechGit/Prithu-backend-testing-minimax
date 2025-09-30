import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
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

type SaveScreenProps = StackScreenProps<RootStackParamList, 'Save'>;

const Save = ({ navigation }: SaveScreenProps) => {
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

//  Fetch Saved Feeds
const fetchSavedFeeds = async () => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem("userToken");
    console.log("🔑 Retrieved token:", token);

    if (!token) {
      console.log("❌ No token found in AsyncStorage");
      setLoading(false);
      return;
    }

    const res = await axios.get(
      "http://192.168.1.6:5000/api/user/get/saved/feeds",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ API Response:", res.data);

    const allFeeds = res.data.savedFeeds || [];

    // Separate images & videos by type
    const images = allFeeds.filter((feed: any) => feed.type === "image");
    const videos = allFeeds.filter((feed: any) => feed.type === "video");

    // Map images
    setProfilePosts(
      images.map((f: any) => ({
        image: f.contentUrl,
        likeCount: f.likeCount,
      }))
    );

    // Map videos with thumbnail URL
    setReelsPosts(
      videos.map((f: any) => ({
        thumbnail: f.contentUrl.replace("/video/upload/", "/video/upload/so_0/").replace(".mp4", ".jpg"),
        videoUrl: f.contentUrl, // Store the actual video URL for playback
        views: f.views || 0,
      }))
    );
  } catch (err: any) {
    console.log(
      "❌ Error fetching saved feeds:",
      err.response?.data || err.message
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchSavedFeeds();
  }, []);

  return (
    <SafeAreaView
      style={[
        GlobalStyleSheet.container,
        { padding: 0, backgroundColor: colors.card, flex: 1 },
      ]}
    >
      <Header title="All Posts" />
      <View style={{ backgroundColor: colors.card, flex: 1 }}>
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
                    currentIndex == 0 && { tintColor: COLORS.primary },
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
                    currentIndex == 0 && { color: COLORS.primary },
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
                    currentIndex == 1 && { tintColor: COLORS.primary },
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
                    currentIndex == 1 && { color: COLORS.primary },
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
                e.nativeEvent.contentOffset.x.toFixed(0) ==
                SIZES.width.toFixed(0)
              ) {
                setCurrentIndex(1);
              } else if (e.nativeEvent.contentOffset.x.toFixed(0) == 0) {
                setCurrentIndex(0);
              } else {
                setCurrentIndex(0);
              }
            }}
          >
            {/* Saved Posts */}
            <View
              style={[
                GlobalStyleSheet.container,
                { marginTop: 5, width: SIZES.width, padding: 0 },
              ]}
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {profilePosts.map((data: any, index) => {
                  return (
                    <View key={index} style={[{ width: '33.33%' }]}>
                      <TouchableOpacity
                        style={{ padding: 2 }}
                        onPress={() => navigation.navigate('Savepost', { data })}
                      >
                        <Image
                          style={{ width: '100%', height: null, aspectRatio: 1 }}
                          source={{ uri: data.image }} // <-- from backend
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
                              lineHeight: 14,
                            }}
                          >
                            {data.likeCount || 0}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Saved Reels */}
            <View
              style={[
                GlobalStyleSheet.container,
                { marginTop: 5, width: SIZES.width, padding: 0 },
              ]}
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {reelsPosts.map((data: any, index) => {
                  return (
                    <View key={index} style={{ width: '33.33%', padding: 2 }}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('SaveReels', { data })}
                      >
                        <Image
                          style={{
                            width: '100%',
                            height: null,
                            aspectRatio: 1 / 1.9,
                          }}
                          source={{ uri: data.thumbnail }} // <-- backend reel thumbnail
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
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Save;
