

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Share,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONTS, IMAGES, SIZES } from "../../constants/theme";
import { GlobalStyleSheet } from "../../constants/styleSheet";
import { LinearGradient } from "expo-linear-gradient";
import Followbtn from "../../components/button/Followbtn";
import Sharebtn from "../../components/button/Sharebtn";
import { useTheme, useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AnotherProfile = () => {
  const scrollRef = useRef<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
    const [postCount, setPostCount] = useState<number>(0);
  

  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { feedId } = route.params || {};
  // convert a backend path to full URL
const buildUrl = (path: string | undefined | null) => {
  if (!path || path === 'Unknown') return null;
  return `https://ddbb.onrender.com/${path.replace(/\\/g, '/')}`;
};


  // Fetch backend profile + posts
useEffect(() => {
  const fetchCreatorProfile = async () => {
    if (!feedId) return;
    try {
      // 🔹 get token from storage
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('No token found, user might not be logged in');
        return;
      }

      // 🔹 include it in the headers
      const res = await fetch(
        `https://ddbb.onrender.com/api/get/creator/detail/feed/${feedId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json();

      if (res.ok) {
        // ✅ fix avatar URL before putting into state
        const fixedProfile = {
          ...result.data.profile,
          profileAvatar: buildUrl(result.data.profile?.profileAvatar),
        };
        setProfile(fixedProfile);
      } else {
        console.log('API error:', result.message);
      }
    } catch (err) {
      console.log('Error fetching creator profile:', err);
    }
  };

  fetchCreatorProfile();
}, [feedId]);

useEffect(() => {
  const fetchFeeds = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(
        'https://ddbb.onrender.com/api/creator/get/post',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      const feeds = data.feeds || [];

      // ✅ build posts with full URL
      const imagePosts = feeds.map(feed => ({
        id: feed.feedId,
        imageUrl: buildUrl(feed.contentUrl),
      }));

      setPosts(imagePosts);
      setPostCount(imagePosts.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchFeeds();
}, []);



  const slideIndicator = scrollX.interpolate({
    inputRange: [0, SIZES.width],
    outputRange: [0, (SIZES.width - 30) / 2],
    extrapolate: "clamp",
  });

  const onPressTouch = (val: any) => {
    setCurrentIndex(val);
    scrollRef.current?.scrollTo({
      x: SIZES.width * val,
      animated: true,
    });
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: "Share your profile link here.",
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const [show, setShow] = useState(true);


 return (
  <SafeAreaView
    style={[
      GlobalStyleSheet.container,
      {
        padding: 0,
        backgroundColor: theme.dark ? colors.background : colors.card,
        flex: 1,
      },
    ]}
  >
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* 🔹 Background + Profile Info */}
      <ImageBackground
        style={{
          width: "100%",
          height: 360,
          borderBottomLeftRadius: 25,
          borderBottomRightRadius: 25,
          overflow: "hidden",
        }}
        source={IMAGES.profilebackground}
      >
        <View style={GlobalStyleSheet.container}>
          <View style={[GlobalStyleSheet.flexalingjust, { marginTop: 10 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image
                style={{ width: 18, height: 18, tintColor: "#fff" }}
                source={IMAGES.arrowleft}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onShare}>
              <View style={GlobalStyleSheet.background}>
                <Image
                  style={[GlobalStyleSheet.image, { tintColor: COLORS.white }]}
                  source={IMAGES.share}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Picture */}
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <TouchableOpacity>
            <View
              style={{
                backgroundColor: "rgba(217, 217, 217, .6)",
                height: 110,
                width: 110,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                style={{ width: 100, height: 100, borderRadius: 100 }}
                source={{
                  uri:
                    profile?.profileAvatar ||
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                }}
              />
            </View>
          </TouchableOpacity>

          {/* Name + Username */}
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text
              style={{ ...FONTS.h6, ...FONTS.fontMedium, color: COLORS.white }}
            >
              {profile?.displayName}
            </Text>
            <Text
              style={{
                ...FONTS.font,
                ...FONTS.fontRegular,
                color: COLORS.white,
                opacity: 0.6,
                marginTop: 5,
              }}
            >
              @{profile?.userName}
            </Text>


            

          </View>

          
        </View>

        
      </ImageBackground>
{/* 
{profile.bio ? (
  <View style={{ marginTop: 15, marginHorizontal: 20 }}>
    <Text
      style={{
        ...FONTS.font,
        fontSize: 14,
        lineHeight: 20,
        color: colors.title,
        textAlign: "center",
      }}
    >
      {profile.bio}
    </Text>
  </View>
) : null} */}
 

      {/* 🔹 Buttons */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginTop: 20,
        }}
      >
        {show ? (
          <Followbtn title="Follow" onPress={() => setShow(!show)} />
        ) : (
          <Sharebtn title="Following" onPress={() => setShow(!show)} />
        )}
        <Sharebtn
          onPress={() => navigation.navigate("SingleChat")}
          title="Message"
        />
      </View>

      {/* 🔹 Tabs: Posts / Reels */}
      <View style={GlobalStyleSheet.container}>
        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => onPressTouch(0)}
            style={GlobalStyleSheet.TouchableOpacity2}
          >
            <Text
              style={[
                { ...FONTS.fontMedium, fontSize: 14, color: "#475A77" },
                currentIndex == 0 && { color: COLORS.primary },
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onPressTouch(1)}
            style={GlobalStyleSheet.TouchableOpacity2}
          >
            <Text
              style={[
                { ...FONTS.fontMedium, fontSize: 14, color: "#475A77" },
                currentIndex == 1 && { color: COLORS.primary },
              ]}
            >
              Reels
            </Text>
          </TouchableOpacity>
          <Animated.View
            style={{
              backgroundColor: COLORS.primary,
              width: "50%",
              height: 2,
              position: "absolute",
              bottom: 0,
              left: 0,
              transform: [{ translateX: slideIndicator }],
            }}
          />
        </View>
      </View>

      {/* 🔹 Posts & Reels Content */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        ref={scrollRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e: any) => {
          const page = e.nativeEvent.contentOffset.x / SIZES.width;
          setCurrentIndex(page);
        }}
      >
        {/* Posts Grid */}
        <View
          style={[
            GlobalStyleSheet.container,
            { marginTop: 5, width: SIZES.width, padding: 0 },
          ]}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
           {posts.map(item => (
  <View key={item.id} style={{ width: '33.33%' }}>
    <TouchableOpacity
      style={{ padding: 2 }}
      onPress={() => navigation.navigate('ProfilePost', { postId: item.id })}
    >
      <Image
        style={{ width: '100%', aspectRatio: 1 }}
        source={{ uri: item.imageUrl }}   // ✅ this now exists
      />
    </TouchableOpacity>
  </View>
))}

          </View>
        </View>

        {/* Reels Grid */}
        <View
          style={[
            GlobalStyleSheet.container,
            { marginTop: 5, width: SIZES.width, padding: 0 },
          ]}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {reels.map((item, index) => (
              <View key={index} style={{ width: "33.33%", padding: 2 }}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("ProfileReels", { reelId: item._id })
                  }
                >
                  <Image
                    style={{ width: "100%", aspectRatio: 1 / 1.9 }}
                    source={{
                      uri: `https://ddbb.onrender.com/${item.videoThumb}`,
                    }}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  </SafeAreaView>
);

};

export default AnotherProfile;
