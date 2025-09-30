//old one 

import React, { useRef, useState, forwardRef, useImperativeHandle, useEffect, useMemo, memo } from 'react';
import { View, Dimensions, ActivityIndicator, Text } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PostCard from '../../components/PostCard';
import {connectSocket} from '../../../webSocket/webScoket';
import {startHeartbeat} from "../../../webSocket/heartBeat";
 import api from "../../../apiInterpretor/apiInterceptor"

const { height: windowHeight } = Dimensions.get('window');

const MemoPostCard = memo(PostCard, (prevProps, nextProps) => {
    return (
        prevProps.visibleBoxes === nextProps.visibleBoxes &&
        prevProps.postimage[0].image === nextProps.postimage[0].image &&
        prevProps.caption === nextProps.caption
    );
});

// Fisher-Yates shuffle algorithm for efficient array shuffling
const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
};

const PostList = forwardRef(({ scrollRef, ...props }: any, ref: any) => {
    const [visibleBoxes, setVisibleBoxes] = useState<any>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshingTop, setRefreshingTop] = useState(false);

    const boxRefs = useRef<any>({});

    const fetchPosts = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                console.warn('No user token found in AsyncStorage');
                return;
            }

            const url = props.categoryId
                ? `/api/all/catagories/${props.categoryId}`
                : `/api/get/all/feeds/user`;

            console.log('Fetching posts from:', url);

            const res = await api.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('API Response:', JSON.stringify(res.data, null, 2));

            const feeds = props.categoryId ? res.data.category.feeds : res.data.feeds;
            if (!feeds) {
                console.warn('No feeds found in API response');
                setPosts([]);
                return;
            }

            const mappedFeeds = feeds
                .map((item: any) => ({
                    _id: item.feedId || item._id,
                    creatorUsername: item.userName,
                    creatorAvatar: item.profileAvatar !== 'Unknown' ? item.profileAvatar : null,
                    timeAgo: item.timeAgo,
                    contentUrl: item.contentUrl?.startsWith('http')
                        ? item.contentUrl
                        : `http://192.168.1.6:5000/${item.contentUrl.replace(/\\/g, '/')}`,
                    caption: item.caption || '',
                    tags: item.tags || [],
                    background: item.background || '#fff',
                    comments: item.comments || [],
                     commentsCount: item.commentsCount || 0, // Add this line
                    likesCount: item.likesCount || 0,
                    type: item.type,
                    accountId:item.createdByAccount,
                }))
                .filter((item: any) => item.type === 'image');

            setPosts(mappedFeeds);
            console.log('Mapped Feeds:', mappedFeeds);
        } catch (error) {
            console.error('Error fetching posts:', error.response?.data || error.message);
            setPosts([]);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [props.categoryId]);

    useEffect(() => {
    const initSession = async () => {
      const token = await AsyncStorage.getItem("userToken");
      const sessionId = await AsyncStorage.getItem("sessionId");
      if (token && sessionId) {
        await connectSocket();
        startHeartbeat();
      }
    };
 
    initSession();
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

    const handlePull = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY < -50 && !refreshingTop) setRefreshingTop(true);
        if (offsetY >= 0 && refreshingTop) setRefreshingTop(false);
    };

    const handleHidePost = (postId: string) => {
        setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
    };

    useImperativeHandle(ref, () => ({
        refreshPosts: async () => {
            setRefreshingTop(true);
            setPosts([]);
            await new Promise((resolve) => requestAnimationFrame(resolve));
            
            // Shuffle the posts when refreshing
            const shuffledPosts = shuffleArray([...posts]);
            setPosts(shuffledPosts);
            
            setRefreshingTop(false);
        },
        scrollToTop: () => {
            if (scrollRef?.current) {
                scrollRef.current.scrollTo({ y: 0, animated: true });
            }
        },
        handleScroll,
        handlePull,
    }));

    useEffect(() => {
        const loadInitial = async () => {
            setLoading(true);
            await fetchPosts();
            setLoading(false);
        };
        loadInitial();
    }, []);

    const handleBoxLayout = (id: any) => (event: any) => {
        const pageY = event.nativeEvent.layout.y;
        const height = event.nativeEvent.layout.height;
        boxRefs.current[id] = { y: pageY, height };
    };

    const memoVisibleBoxes = useMemo(() => visibleBoxes, [visibleBoxes]);

    const handleNotInterested = (postId: string) => {
        setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
    };

    if (loading || refreshingTop) {
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

    if (posts.length === 0) {
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

    return (
        <View>
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
                        like={post.likesCount || 0}
                        commentsCount={post.commentsCount || 0} 
                        posttitle={post.caption}
                        posttag={post.tags?.join(' ')}
                        sheetRef={props.sheetRef}
                        optionSheet={props.optionSheet}
                        hasStory={false}
                        reelsvideo={null}
                        caption={post.caption}
                        background={post.background || '#fff'}
                        visibleBoxes={memoVisibleBoxes}
                        onNotInterested={handleNotInterested}
                        onHidePost={handleHidePost}
                        accountId={post.accountId}
                        
                    />
                </View>
            ))}
        </View>
    );
});

export default PostList;
