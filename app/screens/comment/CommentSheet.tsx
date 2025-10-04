import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import { FONTS, IMAGES } from '../../constants/theme';
import * as Haptics from 'expo-haptics'; // Add for Instagram-like feedback

const CommentSheet = (props: any, ref: any) => {
  const bottomSheetRef = useRef<any>(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [feedId, setFeedId] = useState<string | null>(null);

  console.log(feedId);
  console.log(comments);

  // ✅ Enhanced snapPoints: Dynamic sizing for flexible height (Instagram-like)
  const snapPoints = useMemo(() => ['50%', '90%'], []); // Start at 50% for partial view, expand to 90%

  const theme = useTheme();
  const { colors } = theme;

  // Fetch comments from backend
  const fetchComments = async (id?: string) => {
    if (!feedId && !id) return;
    const currentFeedId = id || feedId;
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      const response = await axios.post(
        `http://192.168.1.17:5000/api/get/comments/for/feed`,
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
    }
  };

  const handleSheetChanges = useCallback((index: any) => {
    if (index === 0) fetchComments(); // Fetch on open
  }, [feedId]);

  // ✅ Enhanced backdrop: Fade in smoothly
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5} // Semi-transparent like Instagram
      />
    ),
    []
  );

  // Expose openSheet with smooth snap
  useImperativeHandle(ref, () => ({
    openSheet: (id: string) => {
      setFeedId(id);
      bottomSheetRef.current?.snapToIndex(0); // Smooth open to first snap point
      fetchComments(id);
    },
  }));

  // Post comment with haptic
  const postComment = async () => {
    if (!commentText.trim()) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Tactile post feedback
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await axios.post(
        'http://192.168.1.17:5000/api/user/feed/comment',
        { feedId, commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add new comment optimistically
      setComments([response.data.comment, ...comments]);
      setCommentText('');
    } catch (error) {
      console.error('Error posting comment:', error.response?.data);
      // Optional: Revert haptic or show toast
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={{ flexDirection: 'row', paddingVertical: 10, alignItems: 'flex-start' }}>
      <Image
        source={item.avatar ? { uri: item.avatar } : IMAGES.userPlaceholder}
        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        {/* Username + Time inline */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={[
              GlobalStyleSheet.text,
              { fontWeight: 'bold', color: colors.text, marginRight: 6 },
            ]}
          >
            {item.username || 'Unknown User'}
          </Text>
          <Text style={{ color: colors.text + '99', fontSize: 12 }}>
            {item.timeAgo}
          </Text>
        </View>

        {/* Comment text */}
        <Text style={[GlobalStyleSheet.text, { color: colors.text, marginTop: 2 }]}>
          {item.commentText}
        </Text>
      </View>
    </View>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing // ✅ Dynamic height adjustment for content (smooth expansion)
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      // ✅ Smooth handle: Rounded, subtle shadow for Instagram feel
      handleIndicatorStyle={{
        backgroundColor: colors.border,
        width: 40,
        height: 4,
        borderRadius: 2,
      }}
      backgroundStyle={{
        backgroundColor: colors.card,
        borderTopLeftRadius: 20, // Softer curve
        borderTopRightRadius: 20,
        shadowColor: '#000', // Subtle shadow
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5, // Android shadow
      }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingBottom: 70, // Space for input
              paddingHorizontal: 16,
            }}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false} // Prevent nesting issues
          />
        )}

        {/* Input bar: Fixed bottom, smooth keyboard handling */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Tuned for tabs
        >
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              flexDirection: 'row',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              backgroundColor: colors.card,
            }}
          >
            <TextInput
              placeholder="Add a comment..."
              placeholderTextColor={colors.text + '80'}
              value={commentText}
              onChangeText={setCommentText}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: colors.background,
                borderRadius: 25,
                color: colors.text,
                fontSize: 14,
              }}
              returnKeyType="send"
              onSubmitEditing={postComment} // Post on Enter
            />
            <TouchableOpacity style={{ marginLeft: 10 }} onPress={postComment}>
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 14 }}>
                Post
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default forwardRef(CommentSheet);