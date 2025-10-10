

import React, { useRef, useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  ActivityIndicator, 
  Dimensions, 
  View, 
  StyleSheet,
  FlatList
} from 'react-native';
import axios from 'axios';
import Reelsitem from '../../components/Reelsitem';
import Header from '../../layout/Header';
import PostShareSheet from '../../components/bottomsheet/PostShareSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: windowHeight } = Dimensions.get('window');
// Decrease the height by 10% (adjust the multiplier as needed)
const REELS_CONTAINER_HEIGHT = 810;

const Reels = () => {
  const sheetRef = useRef<any>();
  const flatListRef = useRef<any>();
  const [reelsData, setReelsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewedVideos = useRef<Set<string>>(new Set());
  const watchedTimes = useRef<number[]>([]);
  
  const buildUrl = (path: string | undefined | null) => {
    if (!path) return null;
    return `http://192.168.1.7:5000/${path.replace(/\\/g, '/')}`;
  };

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          console.warn('No token found, user might not be logged in');
          return;
        }

        const res = await axios.get('http://192.168.1.7:5000/api/get/all/feeds/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // console.log("Fetched feeds:", res.data.feeds);
        const videoFeeds = res.data.feeds
          .filter((feed: any) => feed.type === 'video')
          .map((feed: any) => ({
            ...feed,
            duration: feed.duration || 0, // Fallback to 0 if duration is not provided
          }));
        setReelsData(videoFeeds);
        watchedTimes.current = new Array(videoFeeds.length).fill(0);
      } catch (err) {
        console.error('Error fetching reels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  // const recordVideoView = async (feedId: string, watchedSeconds: number) => {
  //   try {
  //     if (viewedVideos.current.has(feedId)) {
  //       console.log(`Video ${feedId} already viewed, skipping API call`);
  //       return;
  //     }

  //     const token = await AsyncStorage.getItem('userToken');
  //     if (!token) {
  //       console.warn('No user token found in AsyncStorage');
  //       return;
  //     }

  //     const userId = await AsyncStorage.getItem('userId'); // Fetch userId
  //     if (!userId) {
  //       console.warn('No userId found in AsyncStorage');
  //       return;
  //     }

  //     console.log("Recording view for feedId:", feedId, "watchedSeconds:", watchedSeconds, "userId:", userId);
  //     const response = await axios.post(
  //       'http://192.168.1.7:5000/api/user/watching/videos', // Corrected endpoint URL
  //       { feedId, userId, watchedSeconds },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     if (response.data.watched) {
  //       viewedVideos.current.add(feedId);
  //       console.log(`View recorded for feedId: ${feedId}`);
  //     }
  //   } catch (error) {
  //     console.error('Error recording video view:', error.response?.data || error.message);
  //   }
  // };

 const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
  if (viewableItems.length > 0) {
    const newIndex = viewableItems[0].index;
    console.log('🟡 Viewable item changed to index:', newIndex);
    setCurrentIndex(newIndex);
  }
}).current;

useEffect(() => {
  if (currentIndex > 0 && reelsData[currentIndex - 1]) {
    const prevFeed = reelsData[currentIndex - 1];
    const watchedSeconds = watchedTimes.current[currentIndex - 1] || 0;

    // ✅ Correctly calculate required duration using prevFeed
    const minRequired =
      prevFeed.duration > 0
        ? Math.floor(prevFeed.duration * 0.9)
        : 0;

    // console.log(
    //   `🎯 Checking previous feedId: ${prevFeed.feedId}, watched: ${watchedSeconds}, minRequired: ${minRequired}, duration: ${prevFeed.duration}`
    // );

    if (
      watchedSeconds >= minRequired &&
      !viewedVideos.current.has(prevFeed.feedId) &&
      prevFeed.duration > 0
    ) {
      console.log(`✅ Triggering record for feedId: ${prevFeed.feedId} before unmount`);
      recordVideoView(prevFeed.feedId, watchedSeconds);
    }
  }
}, [currentIndex, reelsData.length]);





  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80
  }).current;

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={{ height: REELS_CONTAINER_HEIGHT }}>
        <Reelsitem
          key={index}
          id={item.feedId}
          like={item.likesCount}
          comment={item.commentsCount || 0}
          save={item.downloadsCount}
          send={0}
          image={{ uri: item.profileAvatar }}
          holder={item.userName || 'Ashik'}
          text={item.caption || ''}
          music={item.music || 'Prithu Music'}
          sheetRef={sheetRef}
          reelsvideo={{ uri: item.contentUrl }}
          hasStory={false}
          autoplay={currentIndex === index}
     onProgress={(progress: any) => {
  const seconds =
    progress.currentTime || (progress.positionMillis / 1000) || 0;

  // ✅ Always store progress, even if duration is 0
  watchedTimes.current[index] = Math.max(watchedTimes.current[index] || 0, seconds);

  const duration = item.duration > 0 ? item.duration : progress.seekableDuration || 0;
  const minRequired = Math.floor(duration * 0.9) || 0;

  console.log(
    `Progress for feedId: ${item.feedId}, seconds: ${seconds}, minRequired: ${minRequired}, duration: ${duration}, viewed: ${viewedVideos.current.has(item.feedId)}`
  );

  // ✅ Trigger view only when duration exists and threshold reached
  if (
    duration > 0 &&
    seconds >= minRequired &&
    !viewedVideos.current.has(item.feedId)
  ) {
    recordVideoView(item.feedId, seconds);
  }
}}

     onLoad={(data: any) => {
  if (data?.duration && item.duration === 0) {
    item.duration = data.duration;
    console.log(`✅ Duration set for feedId: ${item.feedId}: ${data.duration}`);

    setReelsData((prev) =>
      prev.map((feed, i) =>
        i === index ? { ...feed, duration: data.duration } : feed
      )
    );
  } else {
    console.log(`onLoad fired but no valid duration for ${item.feedId}`);
  }
}}


        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <Header title="Reels" transparent={true} />
      
      <FlatList
        ref={flatListRef}
        data={reelsData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        snapToInterval={REELS_CONTAINER_HEIGHT}
        snapToAlignment="start"
        getItemLayout={(data, index) => ({
          length: REELS_CONTAINER_HEIGHT,
          offset: REELS_CONTAINER_HEIGHT * index,
          index,
        })}
      />

      <PostShareSheet ref={sheetRef} />
    </SafeAreaView>
  );
};

export default Reels;