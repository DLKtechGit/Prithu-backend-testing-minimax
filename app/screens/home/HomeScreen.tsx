

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  Dimensions,
  BackHandler,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Text,
  Image,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import HomeHeader from './HomeHeader';
import StoryList from './StoryList';
import Categories from './Categories';
import PostList from './PostList';
import PostShareSheet from '../../components/bottomsheet/PostShareSheet';
import PostoptionSheet from '../../components/bottomsheet/PostoptionSheet';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { IMAGES } from '../../constants/theme';

const { height: windowHeight } = Dimensions.get('window');

interface HomeScreenProps {
  postListRef: React.RefObject<any>;
}

const HomeScreen = ({ postListRef }: HomeScreenProps) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const sheetRef = useRef<any>();
  const moresheet = useRef<any>();
  const scrollRef = useRef<ScrollView>(null);
  const optionSheetRef = useRef(null);
  const commentSheetRef = useRef<any>();
  const internalPostListRef = useRef<any>(null);
  // const categoriesRef = useRef<any>(null); // Add ref for Categories

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoriesKey, setCategoriesKey] = useState(0); // Key to force re-render Categories
  const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
    const [popupMessage, setPopupMessage] = useState(''); // Message for the popup
    const [popupSubtitle, setPopupSubtitle] = useState(''); // Subtitle for the popup
    const fadeAnim = useState(new Animated.Value(0))[0]; // Animation value for fade and position

    
  // Expose methods to BottomTab via postListRef
  useEffect(() => {
    if (postListRef && internalPostListRef.current) {
      postListRef.current = {
        scrollToTop: () => {
          if (scrollRef?.current) {
            scrollRef.current.scrollTo({ y: 0, animated: true });
          }
        },
        refreshPosts: async () => {
          // Refresh both Posts and Categories
          setRefreshing(true);
          setCategoriesKey(prev => prev + 1); // Force Categories to re-render and shuffle
          
          if (internalPostListRef.current?.refreshPosts) {
            await internalPostListRef.current.refreshPosts();
          }
          
          setRefreshing(false);
        },
      };
    }
  }, [postListRef]);

  // Android Back Button
useFocusEffect(
  React.useCallback(() => {
    const backAction = () => {
      setPopupMessage('Exit App');
      setPopupSubtitle('Are you sure you want to exit?');
      setShowPopup(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [])
);
  // Pull to Refresh - Refresh both Posts and Categories
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCategoriesKey(prev => prev + 1); // Force Categories to re-render and shuffle
    
    if (internalPostListRef.current?.refreshPosts) {
      await internalPostListRef.current.refreshPosts();
    }
    
    setRefreshing(false);
  }, []);
    useEffect(() => {
      if (showPopup) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, [showPopup, fadeAnim]);
// Custom Popup Component (already defined in your code)
const Popup = () => (
  <Animated.View style={[styles.popupOverlay, {
    opacity: fadeAnim,
    transform: [{
      translateY: fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [300, 0] // Slide from 300 (bottom) to 0 (top)
      })
    }]
  }]}>
    <View style={styles.popupContainer}>
      <Image
        source={IMAGES.chillzone} // Replace with your character image
        style={styles.popupImage}
      />
      <Text style={styles.popupTitle}>{popupMessage}</Text>
      <Text style={styles.popupSubtitle}>{popupSubtitle}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.popupButton, { flex: 1, marginRight: 10 }]} onPress={() => {
          BackHandler.exitApp();
          // Reset popup state on exit, though this won't persist across app restart
          setShowPopup(false);
        }}>
          <Text style={styles.popupButtonText}>YES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.popupButton, { flex: 1, backgroundColor: '#ccc' }]} onPress={() => setShowPopup(false)}>
          <Text style={[styles.popupButtonText, { color: '#333' }]}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Animated.View>
);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: colors.card,
        }}
      >
        <View style={[GlobalStyleSheet.container, { paddingTop: 0 }]}>
          <HomeHeader theme={theme} />
          <StoryList />
          <Categories 
            key={categoriesKey} // Force re-render when key changes
            // ref={categoriesRef}
            onSelectCategory={setSelectedCategory} 
          />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={windowHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingTop: 65,
          paddingRight: 10,
          paddingLeft: 10,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000']}
          />
        }
        onScroll={(e) => internalPostListRef.current?.handleScroll?.(e)}
        onScrollEndDrag={(e) => internalPostListRef.current?.handlePull?.(e)}
      >
        <View style={{ height: windowHeight * 0.2 }} />
        <PostList
          ref={internalPostListRef}
          sheetRef={sheetRef}
          optionSheet={moresheet}
          commentSheet={commentSheetRef}
          categoryId={selectedCategory}
          scrollRef={scrollRef}
        />
      </ScrollView>

      <PostShareSheet ref={sheetRef} />
      <PostoptionSheet ref={moresheet} />
        {showPopup && <Popup />}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  popupOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    elevation: 10,
  },
  popupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  popupSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  popupButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  popupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
});

export default HomeScreen;
 