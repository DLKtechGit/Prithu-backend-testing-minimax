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
const REELS_CONTAINER_HEIGHT = 658;

const Reels = () => {
  const sheetRef = useRef<any>();
  const flatListRef = useRef<any>();
  const [reelsData, setReelsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const buildUrl = (path: string | undefined | null) => {
    if (!path) return null;
    return `http://192.168.1.6:5000/${path.replace(/\\/g, '/')}`;
  };

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          console.warn('No token found, user might not be logged in');
          return;
        }

        const res = await axios.get('http://192.168.1.6:5000/api/get/all/feeds/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Fetched feeds:", res.data.feeds);
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

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

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
// import React, { useRef, useState, useEffect } from 'react';
// import { SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
// import Swiper from 'react-native-swiper';
// import axios from 'axios';
// import Reelsitem from '../../components/Reelsitem';
// import Header from '../../layout/Header';
// import PostShareSheet from '../../components/bottomsheet/PostShareSheet';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { height: windowHeight } = Dimensions.get('window');

// const Reels = () => {
//   const sheetRef = useRef<any>();
//   const [reelsData, setReelsData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const buildUrl = (path: string | undefined | null) => {
//     if (!path) return null;
//     return `http://192.168.1.6:5000/${path.replace(/\\/g, '/')}`;
//   };

//   useEffect(() => {
//     const fetchReels = async () => {
//       try {
//         const token = await AsyncStorage.getItem('userToken');
//         if (!token) {
//           console.warn('No token found, user might not be logged in');
//           return;
//         }

//         const res = await axios.get('http://192.168.1.6:5000/api/get/all/feeds/user', {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         console.log('dfdfdfdfdf', res.data.feeds);
//         const videoFeeds = res.data.feeds.filter((feed: any) => feed.type === 'video');
//         setReelsData(videoFeeds);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchReels();
//   }, []);

//   if (loading) {
//     return (
//       <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
//         <ActivityIndicator size="large" color="#fff" />
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
//       <Header title="Reels" transparent={true} />
//       <Swiper
//         horizontal={false}
//         loop={false}
//         autoplay={false}
//         showsButtons={false}
//         showsPagination={false}
//         showsVerticalScrollIndicator={false}
//         decelerationRate="fast"
//         containerStyle={{ height: windowHeight, width: '100%' }} // Use containerStyle for proper sizing
//       >
//         {reelsData.map((data, index) => (
//           <Reelsitem
//             key={index}
//             id={data.feedId}
//             like={data.likesCount}
//             comment={data.commentsCount || 0}
//             save={data.downloadsCount}
//             send={0}
//             image={{ uri: data.profileAvatar }}
//             holder={data.userName || 'Ashik'}
//             text={data.caption || ''}
//             music={data.music || 'Prithu Music'}
//             sheetRef={sheetRef}
//             reelsvideo={{ uri: data.contentUrl }}
//             hasStory={false}
//             autoplay={currentIndex === index}
//           />
//         ))}
//       </Swiper>
//       <PostShareSheet ref={sheetRef} />
//     </SafeAreaView>
//   );
// };

// export default Reels;