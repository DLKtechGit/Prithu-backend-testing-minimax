
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { IMAGES, FONTS, COLORS } from '../../constants/theme';
import PostoptionSheet from '../../components/bottomsheet/PostoptionSheet';

const ProfilePostData = ({ ProfilepicData, navigation, onNotInterested, setSelectedPostId }: any) => {
    const optionSheetRef = useRef<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false); // State to control sheet rendering

    // Handle opening the sheet
    const handleOpenSheet = (postId: string) => {
        console.log('Opening PostoptionSheet with postId:', postId);
        setIsSheetOpen(true); // Render the sheet
        optionSheetRef.current?.openSheet(postId);
        if (setSelectedPostId) {
            setSelectedPostId(postId);
        }
    };

    // Handle closing the sheet
    const handleCloseSheet = () => {
        setIsSheetOpen(false); // Unmount the sheet
    };

    

    // Close sheet when navigating away
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            if (optionSheetRef.current) {
                optionSheetRef.current.close(); // Close sheet on navigation
                handleCloseSheet();
            }
        });
        return unsubscribe; // Cleanup listener
    }, [navigation]);

    return (
        <View style={{ marginTop: 5, flexDirection: 'row', flexWrap: 'wrap' }}>
            {ProfilepicData.map((data: any, index: any) => {
                return (
                    <View
                        key={index}
                        style={[{ width: '33.33%' }]}
                    >
                        <TouchableOpacity
                            style={{ padding: 2 }}
                            onPress={() => navigation.navigate('ProfilePost')}
                        >
                            <Image
                                style={{ width: '100%', height: null, aspectRatio: 1 / 1 }}
                                source={data.image}
                            />
                            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.20)', position: 'absolute', borderRadius: 15, paddingHorizontal: 10, paddingVertical: 3, bottom: 10, left: 10 }}>
                                <Image
                                    style={{ width: 10, height: 10, resizeMode: 'contain', tintColor: '#fff' }}
                                    source={IMAGES.like}
                                />
                                <Text style={{ ...FONTS.fontRegular, fontSize: 10, color: COLORS.white, lineHeight: 14 }}>{data.like}</Text>
                            </View>
                            {/* Add "more" button to open PostoptionSheet */}
                            <TouchableOpacity
                                style={{ position: 'absolute', top: 10, right: 10 }}
                                onPress={() => handleOpenSheet(data.id)}
                            >
                                <Image
                                    style={{ width: 18, height: 18, tintColor: COLORS.white }}
                                    source={IMAGES.more}
                                />
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
                        // handleCloseSheet(); // Close sheet after action
                    }}
                />
            )}
        </View>
    );
};

export default ProfilePostData;