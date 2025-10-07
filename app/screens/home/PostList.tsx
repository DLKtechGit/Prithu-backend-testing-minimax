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
import { View, Dimensions, ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
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
  accountId: string;
  isLiked: boolean;
  isSaved: boolean;
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

    // Get user token
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      console.warn("No user token found");
      setPosts([]);
      return;
    }

    // Determine endpoint
    const endpoint = catId
      ? `http://192.168.1.7:5000/api/all/catagories/${catId}`
      : `http://192.168.1.7:5000/api/get/all/feeds/user`;

    console.log("Fetching posts from:", endpoint);

    // Axios GET with token
    const res = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Response:", res.data);

    // Extract feeds
    const feeds = catId ? res.data?.category?.feeds ?? [] : res.data?.feeds ?? [];

    if (!Array.isArray(feeds)) {
      console.warn("No feeds found");
      setPosts([]);
      return;
    }

    // Map feeds to Post[]
    const mapped: Post[] = feeds
      .map((item: any) => ({
        _id: item.feedId || item._id,
        creatorUsername: item.userName,
        creatorAvatar: item.profileAvatar !== "Unknown" ? item.profileAvatar : null,
        timeAgo: item.timeAgo,
        contentUrl: item.contentUrl?.startsWith("http")
          ? item.contentUrl
          : `http://192.168.1.7:5000/${item.contentUrl?.replace(/\\/g, "/")}`,
        caption: item.caption || "",
        tags: item.tags || [],
        background: item.background || "#fff",
        commentsCount: item.commentsCount || 0,
        likesCount: item.likesCount || 0,
        type: item.type,
        accountId: item.createdByAccount,
        isLiked: !!item.isLiked,
        isSaved: !!item.isSaved,
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
          "http://192.168.1.7:5000/api/user/image/view/count",
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
        <View style={{ height: windowHeight, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={{ height: windowHeight, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    return (
      <View>
        {refreshingTop && (
          <View style={{ paddingVertical: 20, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color="#000" />
          </View>
        )}

        {posts.map((post) => (
          <View
            key={post._id}
            onLayout={handleBoxLayout(post._id)}
            style={{ height: windowHeight, width: "100%" }}
          >
            <MemoPostCard
              id={post._id}
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
              accountId={post.accountId}
              isLiked={post.isLiked}
              isSaved={post.isSaved}
            />
          </View>
        ))}
      </View>
    );
  }
);

export default PostList;
