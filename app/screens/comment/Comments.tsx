import React, { useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import { TextInput } from 'react-native-gesture-handler';
import Collapsible from 'react-native-collapsible';
import LikeBtn from '../../components/likebtn/LikeBtn';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ChatoptionSheet from '../../components/bottomsheet/ChatoptionSheet';

const Comments = () => {
    const theme = useTheme();
    const { colors }: { colors: any } = theme;
    const navigation = useNavigation<any>();
    const route = useRoute<any>(); // Get feedId from navigation params

    const moresheet = useRef<any>(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [feedId, setFeedId] = useState<string | null>(null);

    // Set feedId from navigation params (passed from PostCard)
    useEffect(() => {
        if (route.params?.feedId) {
            setFeedId(route.params.feedId);
            fetchComments(route.params.feedId);
        }
    }, [route.params?.feedId]);

    // Fetch comments from backend (same API as CommentSheet)
    const fetchComments = async (id?: string) => {
        if (!feedId && !id) return;
        const currentFeedId = id || feedId;
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }

            const response = await axios.post(
                `http://192.168.1.77:5000/api/get/comments/for/feed`,
                { feedId: currentFeedId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setComments(response.data.comments || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching comments:', error.response?.data || error.message);
            setLoading(false);
            Alert.alert('Error', 'Failed to load comments');
        }
    };

    // Post comment to backend (same API as CommentSheet)
    const postComment = async () => {
        if (!commentText.trim() || !feedId) return;

        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }

            const response = await axios.post(
                'http://192.168.1.77:5000/api/user/feed/comment',
                { feedId, commentText },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Add new comment to list (optimistic update)
            setComments([response.data.comment, ...comments]);
            setCommentText('');
        } catch (error) {
            console.error('Error posting comment:', error.response?.data);
            Alert.alert('Error', 'Failed to post comment');
        }
    };

    const Item = ({ title, image, time, comment, like, commentNumber, replies, moresheet, hasStory, navigation, theme }: any) => {
        const [show, setshow] = useState(true);
        const { colors }: { colors: any } = theme;

        return (
            <View style={[GlobalStyleSheet.container, { marginTop: 0, paddingTop: 0 }]}>
                <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ marginTop: 10 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    hasStory == false
                                        ? navigation.navigate('status', {
                                              name: title,
                                              image: image,
                                              statusData: [IMAGES.profilepic11, IMAGES.profilepic12]
                                          })
                                        : navigation.navigate('AnotherProfile')
                                }}
                            >
                                {hasStory == false ? (
                                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                        <Image
                                            style={{ width: 42, height: 42, borderRadius: 50 }}
                                            source={image}
                                        />
                                        <Image
                                            style={{ width: 50, height: 50, position: 'absolute', resizeMode: 'contain' }}
                                            source={IMAGES.cricle}
                                        />
                                    </View>
                                ) : (
                                    <View>
                                        <Image
                                            style={{ width: 42, height: 42, borderRadius: 50 }}
                                            source={image}
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginLeft: 10, flex: 1 }}>
                            <View style={[GlobalStyleSheet.flexaling, { gap: 10 }]}>
                                <TouchableOpacity onPress={() => navigation.navigate('AnotherProfile')}>
                                    <Text style={[GlobalStyleSheet.textfont, { marginBottom: 5, color: colors.title }]}>
                                        {title}
                                    </Text>
                                </TouchableOpacity>
                                <View
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 100,
                                        backgroundColor: colors.placeholder,
                                        opacity: 0.5
                                    }}
                                />
                                <Text style={{ ...FONTS.fontSm, ...FONTS.fontMedium, color: colors.text, opacity: 0.5 }}>
                                    {time}
                                </Text>
                            </View>
                            <View>
                                <Text style={{ ...FONTS.font, ...FONTS.fontMedium, color: colors.title, marginBottom: 10 }}>
                                    {comment}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <TouchableOpacity>
                                    <LikeBtn color={colors.title} sizes={'xm'} />
                                </TouchableOpacity>
                                <Text style={[GlobalStyleSheet.textfont, { color: colors.title }]}>{like}</Text>

                                {replies && replies.length > 0 && (
                                    <View style={{ flexDirection: 'row' }}>
                                        <Image
                                            style={[GlobalStyleSheet.image2, { tintColor: colors.title }]}
                                            source={IMAGES.comment}
                                        />
                                        <Text style={[GlobalStyleSheet.textfont, { marginLeft: 8, color: colors.title }]}>
                                            {commentNumber}
                                        </Text>
                                    </View>
                                )}
                                <TouchableOpacity>
                                    <Text style={[GlobalStyleSheet.textfont, { color: colors.title, opacity: 0.4 }]}>Reply</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => moresheet.current.openSheet()}>
                                <Image
                                    style={{
                                        width: 15,
                                        height: 15,
                                        resizeMode: 'contain',
                                        marginTop: 15,
                                        tintColor: colors.title
                                    }}
                                    source={IMAGES.more}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {replies && replies.length > 0 && (
                        <View style={{ marginLeft: 46 }}>
                            <TouchableOpacity onPress={() => setshow(!show)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Text style={[GlobalStyleSheet.textfont, { color: colors.text }]}>See Reply</Text>
                                    <Image
                                        style={{
                                            width: 15,
                                            height: 15,
                                            tintColor: colors.text,
                                            transform: [{ rotate: show == true ? '0deg' : '-180deg' }]
                                        }}
                                        source={IMAGES.downarrow}
                                    />
                                </View>
                            </TouchableOpacity>

                            <Collapsible collapsed={show}>
                                <View style={{ marginTop: 10, paddingLeft: 10 }}>
                                    {replies.map((data: any, index: any) => (
                                        <View style={{ flexDirection: 'row', marginBottom: 10 }} key={index}>
                                            <View>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        data.hasStory == false
                                                            ? navigation.navigate('status', {
                                                                  name: title,
                                                                  image: image,
                                                                  statusData: [IMAGES.profilepic11, IMAGES.profilepic12]
                                                              })
                                                            : navigation.navigate('AnotherProfile')
                                                    }}
                                                >
                                                    {data.hasStory == false ? (
                                                        <View>
                                                            <Image
                                                                style={{ width: 40, height: 40, borderRadius: 50 }}
                                                                source={data.image}
                                                            />
                                                            <Image
                                                                style={{
                                                                    width: 48,
                                                                    height: 48,
                                                                    position: 'absolute',
                                                                    bottom: -4,
                                                                    right: -4,
                                                                    resizeMode: 'contain'
                                                                }}
                                                                source={IMAGES.cricle}
                                                            />
                                                        </View>
                                                    ) : (
                                                        <View>
                                                            <Image
                                                                style={{ width: 40, height: 40, borderRadius: 50 }}
                                                                source={data.image}
                                                            />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                            <View style={{ marginLeft: 10, flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <TouchableOpacity onPress={() => navigation.navigate('AnotherProfile')}>
                                                        <Text style={[GlobalStyleSheet.textfont, { marginBottom: 5, color: colors.title }]}>
                                                            {data.title}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <View
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: 100,
                                                            backgroundColor: colors.placeholder,
                                                            opacity: 0.5
                                                        }}
                                                    />
                                                    <Text style={{ ...FONTS.fontSm, ...FONTS.fontMedium, color: colors.text, opacity: 0.5 }}>
                                                        {data.time}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text
                                                        style={{
                                                            ...FONTS.font,
                                                            ...FONTS.fontMedium,
                                                            color: colors.title,
                                                            marginBottom: 10
                                                        }}
                                                    >
                                                        {data.comment}
                                                    </Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                                    <TouchableOpacity>
                                                        <LikeBtn color={colors.title} sizes={'xs'} />
                                                    </TouchableOpacity>
                                                    <Text style={[GlobalStyleSheet.textfont, { fontSize: 12, color: colors.title }]}>
                                                        {data.like}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View>
                                                <TouchableOpacity onPress={() => moresheet.current.openSheet()}>
                                                    <Image
                                                        style={{
                                                            width: 15,
                                                            height: 15,
                                                            resizeMode: 'contain',
                                                            marginTop: 15
                                                        }}
                                                        source={IMAGES.more}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </Collapsible>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
            <View style={GlobalStyleSheet.container}>
                <View style={{ height: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Image
                                style={{ width: 18, height: 18, tintColor: colors.title }}
                                source={IMAGES.arrowleft}
                            />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ ...FONTS.fontMedium, fontSize: 16, color: colors.title, marginLeft: 20 }}>
                                Comments
                            </Text>
                        </View>
                    </View>
                    <View>
                        <Text style={{ ...FONTS.fontMedium, fontSize: 16, color: colors.title }}>
                            {comments.length}
                        </Text>
                    </View>
                </View>
                <View style={{ marginBottom: 10 }}>
                    <TouchableOpacity
                        style={{
                            zIndex: 1,
                            position: 'absolute',
                            top: 13,
                            left: 15
                        }}
                    >
                        <Image
                            style={{ tintColor: colors.text, width: 20, height: 20 }}
                            source={IMAGES.happy}
                        />
                    </TouchableOpacity>
                    <TextInput
                        placeholder="Send your comment..."
                        placeholderTextColor={colors.placeholder}
                        value={commentText}
                        onChangeText={setCommentText}
                        onSubmitEditing={postComment} // Post on Enter
                        style={[
                            GlobalStyleSheet.inputBox,
                            {
                                backgroundColor: colors.input,
                                paddingLeft: 50 // Space for emoji button
                            }
                        ]}
                    />
                    <TouchableOpacity
                        style={{
                            zIndex: 1,
                            position: 'absolute',
                            top: 13,
                            right: 15
                        }}
                        onPress={postComment}
                    >
                        <Image
                            style={{ tintColor: colors.primary, width: 20, height: 20 }}
                            source={IMAGES.send}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>Loading comments...</Text>
                    </View>
                ) : (
                    <FlatList
                        showsVerticalScrollIndicator={false}
                        data={comments}
                        renderItem={({ item }) => (
                            <Item
                                title={item.username || 'Unknown User'}
                                image={
                                    item.avatar
                                        ? { uri: item.avatar }
                                        : IMAGES.storypic1 // Default fallback
                                }
                                id={item._id}
                                time={item.timeAgo || 'Just now'}
                                comment={item.commentText}
                                like={item.likes || '0'}
                                commentNumber={item.replies?.length || 0}
                                replies={item.replies || []}
                                moresheet={moresheet}
                                hasStory={false} // Adjust based on API if needed
                                navigation={navigation}
                                theme={theme}
                            />
                        )}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </KeyboardAvoidingView>
            <ChatoptionSheet ref={moresheet} deleteChat={false} />
        </SafeAreaView>
    );
};

export default Comments;