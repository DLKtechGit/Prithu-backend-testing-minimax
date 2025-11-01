
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import PostCard from "../../components/PostCard";
import { connectSocket } from "../../../webSocket/webScoket";
import { startHeartbeat } from "../../../webSocket/heartBeat";
import api from "../../../apiInterpretor/apiInterceptor";

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
  roleRef:string;
  isLiked: boolean;
  isSaved: boolean;
  isDisliked?: boolean; // Add isDisliked to the Post interface
  dislikesCount?: number; // Add dislikeCount (optional, if backend supports it)
  primary:string;
  accent:string;
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
  prev.caption === next.caption
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

    const boxRefs = useRef<Record<string, { y: number; height: number }>>({});
    const viewedPosts = useRef<Set<string>>(new Set());
    const abortControllerRef = useRef<AbortController | null>(null);
    const latestRequestIdRef = useRef<number>(0);

    // --------------------------- Fetch Posts ----------------------------

    const fetchPosts = useCallback(async (catId: string | null = null) => {
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
          return;
        }

        // Set loading state
        if (!catId) {
          setLoading(true);
        }

        const endpoint = catId
          ? `/api/user/get/feed/with/cat/${catId}`
          : `/api/get/all/feeds/user`;

        console.log("Fetching posts from:", endpoint);

        const response = await api.get(endpoint, {
          signal: abortControllerRef.current.signal,
          timeout: 10000, // 10 second timeout
        });

        // Only update if this is still the latest request
        if (requestId !== latestRequestIdRef.current) {
          console.log("Ignoring outdated response");
          return;
        }

        const feeds = response.data?.feeds ?? [];
        if (!Array.isArray(feeds)) {
          console.warn("Invalid feeds data received");
          setError("Invalid data format received");
          setPosts([]);
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
              : `http://192.168.1.10:5000/${item.contentUrl?.replace(/\\/g, "/")}`,
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
            primary: item.themeColor?.primary || "#fff",
            accent: item.themeColor?.accent || "#fff",
          }))
          .filter((item) => item.type === "image");

        setPosts(mapped);
        setLastFetchTime(Date.now());
      } catch (err: any) {
        // Check if request was cancelled (axios cancellation)
        if (axios.isCancel(err) || err.name === 'CanceledError' || err.message === 'canceled') {
          console.log("Request cancelled");
          return;
        }

        console.error("Error fetching posts:", err.response?.data || err.message);
        
        let errorMessage = "Failed to load posts. Please try again.";
        
        if (err.response?.status === 401) {
          errorMessage = "Session expired. Please log in again.";
        } else if (err.response?.status === 404) {
          errorMessage = "Posts not found.";
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = "Request timed out. Please check your connection.";
        }

        setError(errorMessage);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }, []); // Memoize to prevent recreation


    // --------------------------- View Count ----------------------------

    const recordViewCount = useCallback(async (feedId: string) => {
      try {
        if (viewedPosts.current.has(feedId)) return;

        const token = await AsyncStorage.getItem("userToken");
        if (!token) return;

        await api.post("/api/user/image/view/count", { feedId });
        viewedPosts.current.add(feedId);
      } catch (err: any) {
        // Don't log view recording errors to avoid console spam
        console.debug("Error recording view:", err.response?.data || err.message);
      }
    }, []); // Memoize to prevent recreation

    // --------------------------- Scroll Handlers ----------------------------

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = e.nativeEvent.contentOffset.y;
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
    };

    const handlePull = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (y < -50 && !refreshingTop) setRefreshingTop(true);
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
            ? { ...p, isDisliked: newIsDisliked, dislikeCount: newDislikeCount }
            : p
        )
      );
    };


    // --------------------------- Lifecycle ----------------------------

    useEffect(() => {
      fetchPosts(categoryId ?? null);
    }, [categoryId, fetchPosts]);

    useEffect(() => {
      const initSocket = async () => {
        try {
          const token = await AsyncStorage.getItem("userToken");
          const sessionId = await AsyncStorage.getItem("sessionId");
          if (token && sessionId) {
            await connectSocket();
            startHeartbeat();
          }
        } catch (err) {
          console.debug("Socket initialization error:", err);
        }
      };
      initSocket();
    }, []);

    useEffect(() => {
      visibleBoxes.forEach(recordViewCount);
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
          await fetchPosts(null);
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
        {posts.map((post) => (
          <View
            key={post._id}
            onLayout={handleBoxLayout(post._id)}
            style={{ height: windowHeight, width: "100%" }}
          >
            <MemoPostCard
              id={post._id}
              themeColor={post.themeColor}
              textColor={post.textColor}
              framedAvatar={post.framedAvatar}
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
});

export default PostList;
