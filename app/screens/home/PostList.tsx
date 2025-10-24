
import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useMemo,
  memo,
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PostCard from "../../components/PostCard";
import { connectSocket } from "../../../webSocket/webScoket";
import { startHeartbeat } from "../../../webSocket/heartBeat";
import axios from "axios";

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

    const boxRefs = useRef<Record<string, { y: number; height: number }>>({});
    const viewedPosts = useRef<Set<string>>(new Set());

    // --------------------------- Fetch Posts ----------------------------

    const fetchPosts = async (catId: string | null = null) => {
      try {
        setLoading(true);

        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.warn("No user token found");
          setPosts([]);
          return;
        }

        const endpoint = catId
          ? `http://192.168.1.10:5000/api/user/get/feed/with/cat/${catId}`
          : `http://192.168.1.10:5000/api/get/all/feeds/user`;

        console.log("Fetching posts from:", endpoint);

        const res = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
           
        // console.log("data:",res.data.feeds)

        const feeds = res.data?.feeds ?? [];
        if (!Array.isArray(feeds)) {
          console.warn("No feeds found");
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
            roleRef:item.roleRef,
            isLiked: !!item.isLiked,
            isSaved: !!item.isSaved,
            isDisliked: !!item.isDisliked || false, 
            dislikeCount: item.dislikesCount || 0,
            framedAvatar: item.framedAvatar || null,
            themeColor: item.themeColor?.primary || "#fff", 
            textColor: item.themeColor?.accent || "#fff", 
          }))
          .filter((item) => item.type === "image");
  
        setPosts(mapped);
      } catch (err: any) {
        console.error("Error fetching posts:", err.response?.data || err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };


    // --------------------------- View Count ----------------------------

    const recordViewCount = async (feedId: string) => {
      try {
        if (viewedPosts.current.has(feedId)) return;

        const token = await AsyncStorage.getItem("userToken");
        if (!token) return;

        await axios.post(
          "http://192.168.1.10:5000/api/user/image/view/count",
          { feedId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        viewedPosts.current.add(feedId);
      } catch (err: any) {
        console.error("Error recording view:", err.response?.data || err.message);
      }
    };

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
    }, [categoryId]);

    useEffect(() => {
      const initSocket = async () => {
        const token = await AsyncStorage.getItem("userToken");
        const sessionId = await AsyncStorage.getItem("sessionId");
        if (token && sessionId) {
          await connectSocket();
          startHeartbeat();
        }
      };
      initSocket();
    }, []);

    useEffect(() => {
      visibleBoxes.forEach(recordViewCount);
    }, [visibleBoxes]);

    // --------------------------- Imperative Handle ----------------------------

    useImperativeHandle(ref, () => ({
      refreshPosts: async () => {
        setRefreshingTop(true);
        setPosts([]);
        await fetchPosts(null);
        setPosts((prev) => shuffleArray(prev));
        setRefreshingTop(false);
      },
      scrollToTop: () => {
        scrollRef?.current?.scrollTo({ y: 0, animated: true });
      },
      handleScroll,
      handlePull,
    }));

    // --------------------------- UI ----------------------------

    const memoVisibleBoxes = useMemo(() => visibleBoxes, [visibleBoxes]);

    if (loading || refreshingTop) {
      return (
        <View style={styles.skeletonContainer}>
          {/* Display multiple skeleton cards to mimic a list */}
          {[...Array(3)].map((_, index) => (
            <SkeletonPostCard key={index} />
          ))}
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={{ height: windowHeight, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 16, color: "#666", textAlign: "center" }}>
            No feeds available
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
              isDisliked={post.isDisliked || false} // Pass initial isDisliked state
              dislikeCount={post.dislikeCount || 0} // Pass initial dislike count
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
  // skeletonMoreIcon: {
  //   width: 18,
  //   height: 18,
  //   backgroundColor: "#e0e0e0",
  //   borderRadius: 4,
  //   margin: 10,
  // },
  skeletonImage: {
    width: "100%",
    height: Dimensions.get("window").width * 0.99, // Matches PostCard's image height
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
  // skeletonActionButton: {
  //   width: 28,
  //   height: 28,
  //   backgroundColor: "#e0e0e0",
  //   borderRadius: 14,
  // },
});

export default PostList;
