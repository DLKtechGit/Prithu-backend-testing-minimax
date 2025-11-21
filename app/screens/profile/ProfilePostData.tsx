
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { IMAGES, FONTS, COLORS } from '../../constants/theme';
import PostoptionSheet from '../../components/bottomsheet/PostoptionSheet';

const { width: screenWidth } = Dimensions.get('window');

// Individual Reel Item Component with autoplay (SQUARE FORMAT)
const ReelItem = ({ data, index, onPress, onOpenSheet, scrollY }: any) => {
    const videoRef = useRef<Video>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [itemY, setItemY] = useState(0);
    const [itemHeight, setItemHeight] = useState(0);

    // Handle video status updates
    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setIsPlaying(status.isPlaying);

            // Loop the video when it ends
            if (status.didJustFinish) {
                videoRef.current?.replayAsync();
            }
        }
    };

    // Handle layout to get position
    const handleLayout = (event: any) => {
        const { y, height } = event.nativeEvent.layout;
        setItemY(y);
        setItemHeight(height);
    };

    // Check if item is visible and play/pause accordingly (optimized)
    useEffect(() => {
        if (scrollY === undefined || itemY === 0) return;

        const screenHeight = Dimensions.get('window').height;
        const isVisible = itemY < scrollY + screenHeight && itemY + itemHeight > scrollY;

        // Only update if visibility state actually changed
        if (isVisible && !isPlaying) {
            videoRef.current?.playAsync().catch(() => {
                // Silently handle play errors
            });
        } else if (!isVisible && isPlaying) {
            videoRef.current?.pauseAsync().catch(() => {
                // Silently handle pause errors
            });
        }
    }, [scrollY, itemY, itemHeight]);

    // Pause video on unmount
    useEffect(() => {
        return () => {
            videoRef.current?.pauseAsync().catch(() => { });
        };
    }, []);

    return (
        <View
            onLayout={handleLayout}
            style={{ width: '33.33%' }}
        >
            <TouchableOpacity
                style={{ padding: 2 }}
                onPress={onPress}
                activeOpacity={0.9}
            >
                {/* Square Video (1:1 aspect ratio like images) */}
                <Video
                    ref={videoRef}
                    source={{ uri: data.contentUrl }}
                    style={{
                        width: '100%',
                        height: undefined,
                        aspectRatio: 1 / 1, // Square format
                        backgroundColor: '#000',
                        borderRadius: 4,
                    }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    isLooping={true}
                    isMuted={true}
                    useNativeControls={false}
                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                />

                {/* Play Icon Overlay (top-right) */}
                <View style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: 12,
                    padding: 4,
                }}>
                    <Image
                        style={{ width: 16, height: 16, tintColor: '#fff' }}
                        source={IMAGES.play}
                    />
                </View>

                {/* Like Count (bottom-left) */}
                <View style={{
                    flexDirection: 'row',
                    gap: 5,
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    position: 'absolute',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    bottom: 8,
                    left: 8
                }}>
                    <Image
                        style={{ width: 10, height: 10, resizeMode: 'contain', tintColor: '#fff' }}
                        source={IMAGES.like}
                    />
                    <Text style={{ ...FONTS.fontRegular, fontSize: 10, color: COLORS.white, lineHeight: 14 }}>
                        {data.like}
                    </Text>
                </View>

                {/* More Options Button (top-left) */}
                <TouchableOpacity
                    style={{ position: 'absolute', top: 8, left: 8 }}
                    onPress={(e) => {
                        e.stopPropagation();
                        onOpenSheet(data.id);
                    }}
                >
                    <View style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: 12,
                        padding: 4,
                    }}>
                        <Image
                            style={{ width: 16, height: 16, tintColor: COLORS.white }}
                            source={IMAGES.more}
                        />
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );
};

// Main Component
const ProfilePostData = ({ ProfilepicData, allPostsData, navigation, onNotInterested, setSelectedPostId, scrollY }: any) => {
    const optionSheetRef = useRef<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Handle opening the sheet
    const handleOpenSheet = (postId: string) => {
        console.log('Opening PostoptionSheet with postId:', postId);
        setIsSheetOpen(true);
        optionSheetRef.current?.openSheet(postId);
        if (setSelectedPostId) {
            setSelectedPostId(postId);
        }
    };

    // Handle closing the sheet
    const handleCloseSheet = () => {
        setIsSheetOpen(false);
    };

    // Close sheet when navigating away
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            if (optionSheetRef.current) {
                optionSheetRef.current.close();
                handleCloseSheet();
            }
        });
        return unsubscribe;
    }, [navigation]);

    return (
        <View style={{ marginTop: 5, flexDirection: 'row', flexWrap: 'wrap' }}>
            {ProfilepicData.map((data: any, index: any) => {
                const isVideo = data.type === 'video';

                if (isVideo) {
                    // Render vertical reel with autoplay
                    return (
                        <ReelItem
                            key={index}
                            data={data}
                            index={index}
                            scrollY={scrollY}
                            onPress={() => {
                                navigation.navigate('Reels', {
                                    initialVideoId: data.id,
                                });
                            }}
                            onOpenSheet={handleOpenSheet}
                        />
                    );
                }

                // Render image post (square format)
                return (
                    <View
                        key={index}
                        style={{ width: '33.33%' }}
                    >
                        <TouchableOpacity
                            style={{ padding: 2 }}
                            onPress={() => {
                                navigation.navigate('ProfilePost', {
                                    initialPostId: data.id,
                                    allPostsData: allPostsData,
                                });
                            }}
                        >
                            <Image
                                style={{ width: '100%', height: null, aspectRatio: 1 / 1, borderRadius: 4 }}
                                source={data.image}
                            />

                            {/* Like Count */}
                            <View style={{
                                flexDirection: 'row',
                                gap: 5,
                                alignItems: 'center',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                position: 'absolute',
                                borderRadius: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                bottom: 8,
                                left: 8
                            }}>
                                <Image
                                    style={{ width: 10, height: 10, resizeMode: 'contain', tintColor: '#fff' }}
                                    source={IMAGES.like}
                                />
                                <Text style={{ ...FONTS.fontRegular, fontSize: 10, color: COLORS.white, lineHeight: 14 }}>
                                    {data.like}
                                </Text>
                            </View>

                            {/* More Options Button */}
                            <TouchableOpacity
                                style={{ position: 'absolute', top: 8, left: 8 }}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleOpenSheet(data.id);
                                }}
                            >
                                <View style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    borderRadius: 12,
                                    padding: 4,
                                }}>
                                    <Image
                                        style={{ width: 16, height: 16, tintColor: COLORS.white }}
                                        source={IMAGES.more}
                                    />
                                </View>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </View>
                );
            })}
            {isSheetOpen && (
                <PostoptionSheet
                    ref={optionSheetRef}
                    onNotInterested={(postId: string) => {
                        onNotInterested(postId);
                    }}
                />
            )}
        </View>
    );
};

export default ProfilePostData;