import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useMemo,
  memo,
} from 'react';
import { View, Dimensions, ActivityIndicator, Text } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PostCard from '../../components/PostCard';

const { height: windowHeight } = Dimensions.get('window');

// ✅ Memoized PostCard to avoid unnecessary re-renders
const MemoPostCard = memo(PostCard, (prevProps, nextProps) => {
  return (
    prevProps.visibleBoxes === nextProps.visibleBoxes &&
    prevProps.postimage[0].image === nextProps.postimage[0].image &&
    prevProps.caption === nextProps.caption
  );
});

const PostList = forwardRef((props: any, ref: any) => {
  const [visibleBoxes, setVisibleBoxes] = useState<any>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingTop, setRefreshingTop] = useState(false);

  const boxRefs = useRef<any>({});

  // ✅ Fetch posts with token
  const fetchPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const url = props.categoryId
        ? `http://192.168.1.77:5000/api/all/catagories/${props.categoryId}`
        : `http://192.168.1.77:5000/api/get/all/feeds/user`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(res.data)
      const feeds = props.categoryId ? res.data.category.feeds : res.data.feeds;

      const mappedFeeds = feeds
        .map((item: any) => ({
          _id: item.feedId || item._id,
          creatorUsername: item.userName,
          creatorAvatar: item.profileAvatar !== "Unknown" ? item.profileAvatar : null,
          timeAgo: item.timeAgo,
          contentUrl: item.contentUrl,
          caption: item.caption || "",
          tags: item.tags || [],
          background: item.background || "#fff",
          comments: item.comments || [],
          likesCount: item.likesCount || 0,
          type: item.type, // Assuming 'type' comes from API (e.g., 'image', 'video')
        }))
        // ✅ Filter to only include posts where type === 'image'
        .filter((item: any) => item.type === 'image');

      setPosts(mappedFeeds);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [props.categoryId]);


  // ✅ Expose methods to parent
  useImperativeHandle(ref, () => ({
    refreshPosts: async () => {
      setRefreshingTop(true);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await fetchPosts();
      setRefreshingTop(false);
    },
    handleScroll: (e: any) => handleScroll(e),
    handlePull: (e: any) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      if (offsetY < -50 && !refreshingTop) setRefreshingTop(true); // show instantly
      if (offsetY >= 0 && refreshingTop) setRefreshingTop(false); // hide when released
    },
  }));

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      await fetchPosts();
      setLoading(false);
    };
    loadInitial();
  }, []);

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const visibleBoxIds = posts
      .map((box) => {
        const boxRef = boxRefs.current[box._id];
        if (!boxRef) return null;
        const boxY = boxRef.y;
        const boxHeight = boxRef.height;
        if (boxY < scrollY + windowHeight / 1.5 && boxY + boxHeight > scrollY) {
          return box._id;
        }
        return null;
      })
      .filter((id) => id !== null);
    setVisibleBoxes(visibleBoxIds);
  };

  const handleBoxLayout = (id: any) => (event: any) => {
    const pageY = event.nativeEvent.layout.y;
    const height = event.nativeEvent.layout.height;
    boxRefs.current[id] = { y: pageY, height };
  };

  const memoVisibleBoxes = useMemo(() => visibleBoxes, [visibleBoxes]);

  if (loading) {
    return (
      <View
        style={{
          height: windowHeight,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // ✅ Show message if no image posts
  if (posts.length === 0) {
    return (
      <View
        style={{
          height: windowHeight,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>No image posts available.</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Instant pull-down loader */}
      {refreshingTop && (
        <View
          style={{
            paddingVertical: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="small" color="#000" />
        </View>
      )}

      {posts.map((post: any) => (
        <View
          key={post._id}
          onLayout={handleBoxLayout(post._id)}
          style={{ height: windowHeight, width: '100%' }}
        >
          <MemoPostCard
            id={post._id}
            name={post.creatorUsername || 'Ashik'}
            profileimage={post.creatorAvatar || null}
            date={post.timeAgo}
            postimage={[{ image: post.contentUrl }]}
            like={post.likes?.length || 0}
            comment={post.comments?.length || 0}
            posttitle={post.caption}
            posttag={post.tags?.join(' ')}
            sheetRef={props.sheetRef}
            optionSheet={props.optionSheet}
            hasStory={false}
            reelsvideo={null}
            caption={post.caption}
            background={post.background || '#fff'}
            visibleBoxes={memoVisibleBoxes}
          />
        </View>
      ))}
    </View>
  );
});

export default PostList;