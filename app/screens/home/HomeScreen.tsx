import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

import {
  View,
  SafeAreaView,
  ScrollView,
  Dimensions,
  BackHandler,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import HomeHeader from './HomeHeader';
import StoryList from './StoryList';
import PostList from './PostList';
import Categories from './Categories';
import PostShareSheet from '../../components/bottomsheet/PostShareSheet';
import PostoptionSheet from '../../components/bottomsheet/PostoptionSheet';
import { useFocusEffect } from '@react-navigation/native';
import CommentSheet from '../comment/CommentSheet';

const { height: windowHeight } = Dimensions.get('window');


interface HomeScreenProps {
  postListRef: React.RefObject<any>; // ✅ receive the ref from BottomNavigation
}

const HomeScreen = ({ postListRef }: HomeScreenProps) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const sheetRef = useRef<any>();
  const moresheet = useRef<any>();
  const scrollRef = useRef<ScrollView>(null);
    const optionSheetRef = useRef(null);
    const commentSheetRef = useRef<any>();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);


  //  Expose scrollToTop so BottomNavigation can call it
  useEffect(() => {
    if (postListRef) {
      postListRef.current = {
        scrollToTop: () => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        },
        refreshPosts: async () => {
          if (postListRef.current?.refreshPosts) {
            await postListRef.current.refreshPosts();
          }
        },
      };
    }
  }, [postListRef]);

  // ✅ Android Back Button
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', onPress: () => null, style: 'cancel' },
          { text: 'YES', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );

  // ✅ Pull to Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (postListRef.current?.refreshPosts) {
      await postListRef.current.refreshPosts(); // call PostList refresh
    }
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      {/* Sticky Header */}
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
         {/* ✅ Pass callback to update selectedCategory */}
          <Categories onSelectCategory={setSelectedCategory} />
        </View>
      </View>

      {/* ScrollView with Pull-to-Refresh */}
      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={windowHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingTop: 80,
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
      >
        <View style={{ height: windowHeight * 0.2 }} />
        <PostList sheetRef={sheetRef} optionSheet={moresheet} commentSheet={commentSheetRef} categoryId={selectedCategory} />
      </ScrollView>

      <PostShareSheet ref={sheetRef} />
      <PostoptionSheet ref={moresheet} />
      {/* <CommentSheet ref={commentSheetRef} /> */}
    </SafeAreaView>
  );
};

export default HomeScreen;
