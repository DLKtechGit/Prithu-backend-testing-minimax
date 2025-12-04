
import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useMemo,
  memo,
  useCallback,
  RefObject
} from "react";
import {
  View,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Animated,
  Text,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import PostCard from "../../components/PostCard";
import { connectSocket } from "../../../webSocket/webScoket";
import { startHeartbeat } from "../../../webSocket/heartBeat";
import api from "../../../apiInterpretor/apiInterceptor";
import { SIZES } from "../../constants/theme";

// --------------------------- Types ----------------------------

interface Post {
  _id: string;
  creatorUsername: string;
  creatorAvatar: string | null;
  timeAgo: string;
  contentUrl: string;
  caption: string;
  tags: string[];
  background: string;
  commentsCount: number;
  likesCount: number;
  type: string;
  profileUserId: string;
  roleRef: string;
  isLiked: boolean;
  isSaved: boolean;
  isDisliked?: boolean;
  dislikesCount?: number;
  primary: string;
  accent: string;
  textColor?: string;
  avatorToUse: string | null;
}

interface PostListProps {
  categoryId?: string | null;
  scrollRef?: RefObject<any>;
  sheetRef?: RefObject<any>;
  optionSheet?: RefObject<any>;
}

export interface PostListHandle {
  refreshPosts: () => Promise<void>;
  scrollToTop: () => void;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handlePull: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

// --------------------------- Helpers ----------------------------

const { height: windowHeight } = Dimensions.get("window");

const MemoPostCard = memo(PostCard, (prev, next) =>
  prev.visibleBoxes === next.visibleBoxes &&
  prev.postimage?.[0]?.image === next.postimage?.[0]?.image &&
  prev.caption === next.caption &&
  prev.like === next.like &&
  prev.isLiked === next.isLiked &&
  prev.commentsCount === next.commentsCount
);

const shuffleArray = <T,>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
// --------------------------- Skeleton Loader Component ----------------------------

const SkeletonPostCard = () => {
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
    <View style={styles.skeletonCard}>
      {/* Header: Avatar, Username, Timestamp */}
      <View style={styles.skeletonHeader}>
        <Animated.View
          style={[
            styles.skeletonAvatar,
            { opacity: shimmerOpacity }
          ]}
        />
        <View style={styles.skeletonTextContainer}>
          <Animated.View
            style={[
              styles.skeletonText,
              { width: "60%", opacity: shimmerOpacity }
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonText,
              { width: "40%", marginTop: 5, opacity: shimmerOpacity }
            ]}
          />
        </View>
        <Animated.View
          style={[
            styles.skeletonMoreIcon,
            { opacity: shimmerOpacity }
          ]}
        />
      </View>
      {/* Main Image */}
      <Animated.View
        style={[
          styles.skeletonImage,
          { opacity: shimmerOpacity }
        ]}
      />
      {/* Footer: Actions and Caption */}
      <View style={styles.skeletonFooter}>
        <View style={styles.skeletonActions}>
          <Animated.View
            style={[
              styles.skeletonActionButton,
              { opacity: shimmerOpacity }
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonActionButton,
              { marginLeft: 15, opacity: shimmerOpacity }
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonActionButton,
              { marginLeft: 15, opacity: shimmerOpacity }
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonActionButton,
              { marginLeft: 15, opacity: shimmerOpacity }
            ]}
          />
        </View>
        <Animated.View
          style={[
            styles.skeletonText,
            { width: "80%", marginTop: 10, opacity: shimmerOpacity }
          ]}
        />
      </View>
    </View>
  );
};

// --------------------------- Component ----------------------------

const PostList = forwardRef<PostListHandle, PostListProps>(
  ({ scrollRef, categoryId, sheetRef, optionSheet }, ref) => {
    const [visibleBoxes, setVisibleBoxes] = useState<string[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshingTop, setRefreshingTop] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const boxRefs = useRef<Record<string, { y: number; height: number }>>({});
    const viewedPosts = useRef<Set<string>>(new Set());
    const abortControllerRef = useRef<AbortController | null>(null);
    const latestRequestIdRef = useRef<number>(0);
    const ongoingRequestsRef = useRef<Set<string>>(new Set()); // Track ongoing requests

    const [userProfile, setUserProfile] = useState<any>(null);
    const [visibilitySettings, setVisibilitySettings] = useState<any>(null);

    // Fetch user profile and visibility once
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const [profileRes, visRes] = await Promise.all([
            api.get('/api/get/profile/detail'),
            api.get('/api/profile/visibility')
          ]);

          if (profileRes.data?.profile) {
            setUserProfile(profileRes.data.profile);
          }

          if (visRes.data?.success) {
            setVisibilitySettings(visRes.data.visibility);
          }
        } catch (e) {
          console.log("Error fetching user data:", e);
        }
      };
      fetchUserData();
    }, []);

    // --------------------------- Fetch Posts ----------------------------

    const fetchPosts = useCallback(async (catId: string | null = null, pageNum: number = 1, retryCount: number = 0) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY_BASE = 1000; // Start with 1 second
      const CACHE_DURATION = 30000; // 30 seconds cache

      // Request deduplication - prevent multiple requests for the same page
      const requestKey = `${catId || 'all'}_${pageNum}`;

      // Check cache first (only for page 1)
      if (pageNum === 1 && lastFetchTime > 0) {
        const timeSinceLastFetch = Date.now() - lastFetchTime;
        if (timeSinceLastFetch < CACHE_DURATION) {
          console.log(`💾 Using cached data (${Math.round(timeSinceLastFetch / 1000)}s old)`);
          return;
        }
      }

      if (ongoingRequestsRef.current.has(requestKey)) {
        console.log(`⏸️ Request already in progress for ${requestKey}, skipping...`);
        return;
      }

      ongoingRequestsRef.current.add(requestKey);

      // Create unique request ID
      const requestId = ++latestRequestIdRef.current;

      // Abort previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        setError(null);

        // Check if user is authenticated
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          setError("Please log in to view posts");
          setPosts([]);
          ongoingRequestsRef.current.delete(requestKey);
          return;
        }

        // Set loading state
        if (pageNum === 1 && !catId) {
          setLoading(true);
        } else if (pageNum > 1) {
          setIsFetchingMore(true);
        }

        const limit = 10;
        const endpoint = catId
          ? `/api/user/get/feed/with/cat/${catId}?page=${pageNum}&limit=${limit}`
          : `/api/get/all/feeds/user?page=${pageNum}&limit=${limit}`;

        const requestStartTime = Date.now();
        console.log(`📡 Fetching posts from: ${endpoint} (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

        const response = await api.get(endpoint, {
          signal: abortControllerRef.current.signal,
          timeout: 30000, // 30 second timeout (increased from 15s)
        });

        const requestDuration = Date.now() - requestStartTime;
        console.log(`⏱️ Request completed in ${requestDuration}ms`);

        console.log("✅ Posts fetched successfully:", response.data.feeds?.length || 0);

        // Only update if this is still the latest request
        if (requestId !== latestRequestIdRef.current) {
          console.log("⏭️ Ignoring outdated response");
          ongoingRequestsRef.current.delete(requestKey);
          return;
        }

        const feeds = response.data?.feeds ?? [];
        const pagination = response.data?.pagination;

        if (!Array.isArray(feeds)) {
          console.warn("⚠️ Invalid feeds data received");
          if (pageNum === 1) {
            setError("Invalid data format received");
            setPosts([]);
          }
          ongoingRequestsRef.current.delete(requestKey);
          return;
        }

        const mapped: Post[] = feeds
          .map((item: any) => ({
            _id: item.feedId || item._id,
            creatorUsername: item.userName,
            creatorAvatar: item.profileAvatar !== "Unknown" ? item.profileAvatar : null,
            timeAgo: item.timeAgo,
            contentUrl: item.contentUrl?.startsWith("http")
              ? item.contentUrl
              : `${api.defaults.baseURL}/${item.contentUrl?.replace(/\\/g, "/")}`,
            caption: item.caption || "",
            tags: item.tags || [],
            background: item.background || "#fff",
            commentsCount: item.commentsCount || 0,
            likesCount: item.likesCount || 0,
            type: item.type,
            profileUserId: item.createdByAccount,
            roleRef: item.roleRef,
            isLiked: !!item.isLiked,
            isSaved: !!item.isSaved,
            isDisliked: !!item.isDisliked || false,
            dislikesCount: item.dislikesCount || 0,
            primary: item.themeColor?.primary || "#4A90E2",
            accent: item.themeColor?.accent || "#50C878",
            textColor: item.themeColor?.text || "#FFFFFF",
            avatorToUse: item.avatarToUse || null,
          }))
          .filter((item) => item.type === "image");

        if (pageNum === 1) {
          setPosts(mapped);
        } else {
          setPosts((prev) => [...prev, ...mapped]);
        }

        // Use backend's hasMore flag if available, otherwise fallback to local calculation
        setHasMore(pagination?.hasMore ?? (mapped.length >= limit));
        setPage(pageNum);
        console.log("📊 Pagination:", pagination);
        setLastFetchTime(Date.now());
      } catch (err: any) {
        // Check if request was cancelled (axios cancellation)
        if (axios.isCancel(err) || err.name === 'CanceledError' || err.message === 'canceled') {
          console.log("🚫 Request cancelled");
          ongoingRequestsRef.current.delete(requestKey);
          return;
        }

        console.error("❌ Error fetching posts:", err.response?.data || err.message);

        // Determine if we should retry
        const isNetworkError = !err.response && (err.message === 'Network Error' || err.code === 'ERR_NETWORK');
        const isTimeout = err.code === 'ECONNABORTED';
        const is5xxError = err.response?.status >= 500;

        const shouldRetry = (isNetworkError || isTimeout || is5xxError) && retryCount < MAX_RETRIES;

        if (shouldRetry) {
          // Exponential backoff: 1s, 2s, 4s
          const retryDelay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
          console.log(`🔄 Retrying in ${retryDelay}ms... (Attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));

          // Remove from ongoing before retry
          ongoingRequestsRef.current.delete(requestKey);

          // Retry the request
          return fetchPosts(catId, pageNum, retryCount + 1);
        }

        // If we've exhausted retries or it's a non-retryable error, show error
        let errorMessage = "Failed to load posts. Please try again.";

        if (err.response?.status === 401) {
          errorMessage = "Session expired. Please log in again.";
        } else if (err.response?.status === 404) {
          errorMessage = "Posts not found.";
        } else if (isTimeout) {
          errorMessage = "Connection timed out. Please check your internet.";
        } else if (isNetworkError) {
          errorMessage = "No internet connection. Please check your network.";
        } else if (is5xxError) {
          errorMessage = "Server error. Please try again later.";
        }

        if (pageNum === 1) {
          setError(errorMessage);
          setPosts([]);
        } else {
          // For pagination errors, just stop loading but keep existing posts
          console.log("⚠️ Pagination error, keeping existing posts");
        }
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
        // Remove from ongoing requests
        const requestKey = `${catId || 'all'}_${pageNum}`;
        ongoingRequestsRef.current.delete(requestKey);
      }
    }, []); // Memoize to prevent recreation


    // --------------------------- View Count ----------------------------

    const recordViewCount = useCallback(async (feedId: string) => {
      try {
        if (viewedPosts.current.has(feedId)) {
          console.log("⏸ Already counted:", feedId);
          return;
        }

        console.log("📡 Sending view-count request for:", feedId);

        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.log("⚠️ No token, skipping view-count");
          return;
        }

        await api.post("/api/user/image/view/count", { feedId });

        viewedPosts.current.add(feedId);

        console.log("✅ View recorded successfully:", feedId);

      } catch (err: any) {
        console.log("❌ View recording error:", err?.message);
      }
    }, []);


    // --------------------------- Scroll Handlers ----------------------------

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const scrollY = contentOffset.y;

      const visible = posts
        .map((p) => {
          const ref = boxRefs.current[p._id];
          if (!ref) return null;
          const { y, height } = ref;
          return y < scrollY + windowHeight / 1.5 && y + height > scrollY
            ? p._id
            : null;
        })
        .filter((id): id is string => !!id);
      setVisibleBoxes(visible);

      // Pagination Logic - improved to prevent multiple triggers
      const isCloseToBottom = layoutMeasurement.height + scrollY >= contentSize.height - windowHeight * 1.5;
      const requestKey = `${categoryId || 'all'}_${page + 1}`;
      const isRequestOngoing = ongoingRequestsRef.current.has(requestKey);

      if (isCloseToBottom && hasMore && !isFetchingMore && !loading && !isRequestOngoing) {
        console.log("📄 Fetching more posts... Page:", page + 1);
        fetchPosts(categoryId ?? null, page + 1);
      }
    };

    const handlePull = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (y < -120 && !refreshingTop) setRefreshingTop(true);

      if (y >= 0 && refreshingTop) setRefreshingTop(false);
    };

    const handleBoxLayout = (id: string) => (event: any) => {
      const { y, height } = event.nativeEvent.layout;
      boxRefs.current[id] = { y, height };
    };




    // --------------------------- Dislike Update Handler ----------------------------

    const handleDislikeUpdate = (postId: string, newIsDisliked: boolean, newDislikeCount: number) => {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === postId
            ? { ...p, isDisliked: newIsDisliked, dislikesCount: newDislikeCount }
            : p
        )
      );
    };


    // --------------------------- Lifecycle ----------------------------

    useEffect(() => {
      setPage(1);
      setHasMore(true);
      setPosts([]);
      fetchPosts(categoryId ?? null, 1);
    }, [categoryId, fetchPosts]);

    useEffect(() => {
      const initSocket = async () => {
        try {
          const token = await AsyncStorage.getItem("userToken");
          const sessionId = await AsyncStorage.getItem("sessionId");
          if (token && sessionId) {
            await connectSocket(); // ✅ Only socket connect
            console.log("✅ Socket connected from PostList page");
          }
        } catch (err) {
          console.debug("Socket initialization error:", err);
        }
      };
      initSocket();
    }, []);


    useEffect(() => {
      if (visibleBoxes.length === 0) return;

      const firstVisible = visibleBoxes[0];

      // ✅ Console to verify view trigger
      console.log("👀 First visible post changed:", firstVisible);

      recordViewCount(firstVisible);
    }, [visibleBoxes, recordViewCount]);


    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, []);

    // --------------------------- Imperative Handle ----------------------------

    useImperativeHandle(ref, () => ({
      refreshPosts: async () => {
        setRefreshingTop(true);
        setPosts([]);
        try {
          await fetchPosts(null, 1);
          setPosts((prev) => shuffleArray(prev));
        } catch (err) {
          console.error("Error refreshing posts:", err);
          Alert.alert("Error", "Failed to refresh posts. Please try again.");
        } finally {
          setRefreshingTop(false);
        }
      },
      scrollToTop: () => {
        scrollRef?.current?.scrollTo({ y: 0, animated: true });
      },
      handleScroll,
      handlePull,
    }));

    // --------------------------- UI ----------------------------

    const memoVisibleBoxes = useMemo(() => visibleBoxes, [visibleBoxes]);

    // Show loading skeleton for initial load
    if (loading) {
      return (
        <View style={styles.skeletonContainer}>
          {[...Array(3)].map((_, index) => (
            <SkeletonPostCard key={index} />
          ))}
        </View>
      );
    }

    // Show error state with retry option
    if (error && posts.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text
            style={styles.retryText}
            onPress={() => {
              setError(null);
              fetchPosts(categoryId ?? null);
            }}
          >
            Tap to Retry
          </Text>
        </View>
      );
    }

    // Show empty state
    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {error ? "Unable to load posts" : "No feeds available"}
          </Text>
        </View>
      );
    }

    return (
      <View>
       {posts.map((post, index) => (

          <View
            key={post._id}
            onLayout={handleBoxLayout(post._id)}
            style={{ width: "100%", marginTop: 10 }}
          >


            <MemoPostCard
              id={post._id}
              postIndex={index}
              themeColor={post.primary}
              textColor={post.textColor}
              avatarToUse={post.avatorToUse}
              name={post.creatorUsername}
              profileimage={post.creatorAvatar}
              date={post.timeAgo}
              postimage={[{ image: post.contentUrl }]}
              like={post.likesCount}
              commentsCount={post.commentsCount}
              posttitle={post.caption}
              posttag={post.tags.join(" ")}
              sheetRef={sheetRef}
              optionSheet={optionSheet}
              hasStory={false}
              reelsvideo={null}
              caption={post.caption}
              background={post.background}
              visibleBoxes={memoVisibleBoxes}
              onNotInterested={() => setPosts((prev) => prev.filter((p) => p._id !== post._id))}
              onHidePost={() => setPosts((prev) => prev.filter((p) => p._id !== post._id))}
              profileUserId={post.profileUserId}
              roleRef={post.roleRef}
              isLiked={post.isLiked}
              isSaved={post.isSaved}
              isDisliked={post.isDisliked || false}
              dislikesCount={post.dislikesCount || 0}
              currentUserProfile={userProfile}
              visibilitySettings={visibilitySettings}
              onDislikeUpdate={(newIsDisliked, newDislikeCount) =>
                handleDislikeUpdate(post._id, newIsDisliked, newDislikeCount)
              }
              onLikeUpdate={(newIsLiked, newLikeCount) =>
                setPosts((prevPosts) =>
                  prevPosts.map((p) =>
                    p._id === post._id ? { ...p, isLiked: newIsLiked, likesCount: newLikeCount } : p
                  )
                )
              }
            />
          </View>
        ))}
        {isFetchingMore && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#000" />
          </View>
        )}
      </View>
    );
  }
);

// --------------------------- Styles ----------------------------

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  emptyContainer: {
    height: windowHeight,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  retryText: {
    fontSize: 16,
    color: "#1976d2",
    textAlign: "center",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  skeletonCard: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginHorizontal: -15,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingRight: 5,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  skeletonTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  skeletonText: {
    height: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonImage: {
    width: "100%",
    height: Dimensions.get("window").width * 0.99,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingRight: 5,
  },
  skeletonActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skeletonMoreIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
  },
  skeletonActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0e0e0",
  },
});

export default PostList;
