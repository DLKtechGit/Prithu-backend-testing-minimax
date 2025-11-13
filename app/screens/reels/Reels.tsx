import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  SafeAreaView, 
  ActivityIndicator, 
  Dimensions, 
  View, 
  FlatList 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../layout/Header';
import PostShareSheet from '../../components/bottomsheet/PostShareSheet';
import Reelsitem from '../../components/Reelsitem';
import api from '../../../apiInterpretor/apiInterceptor';

const { height: windowHeight } = Dimensions.get('window');

const Reels = ({ themeColor, textColor }: any) => {
  const sheetRef = useRef<any>();
  const flatListRef = useRef<any>();
  const [reelsData, setReelsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchReels = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const res = await api.get('/api/get/all/feeds/user');
      const feeds = res.data.feeds?.filter((feed: any) => feed.type === 'video') || [];
      setReelsData(feeds);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }: any) => (
    <View style={{ height: windowHeight }}>
      <Reelsitem
        key={item.feedId || index}
        id={item.feedId}
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
        themeColor={themeColor}
        textColor={textColor}
      />
    </View>
  );

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
        snapToInterval={windowHeight} // ensures one reel per screen
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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
