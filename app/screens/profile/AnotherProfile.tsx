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
  RefreshControl,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONTS, IMAGES, SIZES } from "../../constants/theme";
import { GlobalStyleSheet } from "../../constants/styleSheet";
import Followbtn from "../../components/button/Followbtn";
import Sharebtn from "../../components/button/Sharebtn";
import { useTheme, useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../apiInterpretor/apiInterceptor";

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [creatorFollowerCount, setcreatorFollowerCount] = useState<number>(0);
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [followingCount, setfollowingCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  // Bio read more states
  const [bioHeight, setBioHeight] = useState(0);
  const [bioTextHeight, setBioTextHeight] = useState(0);
  const [showFullBio, setShowFullBio] = useState(false);
  const [isBioTruncated, setIsBioTruncated] = useState(false);

  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { feedId, profileUserId, roleRef } = route.params || {};

  // currentUserId
  useEffect(() => {
    const getUser = async () => {
      const stored = await AsyncStorage.getItem("userId");
      if (stored) {
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

  useEffect(() => {
    fetchCreatorProfile();
  }, [profileUserId, roleRef]);

  // Fetch posts
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
          likeCount: feed.likeCount || 0,
        }));

      const videoReels = feeds
        .filter((feed) => feed.contentUrl.endsWith(".mp4"))
        .map((feed) => ({
          _id: feed.feedId,
          videoThumb: feed.contentUrl
            .replace("/video/upload/", "/video/upload/so_0/")
            .replace(".mp4", ".jpg"),
          views: feed.likeCount || 0,
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

  useEffect(() => {
    fetchFeeds();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchCreatorProfile(), fetchFeeds()]);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Bio text measurement
  const onBioLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setBioTextHeight(height);

    // If bio height is more than 3 lines (approximately 54-60px for 18px line height)
    // Show "Read More" button
    if (height > 60) {
      setIsBioTruncated(true);
    } else {
      setIsBioTruncated(false);
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

  const handleFollow = async () => {
    try {
      setFollowLoading(true);
      // Optimistic update for instant UI feedback
      setIsFollowing(true);
      setcreatorFollowerCount((prev) => prev + 1);

      const response = await api.post("/api/user/follow/creator", {
        userId: profileUserId
      });

      console.log("Follow response:", response.data);

      // Refetch the actual counts from server
      const countResponse = await api.get(
        `/api/get/user/detail/at/feed/icon?profileUserId=${profileUserId}&roleRef=${roleRef}`
      );

      if (countResponse.data.success && countResponse.data.profile) {
        setcreatorFollowerCount(countResponse.data.profile.creatorFollowerCount);
        setfollowingCount(countResponse.data.profile.followingCount);
      }
    } catch (err: any) {
      console.error("Follow error:", err);
      const errorMessage = err.response?.data?.message || "Something went wrong";
      Alert.alert("Error", errorMessage);
      // Revert optimistic update on error
      setIsFollowing(false);
      setcreatorFollowerCount((prev) => Math.max(0, prev - 1));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = () => {
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
              setFollowLoading(true);
              // Optimistic UI update
              setIsFollowing(false);
              setcreatorFollowerCount((prev) => Math.max(0, prev - 1));

              const response = await api.post("/api/user/unfollow/creator", {
                userId: profileUserId
              });

              console.log("Unfollow response:", response.data);

              // Refetch the actual counts from server
              const countResponse = await api.get(
                `/api/get/user/detail/at/feed/icon?profileUserId=${profileUserId}&roleRef=${roleRef}`
              );

              if (countResponse.data.success && countResponse.data.profile) {
                setcreatorFollowerCount(countResponse.data.profile.creatorFollowerCount);
                setfollowingCount(countResponse.data.profile.followingCount);
              }
            } catch (err: any) {
              console.error("Unfollow error:", err);
              const errorMessage = err.response?.data?.message || "Something went wrong";
              Alert.alert("Error", errorMessage);
              // Revert optimistic update on error
              setIsFollowing(true);
              setcreatorFollowerCount((prev) => prev + 1);
            } finally {
              setFollowLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const toggleBio = () => {
    setShowFullBio(!showFullBio);
  };

  return (
    <SafeAreaView
      style={[
        GlobalStyleSheet.container,
        {
          padding: 0,
          backgroundColor: colors.card,
          flex: 1,
        },
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
        {/* COVER PHOTO + HEADER */}
        <ImageBackground
          style={{
            width: "100%",
            height: 260,
          }}
          imageStyle={{ resizeMode: "cover" }}
          source={
            profile?.coverPhoto
              ? { uri: profile.coverPhoto }
              : IMAGES.profilebackground
          }
        >
          <View style={[GlobalStyleSheet.container, { marginTop: 10 }]}>
            <View style={GlobalStyleSheet.flexalingjust}>
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
        </ImageBackground>

        {/* WHITE CARD WITH AVATAR + NAME + BIO + STATS */}
        <View
          style={{
            marginTop: -170,
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
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                position: "absolute",
                top: 40,
                left: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(217, 217, 217, .6)",
                  height: 96,
                  width: 96,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
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
                    profile?.profileAvatar
                      ? { uri: profile.profileAvatar }
                      : IMAGES.user
                  }
                  onLoadStart={() => setIsImageLoading(true)}
                  onLoadEnd={() => setIsImageLoading(false)}
                />
              </View>
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
                {profile?.displayName || profile?.userName}
              </Text>

              {!!profile?.userName && (
                <Text
                  style={{
                    ...FONTS.font,
                    ...FONTS.fontRegular,
                    color: COLORS.text,
                    opacity: 0.7,
                    marginTop: 4,
                  }}
                >
                  @{profile?.userName}
                </Text>
              )}
            </View>

            {/* BIO with Read More functionality */}
            {!!profile?.bio && (
              <View style={{ marginLeft: 126, marginRight: 16, marginTop: 12 }}>
                {/* Hidden bio for measuring full height */}
                <Text
                  style={{
                    ...FONTS.font,
                    ...FONTS.fontRegular,
                    color: colors.title,
                    lineHeight: 18,
                    position: "absolute",
                    opacity: 0,
                    zIndex: -1,
                  }}
                  onLayout={(event) => {
                    const height = event.nativeEvent.layout.height;
                    // Height of 3 lines ≈ 54px (3 × lineHeight 18)
                    if (height > 54) {
                      setIsBioTruncated(true);
                    } else {
                      setIsBioTruncated(false);
                    }
                  }}
                >
                  {profile?.bio}
                </Text>

                {/* Visible bio */}
                <Text
                  style={{
                    ...FONTS.font,
                    ...FONTS.fontRegular,
                    color: colors.title,
                    lineHeight: 18,
                  }}
                  numberOfLines={showFullBio ? undefined : 3}
                >
                  {profile?.bio}
                </Text>

                {/* Read More button */}
                {isBioTruncated && (
                  <TouchableOpacity onPress={() => setShowFullBio(!showFullBio)} style={{ marginTop: 4 }}>
                    <Text
                      style={{
                        ...FONTS.font,
                        ...FONTS.fontMedium,
                        color: COLORS.primary,
                        fontSize: 13,
                      }}
                    >
                      {showFullBio ? "Show Less" : "Read More"}
                    </Text>
                  </TouchableOpacity>
                )}

              </View>
            )}

            {/* FOLLOW BUTTONS under bio */}
            {currentUserId !== profileUserId && roleRef !== "Admin" && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 36,
                  paddingHorizontal: 10,
                }}
              >
                {!isFollowing ? (
                  // FOLLOW BUTTON
                  <TouchableOpacity
                    onPress={handleFollow}
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.primary,
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                    disabled={followLoading}
                  >
                    <Text style={{ color: COLORS.white, ...FONTS.fontMedium }}>
                      {followLoading ? "Please wait..." : "Follow"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  // FOLLOWING + UNFOLLOW BUTTONS
                  <>
                    <TouchableOpacity
                      disabled
                      style={{
                        flex: 1,
                        marginRight: 6,
                        backgroundColor: "#eee",
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "black", ...FONTS.fontMedium }}>
                        Following
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleUnfollow}
                      style={{
                        flex: 1,
                        marginLeft: 6,
                        backgroundColor: colors.card,
                        paddingVertical: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: COLORS.primary,
                        alignItems: "center",
                      }}
                      disabled={followLoading}
                    >
                      <Text style={{ color: COLORS.primary, ...FONTS.fontMedium }}>
                        Unfollow
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Stats row: Posts / Followers / Following */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 18,
              }}
            >
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={GlobalStyleSheet.textfont2}>{posts.length}</Text>
                <Text style={GlobalStyleSheet.titlefont}>Posts</Text>
              </View>

              <TouchableOpacity
                style={{ alignItems: "center", flex: 1 }}
                onPress={() => navigation.navigate("Followers", {
                  profileUserId: profileUserId,
                  roleRef: roleRef,
                  initialTab: 0 // Start on Followers tab
                })}
              >
                <Text style={GlobalStyleSheet.textfont2}>{creatorFollowerCount}</Text>
                <Text style={GlobalStyleSheet.titlefont}>Followers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: "center", flex: 1 }}
                onPress={() => navigation.navigate("Followers", {
                  profileUserId: profileUserId,
                  roleRef: roleRef,
                  initialTab: 1 // Start on Following tab
                })}
              >
                <Text style={GlobalStyleSheet.textfont2}>{followingCount}</Text>
                <Text style={GlobalStyleSheet.titlefont}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* POSTS / REELS TABS & CONTENT */}
        <View style={{ marginTop: 20, marginBottom: 20 }}>
          {/* Tabs */}
          <View style={GlobalStyleSheet.container}>
            <View
              style={{
                flexDirection: "row",
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
                    { width: 16, height: 16, tintColor: "#475A77" },
                    currentIndex === 0 && { tintColor: COLORS.primary },
                  ]}
                  source={IMAGES.profilepic}
                />
                <Text
                  style={[
                    {
                      ...FONTS.fontMedium,
                      fontSize: 14,
                      color: "#475A77",
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
                    { width: 16, height: 16, tintColor: "#475A77" },
                    currentIndex === 1 && { tintColor: COLORS.primary },
                  ]}
                  source={IMAGES.reels}
                />
                <Text
                  style={[
                    {
                      ...FONTS.fontMedium,
                      fontSize: 14,
                      color: "#475A77",
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

          {/* Tab Content */}
          {loading ? (
            <View
              style={{
                height: SIZES.height * 0.4,
                justifyContent: "center",
                alignItems: "center",
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
                {posts.length === 0 ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      height: SIZES.height - 250,
                    }}
                  >
                    <Text style={{ color: colors.text }}>No posts yet</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {posts.map((item, index) => (
                      <View key={item.id} style={{ width: "33.33%" }}>
                        <TouchableOpacity
                          style={{ padding: 2 }}
                          onPress={() =>
                            navigation.navigate("ProfilePost", { postId: item.id })
                          }
                        >
                          <Image
                            style={{
                              width: "100%",
                              height: null,
                              aspectRatio: 1,
                            }}
                            source={{ uri: item.imageUrl }}
                          />
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 5,
                              alignItems: "center",
                              backgroundColor: "rgba(255, 255, 255, 0.20)",
                              position: "absolute",
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
                                resizeMode: "contain",
                                tintColor: "#fff",
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
                              {item.likeCount || 0}
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
                {reels.length === 0 ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      height: SIZES.height - 250,
                    }}
                  >
                    <Text style={{ color: colors.text }}>No reels yet</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {reels.map((item, index) => (
                      <View
                        key={index}
                        style={{ width: "33.33%", padding: 2 }}
                      >
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("ProfileReels", { reelId: item._id })
                          }
                        >
                          <Image
                            style={{
                              width: "100%",
                              height: null,
                              aspectRatio: 1 / 1.9,
                            }}
                            source={{ uri: item.videoThumb }}
                          />
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 5,
                              alignItems: "center",
                              backgroundColor: "rgba(255, 255, 255, 0.20)",
                              position: "absolute",
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
                                resizeMode: "contain",
                                tintColor: "#fff",
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
                              {item.views || 0}
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

export default AnotherProfile;