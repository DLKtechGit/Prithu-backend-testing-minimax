import React, { useRef, useState, useEffect } from 'react';
import { SafeAreaView, ActivityIndicator } from 'react-native';
import Swiper from 'react-native-swiper';
import axios from 'axios';
import Reelsitem from '../../components/Reelsitem';
import Header from '../../layout/Header';
import PostShareSheet from '../../components/bottomsheet/PostShareSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Reels = () => {
  const sheetRef = useRef<any>();
  const [reelsData, setReelsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  // at the top of Reels.tsx
const buildUrl = (path: string | undefined | null) => {
  if (!path) return null;
  // prepend server base + normalize slashes
  return `https://ddbb.onrender.com/${path.replace(/\\/g, '/')}`;
};


  useEffect(() => {
    const fetchReels = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken'); // get token from storage
    if (!token) {
      console.warn('No token found, user might not be logged in');
      return;
    }

  const res = await axios.get('https://ddbb.onrender.com/api/get/all/feeds/user', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

console.log("dfdfdfdfdf",res.data.feeds)
        // ✅ Only keep videos
        const videoFeeds = res.data.feeds.filter((feed: any) => feed.type === 'video');
        setReelsData(videoFeeds);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

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

     <Swiper
  horizontal={false}
  loop={false}
  autoplay={false}
  showsButtons={false}
  showsPagination={false}
  onIndexChanged={(index) => setCurrentIndex(index)}
>
  {reelsData.map((data, index) => (
    <Reelsitem
      key={index}
      like={data.likesCount}
      comment={data.commentsCount || 0}
      save={data.downloadsCount}
      send={0}
      image={{ uri: buildUrl(data.profileAvatar) }}   // ✅ profile pic fixed
      holder={data.userName || 'Ashik'}
      text={data.caption || ''}
      music={data.music || 'Prithu Music'}
      sheetRef={sheetRef}
      reelsvideo={{ uri: buildUrl(data.contentUrl) }} // ✅ video URL fixed
      hasStory={false}
      autoplay={currentIndex === index}
    />
  ))}
</Swiper>


      <PostShareSheet ref={sheetRef} />
    </SafeAreaView>
  );
};

export default Reels;
