

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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONTS, IMAGES, SIZES } from "../../constants/theme";
import { GlobalStyleSheet } from "../../constants/styleSheet";
import { LinearGradient } from "expo-linear-gradient";
import Followbtn from "../../components/button/Followbtn";
import Sharebtn from "../../components/button/Sharebtn";
import { useTheme, useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../apiInterpretor/apiInterceptor";

const AnotherProfile = () => {
  const scrollRef = useRef<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [userId, setUserId] = useState(null);
 const [currentUserId, setCurrentUserId] = useState(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [postCount, setPostCount] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState(false); // Track follow status
  const [followLoading, setFollowLoading] = useState(false);
  const [creatorFollowerCount, setcreatorFollowerCount] = useState<number>(0); // New state for followers count
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true); // New state for image loading
  const [followingCount, setfollowingCount] = useState<number>(0); // New state for followers count
  const[FollowersCount,setFollowersCount] =useState<number>(0);


  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { feedId,profileUserId,roleRef } = route.params || {};

 




//currentUserId
useEffect(() => {
  const getUser = async () => {
    const stored = await AsyncStorage.getItem("userId");
    if (stored) {
      // stored is already a string ID
      setCurrentUserId(stored);
    }
  };
  getUser();
}, []);


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

  // Fetch backend profile
 useEffect(() => {
  const fetchCreatorProfile = async () => {
    if (!profileUserId || !roleRef) {
      console.log("Missing profileUserId or roleRef");
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(
        `/api/get/user/detail/at/feed/icon?profileUserId=${profileUserId}&roleRef=${roleRef}`
      );

      console.log("API response for creator profile:", response.data);

      if (response.data.success && response.data.profile) {
        setProfile(response.data.profile);
        setIsFollowing(response.data.profile.isFollowing);
        setfollowingCount(response.data.profile.followingCount);
        setcreatorFollowerCount(response.data.profile.creatorFollowerCount);
      } else {
        console.warn("Failed to fetch profile:", response.data.message);
      }
    } catch (err) {
      console.log("Error fetching creator profile:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchCreatorProfile();
}, [profileUserId, roleRef]);




  // Fetch posts
 useEffect(() => {
  const fetchFeeds = async () => {
    try {
      setLoading(true);

      const profileUserId = route?.params?.profileUserId;
      if (!profileUserId) {
        console.warn("No profileUserId provided");
      }

      const response = await api.post("/api/user/get/post", {
        profileUserId: profileUserId,
      });

      const data = response.data;
      console.log("API response for posts:", data);

      const feeds = data.feeds || [];

      const imagePosts = feeds
        .filter((feed) => !feed.contentUrl.endsWith(".mp4"))
        .map((feed) => ({
          id: feed.feedId,
          imageUrl: feed.contentUrl,
        }));

      const videoReels = feeds
        .filter((feed) => feed.contentUrl.endsWith(".mp4"))
        .map((feed) => ({
          _id: feed.feedId,
          videoThumb: feed.contentUrl
            .replace("/video/upload/", "/video/upload/so_0/")
            .replace(".mp4", ".jpg"),
        }));

      setPosts(imagePosts);
      setReels(videoReels);
      setPostCount(imagePosts.length);
    } catch (err) {
      console.error("Error fetching posts:", err);
      Alert.alert("Error", "Something went wrong while loading posts");
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
              {isImageLoading && (
                <ActivityIndicator
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: [{ translateX: -10 }, { translateY: -10 }],
                  }}
                  size="small"
                  color={colors.primary}
                />
              )}
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
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 100,
                    opacity: isImageLoading ? 0.2 : 1,
                  }}
                  source={{
                    uri: profile?.profileAvatar,
                  }}
                  onLoadStart={() => setIsImageLoading(true)}
                  onLoadEnd={() => setIsImageLoading(false)}
                />
              </View>
            </TouchableOpacity>

            {/* Name + Username + Followers Count */}
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
              <View style={{ backgroundColor: 'rgba(255, 255, 255, .1)', height: 70, width: 200, borderRadius: 12, marginTop: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
             <View style={{ width: '50%' }}>
                <TouchableOpacity style={{ alignItems: 'center' }}>
                  <Text style={GlobalStyleSheet.textfont2}>{creatorFollowerCount}</Text>
                   <Text style={GlobalStyleSheet.titlefont}>Followers</Text>  
                  </TouchableOpacity>
              </View>

                 <View style={{ width: '50%' }}>
                <TouchableOpacity style={{ alignItems: 'center' }}>
                  <Text style={GlobalStyleSheet.textfont2}>{followingCount}</Text>
                   <Text style={GlobalStyleSheet.titlefont}>Following</Text>  
                  </TouchableOpacity>
              </View>
              </View>       

            </View>
          </View>
        </ImageBackground>
  
 {currentUserId !== profileUserId && roleRef !== "Admin" && (
   <View
    style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  }}
>
  {!isFollowing ? (
    // FOLLOW BUTTON
    <Followbtn
      title={followLoading ? "Please wait..." : "Follow"}
      onPress={async () => {
        try {
          // Optimistic update for instant UI feedback
          setIsFollowing(true);
          setFollowersCount((prev) => prev + 1);
          setFollowLoading(true);

          const response = await api.post("/api/user/follow/creator", {
            userId: profileUserId
          });

          console.log("Follow response:", response.data);
        } catch (err) {
          console.error("Follow error:", err);
          Alert.alert("Error", "Something went wrong");
          setIsFollowing(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
        } finally {
          setFollowLoading(false);
        }
      }}
    />
  ) : (
    <>
    {/* FOLLOWING BUTTON - Just for View */}
      <TouchableOpacity
        disabled
        style={{
          backgroundColor: "#eee",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "black", fontWeight: "500" }}>Following</Text>
      </TouchableOpacity>
      {/* UNFOLLOW BUTTON - shows instantly after Follow */}
      <TouchableOpacity
        style={{
          backgroundColor: "#eee",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 10,
        }}
        onPress={() => {
          Alert.alert(
            "Unfollow",
            `Unfollow @${profile?.userName}?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Unfollow",
                style: "destructive",
                onPress: async () => {
                  try {
                    // Optimistic UI update
                    setIsFollowing(false);
                    setFollowersCount((prev) => Math.max(0, prev - 1));
                    setFollowLoading(true);

                    const response = await api.post("/api/user/unfollow/creator", {
                      userId: profileUserId
                    });

                    console.log("Unfollow response:", response.data);
                  } catch (err) {
                    console.error("Unfollow error:", err);
                    Alert.alert("Error", "Something went wrong");
                    setIsFollowing(true);
                    setFollowersCount((prev) => prev + 1);
                  } finally {
                    setFollowLoading(false);
                  }
                },
              },
            ],
            { cancelable: true }
          );
        }}
      >
        <Text style={{ color: "#000", fontWeight: "500" }}>Unfollow</Text>
      </TouchableOpacity>
    </>
  )}
</View>
)}


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
              {posts.map((item) => (
                <View key={item.id} style={{ width: "33.33%" }}>
                  <TouchableOpacity
                    style={{ padding: 2 }}
                    onPress={() =>
                      navigation.navigate("ProfilePost", { postId: item.id })
                    }
                  >
                    <Image
                      style={{ width: "100%", aspectRatio: 1 }}
                      source={{ uri: item.imageUrl }}
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
                        uri: item.videoThumb,
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