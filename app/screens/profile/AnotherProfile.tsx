

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

const AnotherProfile = () => {
  const scrollRef = useRef<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [postCount, setPostCount] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState(false); // Track follow status
  const [followersCount, setFollowersCount] = useState<number>(0); // New state for followers count
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true); // New state for image loading

  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { feedId, accountId } = route.params || {};

  console.log("feedId", feedId);
  console.log("accountId", accountId);

  // Convert a backend path to full URL
  const buildUrl = (path: string | undefined | null) => {
    if (!path || path === "Unknown") return null;
    return `http://192.168.1.7:5000/${path.replace(/\\/g, "/")}`;
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

  // Fetch backend profile
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      if (!feedId) {
        console.log("No feedId provided");
        return;
      }
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.warn("No token found, user might not be logged in");
          return;
        }

        const res = await fetch(
          `http://192.168.1.7:5000/api/get/creator/detail/feed/${feedId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await res.json();
        console.log("API response for creator profile:", result);

        if (res.ok) {
          const fixedProfile = {
            ...result.data.profile,
            profileAvatar: result.data.profile.profileAvatar,
            accountId: result.data.accountId, // Use accountId from API response
          };
          setProfile(fixedProfile);
          setFollowersCount(result.data.followersCount || 0); // Set followers count from response

          // ✅ First check backend response (if it has isFollowing)
          if (result.data.isFollowing !== undefined) {
            setIsFollowing(result.data.isFollowing);
            await AsyncStorage.setItem(
              `follow_status_${fixedProfile.accountId}`,
              JSON.stringify(result.data.isFollowing)
            );
          } else {
            // ✅ Fallback: check AsyncStorage
            const savedStatus = await AsyncStorage.getItem(
              `follow_status_${fixedProfile.accountId}`
            );
            if (savedStatus !== null) {
              setIsFollowing(JSON.parse(savedStatus));
            } else {
              setIsFollowing(false); // default
            }
          }
        }
      } catch (err) {
        console.log("Error fetching creator profile:", err);
      }
    };

    fetchCreatorProfile();
  }, [feedId]);

  // Fetch posts
  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          Alert.alert("Error", "User not authenticated");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://192.168.1.7:5000/api/creator/get/post",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json", // ✅ tell backend it's JSON
              Authorization: `Bearer ${token}`, // ✅ your auth token
            },
            body: JSON.stringify({ accountId: accountId }), // ✅ send feedId in body
          }
        );

        const data = await response.json();
        console.log("API response for posts:", data);
        const feeds = data.feeds || [];

        const imagePosts = feeds.filter((feed) => !feed.contentUrl.endsWith('.mp4')).map((feed) => ({
          id: feed.feedId,
          imageUrl: feed.contentUrl,
        }));

        const videoReels = feeds.filter((feed) => feed.contentUrl.endsWith('.mp4')).map((feed) => ({
          _id: feed.feedId,
          videoThumb: feed.contentUrl.replace('/video/upload/', '/video/upload/so_0/').replace('.mp4', '.jpg'),
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

  // Handle follow
  const handleFollow = async () => {
    if (!profile.accountId) {
      Alert.alert("Error", "Creator account ID not available");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const res = await fetch(
        "http://192.168.1.7:5000/api/user/follow/creator",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ accountId: profile.accountId }),
        }
      );

      const result = await res.json();
      console.log("Follow API response:", result);

      if (res.ok) {
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1); // Increment followers count
        await AsyncStorage.setItem(
          `follow_status_${profile.accountId}`,
          JSON.stringify(true)
        );
        Alert.alert("Success", "Followed successfully");
      } else if (result.message === "You already followed this Creator") {
        setIsFollowing(true); // Ensure button shows "Unfollow" if already following
        Alert.alert("Info", "You are already following this creator");
      } else {
        Alert.alert("Error", result.message || "Failed to follow creator");
      }
    } catch (err) {
      console.error("Error following creator:", err);
      Alert.alert("Error", "Something went wrong while following creator");
    }
  };

  // Handle unfollow
  const handleUnfollow = async () => {
    if (!profile.accountId) {
      Alert.alert("Error", "Creator account ID not available");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");
      console.log(token);
      if (!token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const res = await fetch(
        "http://192.168.1.7:5000/api/user/unfollow/creator",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ accountId: profile.accountId }),
        }
      );

      const result = await res.json();
      console.log("Unfollow API response:", result);

      if (res.ok) {
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1)); // Decrement followers count, ensure non-negative
        await AsyncStorage.setItem(
          `follow_status_${profile.accountId}`,
          JSON.stringify(false)
        );
        Alert.alert("Success", "Unfollowed successfully");
      } else {
        Alert.alert("Error", result.message || "Failed to unfollow creator");
      }
    } catch (err) {
      console.error("Error unfollowing creator:", err);
      Alert.alert("Error", "Something went wrong while unfollowing creator");
    }
  };

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
                  <Text style={GlobalStyleSheet.textfont2}>{followersCount}</Text>
                   <Text style={GlobalStyleSheet.titlefont}>Followers</Text>
                     
                 </TouchableOpacity>
              </View>
              </View>       

            </View>
          </View>
        </ImageBackground>

        {/* 🔹 Buttons */}
        {activeAccountType === "Personal" && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginTop: 20,
            }}
          >
            {isFollowing ? (
              <Sharebtn title="Unfollow" onPress={handleUnfollow} />
            ) : (
              <Followbtn title="Follow" onPress={handleFollow} />
            )}
            <Sharebtn
              onPress={() => navigation.navigate("SingleChat")}
              title="Message"
            />
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