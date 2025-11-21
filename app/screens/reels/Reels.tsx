import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  View,
  FlatList,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Header from '../../layout/Header';
import PostShareSheet from '../../components/bottomsheet/PostShareSheet';
import Reelsitem from '../../components/Reelsitem';
import api from '../../../apiInterpretor/apiInterceptor';

const { height: windowHeight } = Dimensions.get('window');

const Reels = ({ themeColor, textColor, route }: any) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const sheetRef = useRef<any>();
  const flatListRef = useRef<any>();
  const [reelsData, setReelsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Get initial video ID from route params
  const initialVideoId = route?.params?.initialVideoId;
  const hasScrolledToInitial = useRef(false);

  // Track if we're currently fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);

  // Fetch reels with pagination
  const fetchReels = useCallback(async (pageNum: number = 1) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;

      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        isFetchingRef.current = false;
        return;
      }

      const limit = 20; // Increased to 20 reels per batch for smoother scrolling
      console.log(`Fetching reels - Page: ${pageNum}, Limit: ${limit}`);

      const res = await api.get(`/api/get/all/feeds/user?page=${pageNum}&limit=${limit}`);

      const allFeeds = res.data.feeds || [];
      const pagination = res.data.pagination;

      // Filter only videos
      const videoFeeds = allFeeds.filter((feed: any) => feed.type === 'video');
      console.log(`Fetched ${videoFeeds.length} video reels`);

      if (pageNum === 1) {
        setReelsData(videoFeeds);

        // Scroll to initial video if provided
        if (initialVideoId && videoFeeds.length > 0 && !hasScrolledToInitial.current) {
          const videoIndex = videoFeeds.findIndex((feed: any) =>
            (feed.feedId || feed._id) === initialVideoId
          );

          if (videoIndex !== -1) {
            hasScrolledToInitial.current = true;
            setCurrentIndex(videoIndex);

            // Scroll after render
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: videoIndex,
                animated: false,
              });
            }, 300);
          }
        }
      } else {
        // Append new reels, avoiding duplicates
        setReelsData((prev) => {
          const existingIds = new Set(prev.map(item => item.feedId || item._id));
          const newReels = videoFeeds.filter(
            (feed: any) => !existingIds.has(feed.feedId || feed._id)
          );
          console.log(`Adding ${newReels.length} new unique reels`);
          return [...prev, ...newReels];
        });
      }

      // Update pagination state
      setHasMore(pagination?.hasMore ?? false);
      setPage(pageNum);

    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [initialVideoId]);

  useEffect(() => {
    fetchReels(1);
  }, []);

  // Stop all videos when navigating away from Reels page
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      // Set currentIndex to -1 to stop all videos
      setCurrentIndex(-1);
    });

    return unsubscribe;
  }, [navigation]);

  // Also stop videos when screen loses focus
  useEffect(() => {
    if (!isFocused) {
      setCurrentIndex(-1);
    }
  }, [isFocused]);

  // Handle viewable items changed
  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);

      // Load more when approaching the end (5 items before the end)
      // This ensures smoother loading without waiting until the very end
      if (hasMore && !loadingMore && !isFetchingRef.current && newIndex >= reelsData.length - 5) {
        console.log(`Triggering load more - Current index: ${newIndex}, Total reels: ${reelsData.length}, Next page: ${page + 1}`);
        fetchReels(page + 1);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Reduced from 80 to trigger earlier
    minimumViewTime: 200, // Reduced from 300 for faster response
  }).current;

  // Render item with memoization
  const renderItem = useCallback(({ item, index }: any) => (
    <View style={{ height: windowHeight }}>
      <Reelsitem
        key={item.feedId || item._id || index}
        id={item.feedId || item._id}
        like={item.likesCount || 0}
        comment={item.commentsCount || 0}
        save={item.downloadsCount || 0}
        send={0}
        image={{ uri: item.profileAvatar }}
        holder={item.userName || 'User'}
        text={item.caption || ''}
        music={item.music || 'Reel Music'}
        sheetRef={sheetRef}
        reelsvideo={{ uri: item.contentUrl }}
        hasStory={false}
        autoplay={currentIndex === index}
        isLiked={item.isLiked || false}
        themeColor={themeColor}
        textColor={textColor}
        profileUserId={item.createdByAccount || item.userId || item.profileUserId}
        roleRef={item.roleRef || item.role}
      />
    </View>
  ), [currentIndex, themeColor, textColor]);

  // Loading footer
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  };

  if (loading && reelsData.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading Reels...</Text>
      </SafeAreaView>
    );
  }

  if (reelsData.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>No reels available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <Header title="Reels" transparent={true} />

      <FlatList
        ref={flatListRef}
        data={reelsData}
        keyExtractor={(item, index) => `reel-${item.feedId || item._id || 'unknown'}-${index}`}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={windowHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}

        // Performance optimizations
        initialNumToRender={3} // Render 3 reels initially
        maxToRenderPerBatch={5} // Increased from 3 for smoother scrolling
        windowSize={7} // Increased from 5 to keep more items in memory
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50} // Faster updates

        // Footer for loading more
        ListFooterComponent={renderFooter}

        // Error handling
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: Math.min(info.index, reelsData.length - 1),
              animated: false
            });
          });
        }}

        // Layout optimization
        getItemLayout={(data, index) => ({
          length: windowHeight,
          offset: windowHeight * index,
          index,
        })}
      />

      <PostShareSheet ref={sheetRef} />
    </SafeAreaView>
  );
};

export default Reels;
