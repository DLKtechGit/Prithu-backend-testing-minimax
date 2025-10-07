import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Keyboard } from 'react-native';
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
    const { colors } = theme;
    const navigation = useNavigation();
    const route = useRoute();
    const moresheet = useRef(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [feedId, setFeedId] = useState(null);
    const [accountType, setAccountType] = useState(null);
    const [activeAccountType, setActiveAccountType] = useState(null);
    const [likeColor, SetlikeColor] = useState([]);

    useEffect(() => {
        const fetchAccountType = async () => {
            try {
                const storedType = await AsyncStorage.getItem('activeAccountType');
                console.log(storedType);
                if (storedType) setActiveAccountType(storedType);
            } catch (err) {
                console.log('Error fetching account type:', err);
            }
        };
        fetchAccountType();
    }, []);

    useEffect(() => {
        if (route.params?.feedId) {
            setFeedId(route.params.feedId);
            fetchComments(route.params.feedId);
        }
    }, [route.params?.feedId]);

    useEffect(() => {
        const initialize = async () => {
            const token = await AsyncStorage.getItem('userToken');
            const storedAccountType = await AsyncStorage.getItem('accountType');
            const userId = await AsyncStorage.getItem('userId');
            console.log('Initial state:', { token, storedAccountType, userId });
            if (token && storedAccountType) {
                setAccountType(storedAccountType);
            } else if (token) {
                setAccountType('Personal');
                console.warn('No account type found in AsyncStorage, defaulting to "user"');
            } else {
                Alert.alert('Error', 'User not authenticated');
            }
        };
        initialize();
    }, []);

    const fetchComments = async (id) => {
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
                `http://192.168.1.7:5000/api/get/comments/for/feed`,
                { feedId: currentFeedId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Fetched comments:', response.data);
            const commentsWithReplies = response.data.comments.map(comment => ({
                ...comment,
                commentId: comment.commentId || comment._id,
                isLiked: comment.isLiked || false,
                likeCount: comment.likeCount || 0,
                replies: [],
            }));
            setComments(commentsWithReplies || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching comments:', error.response?.data || error.message);
            setLoading(false);
            Alert.alert('Error', 'Failed to load comments');
        }
    };

    const fetchReplies = async (commentId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'User not authenticated');
                return [];
            }

            const response = await axios.post(
                `http://192.168.1.7:5000/api/get/comments/relpy/for/feed`,
                { parentCommentId: commentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`Fetched replies for comment ${commentId}:`, response.data);

            return response.data.replies.map(reply => ({
                replyId: reply.replyId,
                title: reply.username || 'Unknown User',
                comment: reply.replyText,
                image: reply.avatar ? { uri: reply.avatar } : IMAGES.storypic1,
                time: reply.timeAgo || 'Just now',
                like: reply.likeCount || 0,
                hasStory: false,
            }));
        } catch (error) {
            // console.error(`Error fetching replies for comment ${commentId}:`, error.response?.data || error.message);
            Alert.alert('Error', 'Failed to load replies');
            return [];
        }
    };

    const postComment = async () => {
        if (!commentText.trim() || !feedId) return;

        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }

            const response = await axios.post(
                'http://192.168.1.7:5000/api/user/feed/comment',
                { feedId, commentText },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComments([{ ...response.data.comment, replies: [], isLiked: false, likeCount: 0 }, ...comments]);
            setCommentText('');
            Keyboard.dismiss();
        } catch (error) {
            console.error('Error posting comment:', error.response?.data);
            Alert.alert('Error', 'Failed to post comment');
        }
    };

    const postReply = useCallback(async (commentId, replyText) => {
        if (!replyText.trim() || !feedId || !commentId) {
            Alert.alert('Error', 'Please enter a reply');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }

            console.log('Posting reply:', { feedId, commentText: replyText, parentCommentId: commentId });

            await axios.post(
                'http://192.168.1.7:5000/api/user/feed/reply/comment',
                { feedId, commentText: replyText, parentCommentId: commentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedReplies = await fetchReplies(commentId);
            setComments(prevComments =>
                prevComments.map(comment =>
                    comment.commentId === commentId
                        ? { ...comment, replies: updatedReplies, replyCount: updatedReplies.length }
                        : comment
                )
            );
            Keyboard.dismiss();
        } catch (error) {
            console.error('Error posting reply:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to post reply');
        }
    }, [feedId]);

    const handleLike = useCallback(async (commentId) => {
        // console.log('handleLike called with:', { commentId });
        try {
            const token = await AsyncStorage.getItem('userToken');
            // const userId = await AsyncStorage.getItem('userId');
            console.log('handleLike inputs:', { commentId, token, accountType });
            if (!token) {
                // console.warn('Authentication check failed:', { token, userId });
                Alert.alert('Error', 'User not authenticated');
                return null;
            }

            const endpoint = accountType?.toLowerCase() === 'Creator' ? '/creator/comment/like' : '/user/comment/like';
            // console.log('Calling endpoint:', endpoint);
            const res = await axios.post(
                `http://192.168.1.7:5000/api${endpoint}`,
                { commentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Like response:', res.data);
            if (res.status === 200 || res.status === 201) {
                return res.data; // Returns { message, liked, likeCount }
            }
            // console.warn('Unexpected response status:', res.status);
            return null;
        } catch (error) {
            // console.error('Error toggling like:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to toggle like');
            return null;
        }
    }, [accountType]);

    const updateLike = useCallback((commentId, newIsLiked, newLikeCount) => {
        // console.log('Updating like:', { commentId, newIsLiked, newLikeCount });
        setComments(prev =>
            prev.map(comment =>
                comment.commentId === commentId
                    ? { ...comment, isLiked: newIsLiked, likeCount: newLikeCount }
                    : comment
            )
        );
    }, []);

    const onToggleLike = useCallback((commentId, currentIsLiked, currentLikeCount) => {
        // console.log('onToggleLike called:', { commentId, currentIsLiked, currentLikeCount });
        const newIsLiked = !currentIsLiked;
        const newLikeCount = newIsLiked ? currentLikeCount + 1 : Math.max(0, currentLikeCount - 1);

        // Optimistic update
        updateLike(commentId, newIsLiked, newLikeCount);

        // Backend call
        handleLike(commentId).then(result => {
            if (!result) {
                // console.warn('Reverting like due to failure:', { commentId, currentIsLiked, currentLikeCount });
                updateLike(commentId, currentIsLiked, currentLikeCount);
            } else {
                // console.log('Syncing with backend:', result);
                updateLike(commentId, result.liked, result.likeCount);
            }
        });
    }, [handleLike, updateLike]);

    const Item = useCallback(
        ({ title, image, time, comment, like, commentNumber, replies, moresheet, hasStory, navigation, theme, id, isLiked }) => {
            const [show, setShow] = useState(true);
            const [replying, setReplying] = useState(false);
            const [replyText, setReplyText] = useState('');
            const replyInputRef = useRef(null);
            const { colors } = theme;

            const handleToggleReplies = async () => {
                if (show && (!replies || replies.length === 0) && commentNumber > 0) {
                    const fetchedReplies = await fetchReplies(id);
                    setComments(prevComments =>
                        prevComments.map(comment =>
                            comment.commentId === id
                                ? { ...comment, replies: fetchedReplies, replyCount: fetchedReplies.length }
                                : comment
                        )
                    );
                }
                setShow(!show);
            };

            const handleReplyPress = async () => {
                if (!replies || replies.length === 0) {
                    const fetchedReplies = await fetchReplies(id);
                    setComments(prevComments =>
                        prevComments.map(comment =>
                            comment.commentId === id
                                ? { ...comment, replies: fetchedReplies, replyCount: fetchedReplies.length }
                                : comment
                        )
                    );
                }
                setReplying(true);
                setTimeout(() => replyInputRef.current?.focus(), 100);
            };

            const handlePostReply = () => {
                postReply(id, replyText);
                setReplying(false);
                setReplyText('');
            };

            const handleCancelReply = () => {
                setReplying(false);
                setReplyText('');
                Keyboard.dismiss();
            };

            return (
                <View style={[GlobalStyleSheet.container, { marginTop: 0, paddingTop: 0 }]}>
                    <View style={{ marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ marginTop: 10 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        hasStory === false
                                            ? navigation.navigate('status', {
                                                name: title,
                                                image: image,
                                                statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
                                            })
                                            : navigation.navigate('AnotherProfile');
                                    }}
                                >
                                    {hasStory === false ? (
                                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                            <Image style={{ width: 42, height: 42, borderRadius: 50 }} source={image} />
                                            <Image
                                                style={{ width: 50, height: 50, position: 'absolute', resizeMode: 'contain' }}
                                                source={IMAGES.cricle}
                                            />
                                        </View>
                                    ) : (
                                        <View>
                                            <Image style={{ width: 42, height: 42, borderRadius: 50 }} source={image} />
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
                                            opacity: 0.5,
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
                                        <LikeBtn
                                            liked={isLiked} // Changed from active to liked
                                            color={isLiked ? COLORS.red : colors.title}
                                            sizes={'xm'}
                                            onPress={() => onToggleLike(id, isLiked, like)}
                                            style={{ padding: 5 }}
                                        />
                                    </TouchableOpacity>
                                    <Text style={[GlobalStyleSheet.textfont, { color: colors.title }]}>{like}</Text>
                                    {commentNumber > 0 && (
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
                                    <TouchableOpacity onPress={handleReplyPress}>
                                        <Text style={[GlobalStyleSheet.textfont, { color: colors.title, opacity: 0.4 }]}>Reply</Text>
                                    </TouchableOpacity>
                                </View>
                                {replying && (
                                    <View style={{ marginTop: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                            <TextInput
                                                ref={replyInputRef}
                                                placeholder={`Reply to ${title}...`}
                                                placeholderTextColor={colors.placeholder}
                                                value={replyText}
                                                onChangeText={setReplyText}
                                                onSubmitEditing={handlePostReply}
                                                style={[GlobalStyleSheet.inputBox, { backgroundColor: colors.input, paddingLeft: 15, width: '70%' }]}
                                                autoFocus={true}
                                                returnKeyType="send"
                                            />
                                            <TouchableOpacity style={{ marginLeft: 10 }} onPress={handlePostReply}>
                                                <Image style={{ tintColor: colors.primary, width: 20, height: 20, marginLeft: 10, }} source={IMAGES.send} />
                                            </TouchableOpacity>

                                            {/* <TouchableOpacity style={{ marginLeft: 10 }} onPress={handleCancelReply}> */}
                                                {/* <Text style={{ color: colors.text, opacity: 0.8, ...FONTS.fontMedium }}>Clear</Text> */}
                                                {/* <Image
                                                    source={IMAGES.close} // Replace with your close icon from IMAGES constants
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        tintColor: colors.text,
                                                        opacity: 0.6,
                                                        marginLeft: 10,
                                                    }}
                                                />
                                            </TouchableOpacity> */}

                                        </View>
                                        <View style={{ marginTop: 10, paddingLeft: 10 }}>
                                            {replies && replies.length > 0 ? (
                                                replies.map((data, index) => (
                                                    <View style={{ flexDirection: 'row', marginBottom: 10 }} key={index}>
                                                        <View>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    data.hasStory === false
                                                                        ? navigation.navigate('status', {
                                                                            name: data.title,
                                                                            image: data.image,
                                                                            statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
                                                                        })
                                                                        : navigation.navigate('AnotherProfile');
                                                                }}
                                                            >
                                                                {data.hasStory === false ? (
                                                                    <View>
                                                                        <Image style={{ width: 40, height: 40, borderRadius: 50 }} source={data.image} />
                                                                        <Image
                                                                            style={{
                                                                                width: 48,
                                                                                height: 48,
                                                                                position: 'absolute',
                                                                                bottom: -4,
                                                                                right: -4,
                                                                                resizeMode: 'contain',
                                                                            }}
                                                                            source={IMAGES.cricle}
                                                                        />
                                                                    </View>
                                                                ) : (
                                                                    <View>
                                                                        <Image style={{ width: 40, height: 40, borderRadius: 50 }} source={data.image} />
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
                                                                        opacity: 0.5,
                                                                    }}
                                                                />
                                                                <Text style={{ ...FONTS.fontSm, ...FONTS.fontMedium, color: colors.text, opacity: 0.5 }}>
                                                                    {data.time}
                                                                </Text>
                                                            </View>
                                                            <View>
                                                                <Text
                                                                    style={{ ...FONTS.font, ...FONTS.fontMedium, color: colors.title, marginBottom: 10 }}
                                                                >
                                                                    {data.comment}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        {/* <View>
                                                            <TouchableOpacity onPress={() => moresheet.current.openSheet()}>
                                                                <Image
                                                                    style={{ width: 15, height: 15, resizeMode: 'contain', marginTop: 15 }}
                                                                    source={IMAGES.more}
                                                                />
                                                            </TouchableOpacity>
                                                        </View> */}
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={{ ...FONTS.font, color: colors.text, opacity: 0.5 }}>No replies yet</Text>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>
                            <View>
                                <TouchableOpacity onPress={() => moresheet.current.openSheet()}>
                                    <Image
                                        style={{ width: 15, height: 15, resizeMode: 'contain', marginTop: 15, tintColor: colors.title }}
                                        source={IMAGES.more}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        {commentNumber > 0 && !replying && (
                            <View style={{ marginLeft: 46 }}>
                                <TouchableOpacity onPress={handleToggleReplies}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <Text style={[GlobalStyleSheet.textfont, { color: colors.text }]}>
                                            {show ? 'See Reply' : 'Hide Reply'}
                                        </Text>
                                        <Image
                                            style={{ width: 15, height: 15, tintColor: colors.text, transform: [{ rotate: show ? '0deg' : '180deg' }] }}
                                            source={IMAGES.downarrow}
                                        />
                                    </View>
                                </TouchableOpacity>
                                <Collapsible collapsed={show}>
                                    <View style={{ marginTop: 10, paddingLeft: 10 }}>
                                        {replies && replies.length > 0 ? (
                                            replies.map((data, index) => (
                                                <View style={{ flexDirection: 'row', marginBottom: 10 }} key={index}>
                                                    <View>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                data.hasStory === false
                                                                    ? navigation.navigate('status', {
                                                                        name: 'Jorge',
                                                                        image: data.image,
                                                                        statusData: [IMAGES.profilepic11, IMAGES.profilepic12],
                                                                    })
                                                                    : navigation.navigate('AnotherProfile');
                                                            }}
                                                        >
                                                            {data.hasStory === false ? (
                                                                <View>
                                                                    <Image style={{ width: 40, height: 40, borderRadius: 50 }} source={data.image} />
                                                                    <Image
                                                                        style={{
                                                                            width: 48,
                                                                            height: 48,
                                                                            position: 'absolute',
                                                                            bottom: -4,
                                                                            right: -4,
                                                                            resizeMode: 'contain',
                                                                        }}
                                                                        source={IMAGES.cricle}
                                                                    />
                                                                </View>
                                                            ) : (
                                                                <View>
                                                                    <Image style={{ width: 40, height: 40, borderRadius: 50 }} source={data.image} />
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
                                                                    opacity: 0.5,
                                                                }}
                                                            />
                                                            <Text style={{ ...FONTS.fontSm, ...FONTS.fontMedium, color: colors.text, opacity: 0.5 }}>
                                                                {data.time}
                                                            </Text>
                                                        </View>
                                                        <View>
                                                            <Text
                                                                style={{ ...FONTS.font, ...FONTS.fontMedium, color: colors.title, marginBottom: 10 }}
                                                            >
                                                                {data.comment}
                                                            </Text>
                                                        </View>

                                                        {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                                            <TouchableOpacity>
                                                                <LikeBtn color={colors.title} sizes={'xs'} />
                                                            </TouchableOpacity>
                                                            <Text style={[GlobalStyleSheet.textfont, { fontSize: 12, color: colors.title }]}>
                                                                {data.like}
                                                            </Text>
                                                        </View> */}

                                                    </View>
                                                    <View>
                                                        <TouchableOpacity onPress={() => moresheet.current.openSheet()}>
                                                            <Image
                                                                style={{ width: 15, height: 15, resizeMode: 'contain', marginTop: 15 }}
                                                                source={IMAGES.more}
                                                            />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={{ ...FONTS.font, color: colors.text, opacity: 0.5 }}>No replies yet</Text>
                                        )}
                                    </View>
                                </Collapsible>
                            </View>
                        )}
                    </View>
                </View>
            );
        },
        [colors, postReply, onToggleLike]
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
            <View style={GlobalStyleSheet.container}>
                <View style={{ height: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Image style={{ width: 18, height: 18, tintColor: colors.title }} source={IMAGES.arrowleft} />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ ...FONTS.fontMedium, fontSize: 16, color: colors.title, marginLeft: 20 }}>
                                Comments
                            </Text>
                        </View>
                    </View>
                    <View>
                        <Text style={{ ...FONTS.fontMedium, fontSize: 16, color: colors.title }}>{comments.length}</Text>
                    </View>
                </View>
                <View style={{ marginBottom: 10 }}>
                    <TouchableOpacity style={{ zIndex: 1, position: 'absolute', top: 13, left: 15 }}>
                        <Image style={{ tintColor: colors.text, width: 20, height: 20 }} source={IMAGES.happy} />
                    </TouchableOpacity>
                    <TextInput
                        placeholder="Send your comment..."
                        placeholderTextColor={colors.placeholder}
                        value={commentText}
                        onChangeText={setCommentText}
                        onSubmitEditing={postComment}
                        style={[GlobalStyleSheet.inputBox, { backgroundColor: colors.input, paddingLeft: 50, width: '100%' }]}
                        returnKeyType="send"
                    />
                    <TouchableOpacity style={{ zIndex: 1, position: 'absolute', top: 13, right: 15 }} onPress={postComment}>
                        <Image style={{ tintColor: colors.primary, width: 20, height: 20 }} source={IMAGES.send} />
                    </TouchableOpacity>
                </View>
            </View>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
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
                                image={item.avatar ? { uri: item.avatar } : IMAGES.storypic1}
                                id={item.commentId}
                                time={item.timeAgo || 'Just now'}
                                comment={item.commentText}
                                like={item.likeCount || 0}
                                isLiked={item.isLiked || false}
                                commentNumber={item.replyCount || 0}
                                replies={item.replies || []}
                                moresheet={moresheet}
                                hasStory={false}
                                navigation={navigation}
                                theme={theme}
                            />
                        )}
                        keyExtractor={(item) => item.commentId}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </KeyboardAvoidingView>
            <ChatoptionSheet ref={moresheet} deleteChat={false} />
        </SafeAreaView>
    );
};

export default Comments;

