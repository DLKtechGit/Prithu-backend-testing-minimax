import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
    ScrollView,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { COLORS, FONTS, IMAGES, SIZES } from '../../constants/theme';
import LikeBtn from '../../components/likebtn/LikeBtn';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import PostoptionSheet from '../../components/bottomsheet/PostoptionSheet';
import { GlobalStyleSheet } from '../../constants/styleSheet';

const width = Dimensions.get('screen').width;
const height = Dimensions.get('screen').height;

const Status = ({ route, navigation }: any) => {
    const { name, image, statusData, type, isVideo, contentUrl, initialIndex = 0 } = route.params;

    const moresheet = useRef<any>();
    const videoRef = useRef<Video>(null);

    // Group stories by user
    const groupStoriesByUser = () => {
        const userGroups: any[] = [];
        const userMap = new Map();

        statusData.forEach((story: any) => {
            const userId = story.createdBy || story.userName || 'unknown';

            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    userId,
                    userName: story.userName || name,
                    profileAvatar: story.profileAvatar,
                    stories: []
                });
            }

            userMap.get(userId).stories.push(story);
        });

        userMap.forEach(value => userGroups.push(value));
        return userGroups;
    };

    const userGroups = groupStoriesByUser();

    // Find which user group contains the initial story
    const findInitialUserIndex = () => {
        let storyCount = 0;
        for (let i = 0; i < userGroups.length; i++) {
            const userStoryCount = userGroups[i].stories.length;
            if (initialIndex < storyCount + userStoryCount) {
                return {
                    userIndex: i,
                    storyIndex: initialIndex - storyCount
                };
            }
            storyCount += userStoryCount;
        }
        return { userIndex: 0, storyIndex: 0 };
    };

    const initialPosition = findInitialUserIndex();

    const [currentUserIndex, setCurrentUserIndex] = useState(initialPosition.userIndex);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialPosition.storyIndex);
    const [isPlaying, setIsPlaying] = useState(true);
    const [videoLoading, setVideoLoading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [videoDuration, setVideoDuration] = useState(5000); // Default 5 seconds for images

    // Animation values for Instagram-like transitions
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const profileScaleAnim = useRef(new Animated.Value(1)).current;

    // Get current user and story
    const currentUser = userGroups[currentUserIndex];
    const currentStories = currentUser?.stories || [];
    const currentItem = currentStories[currentStoryIndex];

    // Derived properties for current item
    const currentUri = currentItem?.contentUrl || currentItem?.uri || currentItem;
    const currentIsVideo = currentItem?.type ? currentItem.type === 'video' : (isVideo || type === 'video');
    const displayName = currentUser?.userName || name;
    const displayImage = currentUser?.profileAvatar ? { uri: currentUser.profileAvatar } : image;

    // Animate when user changes
    const prevUserIndexRef = useRef(currentUserIndex);
    useEffect(() => {
        if (prevUserIndexRef.current !== currentUserIndex) {
            // User changed - trigger animations
            const direction = currentUserIndex > prevUserIndexRef.current ? 1 : -1;

            // Slide and fade out
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -direction * width,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Reset position and slide in from opposite side
                slideAnim.setValue(direction * width);

                Animated.parallel([
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        tension: 65,
                        friction: 8,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        tension: 65,
                        friction: 8,
                        useNativeDriver: true,
                    }),
                ]).start();
            });

            // Profile picture pulse animation
            Animated.sequence([
                Animated.spring(profileScaleAnim, {
                    toValue: 1.15,
                    tension: 100,
                    friction: 3,
                    useNativeDriver: true,
                }),
                Animated.spring(profileScaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();

            prevUserIndexRef.current = currentUserIndex;
        }
    }, [currentUserIndex]);

    // Pause/Resume when navigating to/from AnotherProfile
    useFocusEffect(
        React.useCallback(() => {
            // Screen is focused - resume playback
            console.log('📱 Status screen focused - resuming');
            setIsPaused(false);

            // Resume video if it's a video story
            if (currentIsVideo && videoRef.current) {
                videoRef.current.playAsync();
            }

            return () => {
                // Screen is unfocused - pause playback
                console.log('📱 Status screen unfocused - pausing');
                setIsPaused(true);

                // Pause video if it's a video story
                if (currentIsVideo && videoRef.current) {
                    videoRef.current.pauseAsync();
                }
            };
        }, [currentIsVideo])
    );

    useEffect(() => {
        let timer: NodeJS.Timeout;

        // For images, auto-advance after videoDuration (5 seconds)
        // For videos, let the video control the timing
        if (!currentIsVideo && !isPaused) {
            timer = setTimeout(() => {
                // Check if this is the last story of the current user
                if (currentStoryIndex === currentStories.length - 1) {
                    // Move to next user or go back if no more users
                    if (currentUserIndex === userGroups.length - 1) {
                        return navigation.goBack();
                    }
                    setCurrentUserIndex(currentUserIndex + 1);
                    setCurrentStoryIndex(0);
                } else {
                    // Move to next story of same user
                    setCurrentStoryIndex(currentStoryIndex + 1);
                }
            }, videoDuration);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [currentUserIndex, currentStoryIndex, currentIsVideo, isPaused, videoDuration, currentStories.length, userGroups.length]);

    // Handle video playback status
    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setVideoLoading(false);
            setIsPlaying(status.isPlaying);

            // Capture video duration for progress bar
            if (status.durationMillis && status.durationMillis > 0) {
                setVideoDuration(status.durationMillis);
            }

            // Auto-advance when video ends
            if (status.didJustFinish && !isPaused) {
                // Check if this is the last story of the current user
                if (currentStoryIndex === currentStories.length - 1) {
                    // Move to next user or go back if no more users
                    if (currentUserIndex === userGroups.length - 1) {
                        navigation.goBack();
                    } else {
                        setCurrentUserIndex(currentUserIndex + 1);
                        setCurrentStoryIndex(0);
                        // Reset duration for next story (might be image)
                        setVideoDuration(5000);
                    }
                } else {
                    // Move to next story of same user
                    setCurrentStoryIndex(currentStoryIndex + 1);
                    // Reset duration for next story (might be image)
                    setVideoDuration(5000);
                }
            }
        }
    };

    // Replay video when current changes
    useEffect(() => {
        if (currentIsVideo && videoRef.current && !isPaused) {
            videoRef.current.playAsync();
        }
    }, [currentUserIndex, currentStoryIndex, currentIsVideo, isPaused]);

    // Toggle play/pause for videos
    const togglePlayPause = async () => {
        if (!currentIsVideo) return;

        try {
            if (isPlaying) {
                await videoRef.current?.pauseAsync();
                setIsPlaying(false);
                setIsPaused(true);
            } else {
                await videoRef.current?.playAsync();
                setIsPlaying(true);
                setIsPaused(false);
            }
        } catch (error) {
            console.error('Error toggling play/pause:', error);
        }
    };

    // Handle long press - pause video
    const handleLongPress = () => {
        if (currentIsVideo) {
            togglePlayPause();
        } else {
            // For images, you might want to pause the auto-advance
            setIsPaused(true);
        }
    };

    // Handle press out - resume video/auto-advance
    const handlePressOut = () => {
        if (currentIsVideo) {
            // Don't auto-resume on press out for videos - let user tap to play
            // You can remove this if you want auto-resume on press out
        } else {
            setIsPaused(false);
        }
    };

    // Handle single tap - play/pause for videos, advance for images
    const handleSingleTap = () => {
        if (currentIsVideo) {
            togglePlayPause();
        } else if (!isPaused) {
            // For images, advance to next on tap if not paused
            if (currentStoryIndex === currentStories.length - 1) {
                // Move to next user or go back if no more users
                if (currentUserIndex === userGroups.length - 1) {
                    navigation.goBack();
                } else {
                    setCurrentUserIndex(currentUserIndex + 1);
                    setCurrentStoryIndex(0);
                }
            } else {
                setCurrentStoryIndex(currentStoryIndex + 1);
            }
        } else {
            // If image is paused, resume auto-advance
            setIsPaused(false);
        }
    };

    const ProgressView = (props: { index: number; duration: number }) => {
        const progressAnim = useRef(new Animated.Value(0)).current;
        const { index, duration } = props;

        useEffect(() => {
            // Reset progress when story changes
            progressAnim.setValue(0);

            if (currentStoryIndex === index && !isPaused) {
                // Animate progress bar to match story duration
                Animated.timing(progressAnim, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: false,
                }).start();
            } else if (currentStoryIndex > index) {
                // Story already viewed - fill completely
                progressAnim.setValue(1);
            } else {
                // Story not yet viewed - empty
                progressAnim.setValue(0);
            }

            return () => {
                progressAnim.stopAnimation();
            };
        }, [currentStoryIndex, index, isPaused, duration]);

        // Pause/resume animation
        useEffect(() => {
            if (currentStoryIndex === index) {
                if (isPaused) {
                    progressAnim.stopAnimation();
                } else {
                    // Resume from current value
                    Animated.timing(progressAnim, {
                        toValue: 1,
                        duration: duration * (1 - (progressAnim as any)._value),
                        useNativeDriver: false,
                    }).start();
                }
            }
        }, [isPaused]);

        const barWidth = (width - 40) / currentStories.length;

        return (
            <Animated.View
                style={{
                    backgroundColor: '#fff',
                    height: 2,
                    width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, barWidth],
                    }),
                }}
            />
        );
    };

    const theme = useTheme();
    const { colors }: { colors: any } = theme;

    return (
        <SafeAreaView style={[GlobalStyleSheet.container, { padding: 0, flex: 1, backgroundColor: '#000' }]}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={'#000'}
            />
            <KeyboardAvoidingView style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsHorizontalScrollIndicator={false}
                >
                    <Animated.View
                        style={[
                            styles.statusTabContainer,
                            { opacity: fadeAnim }
                        ]}
                    >
                        {currentStories.map((item: any, index: any) => (
                            <View
                                key={index}
                                style={[
                                    styles.statusTab,
                                    {
                                        marginHorizontal: 2,
                                        backgroundColor: 'rgba(255,255,255,.2)',
                                    },
                                ]}
                            >
                                <ProgressView index={index} duration={videoDuration} />
                            </View>
                        ))}
                    </Animated.View>
                    {/* User counter indicator */}
                    {/* {userGroups.length > 1 && (
                        <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                            <Text style={{ ...FONTS.fontSm, color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
                                {currentUserIndex + 1} of {userGroups.length}
                            </Text>
                        </View>
                    )} */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}>
                        <TouchableOpacity
                            onPress={() => {
                                // Navigate to AnotherProfile with the user's data
                                const userId = currentItem?.userId;
                                const feedId = currentItem?._id;

                                if (userId && feedId) {
                                    navigation.navigate('AnotherProfile', {
                                        // feedId: feedId,
                                        profileUserId: userId,
                                        roleRef: 'User'
                                    });
                                } else {
                                    console.warn('Missing userId or feedId:', { userId, feedId });
                                }
                            }}
                            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                        >
                            <Animated.Image
                                style={{
                                    height: 40,
                                    width: 40,
                                    borderRadius: 20,
                                    marginRight: 10,
                                    transform: [{ scale: profileScaleAnim }],
                                }}
                                source={displayImage}
                            />

                            <Animated.Text
                                style={{
                                    ...FONTS.font,
                                    color: COLORS.white,
                                    flex: 1,
                                    opacity: fadeAnim
                                }}
                            >
                                {displayName}
                            </Animated.Text>
                        </TouchableOpacity>
                        {/* <TouchableOpacity
                            onPress={() => moresheet.current.openSheet()}
                            style={{
                                height: 50,
                                width: 50,
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 999,
                            }}
                        >
                            <Image
                                style={{ tintColor: '#fff', height: 20, width: 20 }}
                                source={IMAGES.more}
                            />
                        </TouchableOpacity> */}
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{
                                height: 50,
                                width: 50,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Image
                                style={{ tintColor: '#fff', height: 20, width: 20 }}
                                source={IMAGES.close2}
                            />
                        </TouchableOpacity>
                    </View>

                    <Animated.View
                        style={[
                            styles.imageContainer,
                            {
                                transform: [
                                    { translateX: slideAnim },
                                    { scale: scaleAnim }
                                ],
                                opacity: fadeAnim,
                            }
                        ]}
                    >
                        {currentIsVideo ? (
                            <>
                                <Video
                                    ref={videoRef}
                                    source={{ uri: currentUri }}
                                    style={styles.imageStyle}
                                    resizeMode={ResizeMode.CONTAIN}
                                    shouldPlay={!isPaused}
                                    isLooping={false}
                                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                                    onLoadStart={() => setVideoLoading(true)}
                                    onLoad={() => setVideoLoading(false)}
                                    useNativeControls={false}
                                    isMuted={false}
                                />
                                {videoLoading && (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#fff" />
                                    </View>
                                )}

                                {/* Play/Pause overlay indicator */}
                                {!isPlaying && !videoLoading && (
                                    <TouchableOpacity
                                        style={styles.playPauseOverlay}
                                        onPress={togglePlayPause}
                                    >
                                        <View style={styles.playButton}>
                                            <Text style={styles.playIcon}>▶</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <Image
                                source={typeof currentUri === 'string' ? { uri: currentUri } : currentUri}
                                resizeMode="contain"
                                style={styles.imageStyle}
                            />
                        )}
                    </Animated.View>

                    {/* Left side controller - previous */}
                    <TouchableOpacity
                        onPress={() => {
                            if (currentStoryIndex === 0) {
                                // Go to previous user's last story
                                if (currentUserIndex === 0) {
                                    return navigation.goBack();
                                }
                                const prevUserIndex = currentUserIndex - 1;
                                const prevUserStories = userGroups[prevUserIndex].stories;
                                setCurrentUserIndex(prevUserIndex);
                                setCurrentStoryIndex(prevUserStories.length - 1);
                            } else {
                                // Go to previous story of same user
                                setCurrentStoryIndex(currentStoryIndex - 1);
                            }
                            setIsPaused(false);
                        }}
                        style={[styles.controller, { left: 0 }]}
                    />

                    {/* Right side controller - next */}
                    <TouchableOpacity
                        onPress={() => {
                            if (currentStoryIndex === currentStories.length - 1) {
                                // Move to next user or go back if no more users
                                if (currentUserIndex === userGroups.length - 1) {
                                    return navigation.goBack();
                                }
                                setCurrentUserIndex(currentUserIndex + 1);
                                setCurrentStoryIndex(0);
                            } else {
                                // Move to next story of same user
                                setCurrentStoryIndex(currentStoryIndex + 1);
                            }
                            setIsPaused(false);
                        }}
                        style={[styles.controller, { right: 0 }]}
                    />

                    {/* Center area for play/pause and long press */}
                    <Pressable
                        onLongPress={handleLongPress}
                        onPressOut={handlePressOut}
                        onPress={handleSingleTap}
                        style={[styles.centerController]}
                    />

                    {/* <View style={{ flexDirection: 'row', padding: 15, alignItems: 'center', position: 'absolute', bottom: 0, backgroundColor: '#000' }}>
                        <TextInput
                            style={{
                                ...FONTS.font,
                                color: COLORS.white,
                                height: 45,
                                borderWidth: 1,
                                flex: 1,
                                borderRadius: 25,
                                borderColor: 'rgba(255,255,255,.6)',
                                paddingHorizontal: 15,
                                paddingLeft: 20,
                                marginRight: 10,
                                alignItems: 'center'
                            }}
                            placeholder='Send message'
                            placeholderTextColor={COLORS.white}
                        />

                        <LikeBtn
                            color="#fff"
                            sizes="sm"
                            onPress={() => { }}
                            liked={false}
                            COLORS={COLORS}
                        />

                        <TouchableOpacity
                            style={{
                                height: 50,
                                width: 50,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Image
                                style={{ width: 25, height: 25, tintColor: '#fff', resizeMode: 'contain' }}
                                source={IMAGES.send}
                            />
                        </TouchableOpacity>
                    </View> */}
                </ScrollView>
            </KeyboardAvoidingView>
            <PostoptionSheet
                ref={moresheet}
                hidePost={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    statusTabContainer: {
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 12,
        paddingBottom: 10,
        paddingTop: 10,
    },
    statusTab: {
        height: 2,
        backgroundColor: 'rgba(255,255,255,.2)',
        flex: 1,
        overflow: 'hidden',
    },
    controller: {
        position: 'absolute',
        width: width / 3,
        height: height * 0.85,
        bottom: 0,
        zIndex: 10,
    },
    centerController: {
        position: 'absolute',
        width: width / 3,
        height: height * 0.85,
        bottom: 0,
        left: width / 3,
        right: width / 3,
        zIndex: 10,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        minHeight: 600,
        position: 'relative',
    },
    imageStyle: {
        width: '100%',
        height: height / 1.2,
        maxHeight: height / 1.2,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    playPauseOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    playIcon: {
        color: 'white',
        fontSize: 30,
        marginLeft: 5,
    },
});

export default Status;