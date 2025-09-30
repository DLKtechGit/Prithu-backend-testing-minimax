import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, FlatList } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import { FONTS, IMAGES } from '../../constants/theme';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DecodedToken {
    userId: string;
}

interface Selection {
    questionId: string;
    questionText: string;
    answer: string;
}

const PostoptionSheet = (props: any, ref: any) => {
    const bottomSheetRef = useRef<any>(null);
    const [currentPostId, setCurrentPostId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'options' | 'report' | 'question' | 'summary'>('options');
    const [reportTypes, setReportTypes] = useState<any[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [selections, setSelections] = useState<Selection[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const snapPoints = useMemo(() => ['50%'], []);
    // const[typeId, setTypeId] =useState<string | null>(null);

    const handleSheetChanges = useCallback((index: any) => {
        console.log('handleSheetChanges', index);
    }, []);
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    const notInterestedCallbackRef = useRef<null | ((id: string) => void)>(null);
    const hidePostCallbackRef = useRef<null | ((id: string) => void)>(null);

    const openSheet = (
        postId: string,
        onNotInterestedCallback?: (id: string) => void,
        onHidePostCallback?: (id: string) => void
    ) => {
        setCurrentPostId(postId);
        setViewMode('options');
        if (onNotInterestedCallback) {
            notInterestedCallbackRef.current = onNotInterestedCallback;
        }
        if (onHidePostCallback) {
            hidePostCallbackRef.current = onHidePostCallback;
        }
        bottomSheetRef.current.snapToIndex(0);
    };

    useImperativeHandle(ref, () => ({
        openSheet
    }));

    const handleNotInterested = async () => {
        console.log('handleNotInterested called with postId:', currentPostId);
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }
            if (!currentPostId) {
                Alert.alert('Error', 'Post ID is missing');
                return;
            }

            const res = await fetch('http://192.168.1.6:5000/api/user/not/intrested', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({ feedId: currentPostId }),
            });

            const data = await res.json();
            if (res.ok) {
                console.log('Category marked as not interested:', data.message);
                if (notInterestedCallbackRef.current) {
                    await notInterestedCallbackRef.current(currentPostId);
                }
                bottomSheetRef.current.close();
            } else {
                console.log('Error marking category as not interested:', data.message);
                Alert.alert('Error', data.message || 'Failed to mark as not interested');
            }
        } catch (error) {
            console.error('Not interested error:', error);
            Alert.alert('Error', 'Something went wrong while marking as not interested');
        }
    };

    const handleHidePost = async () => {
        console.log('handleHidePost called with postId:', currentPostId);
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            console.log("token", userToken);
            if (!userToken) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }
            if (!currentPostId) {
                Alert.alert('Error', 'Post ID is missing');
                return;
            }

            // Manually decode the JWT token to get the userId
            let userId: string;
            try {
                const base64Url = userToken.split('.')[1]; // Get the payload part of the JWT
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(atob(base64));
                userId = payload.userId; // Extract userId from the payload
                console.log('Decoded userId:', userId);
            } catch (error) {
                console.error('Error decoding token:', error);
                Alert.alert('Error', 'Failed to decode user token');
                return;
            }

            const res = await fetch('http://192.168.1.6:5000/api/user/hide/feed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({ userId, feedId: currentPostId }),
            });

            const data = await res.json();
            if (res.ok) {
                console.log('Post hidden successfully:', data.message);
                if (hidePostCallbackRef.current) {
                    await hidePostCallbackRef.current(currentPostId);
                }
                bottomSheetRef.current.close();
            } else {
                console.log('Error hiding post:', data.message);
                Alert.alert('Error', data.message || 'Failed to hide post');
            }
        } catch (error) {
            console.error('Hide post error:', error);
            Alert.alert('Error', 'Something went wrong while hiding post');
        }
    };

    const handleReport = () => {
        setViewMode('report');
        fetchReportTypes();
    };

    const fetchReportTypes = async () => {
        setLoading(true);
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            const headers: any = { 'Content-Type': 'application/json' };
            if (userToken) {
                headers.Authorization = `Bearer ${userToken}`;
            }

            const res = await fetch('http://192.168.1.6:5000/api/report-types', {
                method: 'GET',
                headers,
            });

            const data = await res.json();
            if (res.ok) {
                setReportTypes(data.data || []);
            } else {
                Alert.alert('Error', data.message || 'Failed to fetch report types');
            }
        } catch (error) {
            console.error('Fetch report types error:', error);
            Alert.alert('Error', 'Something went wrong while fetching report types');
        } finally {
            setLoading(false);
        }
    };

      const handleReportTypeSelection = async (typeId: string) => {
        console.log('handleReportTypeSelection called with typeId:', typeId);
        setSelectedTypeId(typeId);
        setSelections([]);
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }
            if (!typeId) {
                Alert.alert('Error', 'Report type ID is missing');
                return;
            }

            const res = await fetch(`http://192.168.1.6:5000/api/report-questions/start?typeId=${typeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
            });

            const data = await res.json();
            if (res.ok) {
                console.log('Start question fetched successfully:', data);
                setCurrentQuestion(data.data);
                setViewMode('question');
            } else if (data.message === 'No start question found for this type') {
                console.log('No start question found, submitting report directly');
                // Directly call the report-post API
                const reportRes = await fetch('http://192.168.1.6:5000/api/report-post', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${userToken}`,
                    },
                    body: JSON.stringify({
                        typeId: typeId,
                        targetId: currentPostId,
                        targetType: "Feed",
                    }),
                });

                const reportData = await reportRes.json();
                if (reportRes.ok) {
                    Alert.alert('Success', 'Report submitted successfully');
                    bottomSheetRef.current.close();
                } else {
                    Alert.alert('Error', reportData.message || 'Failed to submit report');
                }
            } else {
                console.log('Error fetching start question:', data.message);
                Alert.alert('Error', data.message || 'No report questions available for this type');
            }
        } catch (error) {
            console.error('Report type selection error:', error);
            Alert.alert('Error', 'Something went wrong while submitting report type');
        }
    };

    const handleOptionSelection = async (option: any) => {
        console.log('handleOptionSelection called with option:', option);

        try {
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }
            if (!currentQuestion._id || !option._id) {
                Alert.alert('Error', 'Missing question or option details');
                return;
            }

            // Ensure reportId is available (e.g., from state or context)
            // const reportId = /* get reportId from your state or context */;

            const res = await fetch('http://192.168.1.6:5000/api/report-questions/next', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({

                    reportId: selectedTypeId,
                    questionId: currentQuestion._id,
                    selectedOption: option._id// Send option._id instead of option.text
                }),
            });

            // Log raw response for debugging
            const textResponse = await res.text();
            console.log('Raw response:', textResponse);

            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (error) {
                console.error('JSON parse error:', error, 'Raw response:', textResponse);
                Alert.alert('Error', 'Invalid response from server');
                return;
            }

            if (res.ok) {
                if (data.data) {
                    console.log('Next question fetched successfully:', data);
                    setSelections(prev => [...prev, {
                        questionId: currentQuestion._id,
                        questionText: currentQuestion.questionText,
                        answer: option.text // Keep text for local state
                    }]);
                    setCurrentQuestion(data.data);
                } else {
                    console.log('Reporting flow complete');
                    setSelections(prev => [...prev, {
                        questionId: currentQuestion._id,
                        questionText: currentQuestion.questionText,
                        answer: option.text // Keep text for local state
                    }]);
                    setViewMode('summary');
                }
            } else {
                console.log('Error fetching next question:', data.message);
                Alert.alert('Error', data.message || 'No next question available');
            }
        } catch (error) {
            console.error('Option selection error:', error);
            Alert.alert('Error', 'Something went wrong while fetching next question');
        }
    };

    const handleSubmitReport = async () => {
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }
            if (!selectedTypeId || !currentPostId || selections.length === 0) {
                Alert.alert('Error', 'Missing report details');
                return;
            }

            const res = await fetch('http://192.168.1.6:5000/api/report-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                    typeId: selectedTypeId,         // which report type
                    targetId: currentPostId,        // the actual feed ID
                    targetType: "Feed",             // required by backend
                }),

            });

            const data = await res.json();
            if (res.ok) {
                Alert.alert('Success', 'Report submitted successfully');
                bottomSheetRef.current.close();
            } else {
                Alert.alert('Error', data.message || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Submit report error:', error);
            Alert.alert('Error', 'Something went wrong while submitting report');
        }
    };

    const theme = useTheme();
    const { colors } = theme;

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={GlobalStyleSheet.TouchableOpacity}
            onPress={() => handleReportTypeSelection(item._id || item.id)}
        >
            <Text style={[GlobalStyleSheet.text, { color: colors.title }]}>
                {item.name ? item.name : 'Unnamed Type'}
            </Text>
        </TouchableOpacity>
    );

    const renderOptionItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={GlobalStyleSheet.TouchableOpacity}
            onPress={() => handleOptionSelection(item)}
        >
            <Text style={[GlobalStyleSheet.text, { color: colors.title }]}>
                {item.text ? item.text : 'Unnamed Option'}
            </Text>
        </TouchableOpacity>
    );

    const renderSelectionItem = ({ item }: { item: Selection }) => (
        <View style={{ marginBottom: 10 }}>
            <Text style={[GlobalStyleSheet.text, { color: colors.title, fontWeight: 'bold' }]}>
                {item.questionText}
            </Text>
            <Text style={[GlobalStyleSheet.text, { color: colors.text }]}>
                {item.answer}
            </Text>
        </View>
    );

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            enablePanDownToClose={true}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            backdropComponent={renderBackdrop}
            handleStyle={{ top: 0 }}
            handleIndicatorStyle={{ backgroundColor: colors.border, width: 92 }}
            backgroundStyle={{ backgroundColor: colors.card }}
        >
            <BottomSheetView style={GlobalStyleSheet.container}>
                {viewMode === 'options' ? (
                    <>
                        <TouchableOpacity
                            style={GlobalStyleSheet.TouchableOpacity}
                            onPress={handleReport}
                        >
                            <Image
                                style={GlobalStyleSheet.image}
                                source={IMAGES.info}
                            />
                            <Text style={GlobalStyleSheet.text}>Report</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={GlobalStyleSheet.TouchableOpacity}
                            onPress={handleNotInterested}
                        >
                            <Image
                                style={[GlobalStyleSheet.image, { tintColor: colors.title }]}
                                source={IMAGES.eyeclose}
                            />
                            <Text style={[GlobalStyleSheet.text, { color: colors.title }]}>
                                Not Interested
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={GlobalStyleSheet.TouchableOpacity}>
                            <Image
                                style={[GlobalStyleSheet.image, { tintColor: colors.title }]}
                                source={IMAGES.copylink}
                            />
                            <Text style={[GlobalStyleSheet.text, { color: colors.title }]}>Copy link</Text>
                        </TouchableOpacity>
                        {props.hidePost === false ? null : (
                            <TouchableOpacity
                                style={GlobalStyleSheet.TouchableOpacity}
                                onPress={handleHidePost}
                            >
                                <Image
                                    style={[GlobalStyleSheet.image, { tintColor: colors.title }]}
                                    source={IMAGES.close}
                                />
                                <Text style={[GlobalStyleSheet.text, { color: colors.title }]}>Hide post</Text>
                            </TouchableOpacity>
                        )}
                    </>
                ) : viewMode === 'report' ? (
                    <>
                        <Text style={[GlobalStyleSheet.text, { color: colors.title, fontWeight: 'bold', fontSize: 18, marginBottom: 26 }]}>
                            Select Report Reason
                        </Text>
                        {loading ? (
                            <Text style={[GlobalStyleSheet.text, { color: colors.text }]}>Loading...</Text>
                        ) : reportTypes.length > 0 ? (
                            <FlatList
                                data={reportTypes}
                                renderItem={renderItem}
                                keyExtractor={(item) => item._id?.toString() || item.id?.toString() || Math.random().toString()}
                            />
                        ) : (
                            <Text style={[GlobalStyleSheet.text, { color: colors.text }]}>No report types available</Text>
                        )}
                    </>
                ) : viewMode === 'question' ? (
                    <>
                        <Text style={[GlobalStyleSheet.text, { color: colors.title, fontWeight: 'bold', fontSize: 18, marginBottom: 26 }]}>
                            {currentQuestion?.questionText || 'Question'}
                        </Text>
                        {loading ? (
                            <Text style={[GlobalStyleSheet.text, { color: colors.text }]}>Loading...</Text>
                        ) : currentQuestion?.options?.length > 0 ? (
                            <FlatList
                                data={currentQuestion.options}
                                renderItem={renderOptionItem}
                                keyExtractor={(item) => item._id?.toString() || item.nextQuestion?.toString() || Math.random().toString()}
                            />
                        ) : (
                            <Text style={[GlobalStyleSheet.text, { color: colors.text }]}>No options available</Text>
                        )}
                    </>
                ) : (
                    <>
                        <Text style={[GlobalStyleSheet.text, { color: colors.title, fontWeight: 'bold', fontSize: 18, marginBottom: 26 }]}>
                            Report Summary
                        </Text>
                        {selections.length > 0 ? (
                            <FlatList
                                data={selections}
                                renderItem={renderSelectionItem}
                                keyExtractor={(item, index) => index.toString()}
                            />
                        ) : (
                            <Text style={[GlobalStyleSheet.text, { color: colors.text }]}>No selections made</Text>
                        )}
                        <TouchableOpacity
                            style={[GlobalStyleSheet.TouchableOpacity, { marginTop: 20 }]}
                            onPress={handleSubmitReport}
                        >
                            <Text style={[GlobalStyleSheet.text, { color: colors.primary }]}>Submit Report</Text>
                        </TouchableOpacity>
                    </>
                )}
            </BottomSheetView>
        </BottomSheet>
    );
};

export default forwardRef(PostoptionSheet);



// import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
// import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
// import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
// import { GlobalStyleSheet } from '../../constants/styleSheet';
// import { FONTS, IMAGES } from '../../constants/theme';
// import { useTheme } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// interface DecodedToken {
//   userId: string;
// }

// const PostoptionSheet = (props: any, ref: any) => {
//     const bottomSheetRef = useRef<any>(null);
//     const [currentPostId, setCurrentPostId] = useState<string | null>(null);
//     const snapPoints = useMemo(() => ['50%'], []);
//     const handleSheetChanges = useCallback((index: any) => {
//         console.log('handleSheetChanges', index);
//     }, []);
//     const renderBackdrop = useCallback(
//         (props: any) => (
//             <BottomSheetBackdrop
//                 {...props}
//                 disappearsOnIndex={-1}
//                 appearsOnIndex={0}
//             />
//         ),
//         []
//     );

//     const notInterestedCallbackRef = useRef<null | ((id: string) => void)>(null);
//     const hidePostCallbackRef = useRef<null | ((id: string) => void)>(null);

//     const openSheet = (
//         postId: string,
//         onNotInterestedCallback?: (id: string) => void,
//         onHidePostCallback?: (id: string) => void
//     ) => {
//         setCurrentPostId(postId);
//         if (onNotInterestedCallback) {
//             notInterestedCallbackRef.current = onNotInterestedCallback;
//         }
//         if (onHidePostCallback) {
//             hidePostCallbackRef.current = onHidePostCallback;
//         }
//         bottomSheetRef.current.snapToIndex(0);
//     };

//     useImperativeHandle(ref, () => ({
//         openSheet
//     }));

//     const handleNotInterested = async () => {
//         console.log('handleNotInterested called with postId:', currentPostId);
//         try {
//             const userToken = await AsyncStorage.getItem('userToken');
//             if (!userToken) {
//                 Alert.alert('Error', 'User not authenticated');
//                 return;
//             }
//             if (!currentPostId) {
//                 Alert.alert('Error', 'Post ID is missing');
//                 return;
//             }

//             const res = await fetch('http://192.168.1.6:5000/api/user/not/intrested', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${userToken}`,
//                 },
//                 body: JSON.stringify({ feedId: currentPostId }),
//             });

//             const data = await res.json();
//             if (res.ok) {
//                 console.log('Category marked as not interested:', data.message);
//                 if (notInterestedCallbackRef.current) {
//                     await notInterestedCallbackRef.current(currentPostId);
//                 }
//                 bottomSheetRef.current.close();
//             } else {
//                 console.log('Error marking category as not interested:', data.message);
//                 Alert.alert('Error', data.message || 'Failed to mark as not interested');
//             }
//         } catch (error) {
//             console.error('Not interested error:', error);
//             Alert.alert('Error', 'Something went wrong while marking as not interested');
//         }
//     };

//     const handleHidePost = async () => {
//         console.log('handleHidePost called with postId:', currentPostId);
//         try {
//             const userToken = await AsyncStorage.getItem('userToken');
//             console.log("token", userToken);
//             if (!userToken) {
//                 Alert.alert('Error', 'User not authenticated');
//                 return;
//             }
//             if (!currentPostId) {
//                 Alert.alert('Error', 'Post ID is missing');
//                 return;
//             }

//             // Manually decode the JWT token to get the userId
//             let userId: string;
//             try {
//                 const base64Url = userToken.split('.')[1]; // Get the payload part of the JWT
//                 const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//                 const payload = JSON.parse(atob(base64));
//                 userId = payload.userId; // Extract userId from the payload
//                 console.log('Decoded userId:', userId);
//             } catch (error) {
//                 console.error('Error decoding token:', error);
//                 Alert.alert('Error', 'Failed to decode user token');
//                 return;
//             }

//             const res = await fetch('http://192.168.1.6:5000/api/user/hide/feed', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${userToken}`,
//                 },
//                 body: JSON.stringify({ userId, feedId: currentPostId }),
//             });

//             const data = await res.json();
//             if (res.ok) {
//                 console.log('Post hidden successfully:', data.message);
//                 if (hidePostCallbackRef.current) {
//                     await hidePostCallbackRef.current(currentPostId);
//                 }
//                 bottomSheetRef.current.close();
//             } else {
//                 console.log('Error hiding post:', data.message);
//                 Alert.alert('Error', data.message || 'Failed to hide post');
//             }
//         } catch (error) {
//             console.error('Hide post error:', error);
//             Alert.alert('Error', 'Something went wrong while hiding post');
//         }
//     };

//     const theme = useTheme();
//     const { colors } = theme;

//     return (
//         <BottomSheet
//             ref={bottomSheetRef}
//             index={-1}
//             enablePanDownToClose={true}
//             snapPoints={snapPoints}
//             onChange={handleSheetChanges}
//             backdropComponent={renderBackdrop}
//             handleStyle={{ top: 0 }}
//             handleIndicatorStyle={{ backgroundColor: colors.border, width: 92 }}
//             backgroundStyle={{ backgroundColor: colors.card }}
//         >
//             <BottomSheetView style={GlobalStyleSheet.container}>
//                 <TouchableOpacity style={GlobalStyleSheet.TouchableOpacity}>
//                     <Image
//                         style={GlobalStyleSheet.image}
//                         source={IMAGES.info}
//                     />
//                     <Text style={GlobalStyleSheet.text}>Report</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                     style={GlobalStyleSheet.TouchableOpacity}
//                     onPress={handleNotInterested}
//                 >
//                     <Image
//                         style={[GlobalStyleSheet.image, { tintColor: colors.title }]}
//                         source={IMAGES.eyeclose}
//                     />
//                     <Text style={[GlobalStyleSheet.text, { color: colors.title }]}>
//                         Not Interested
//                     </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={GlobalStyleSheet.TouchableOpacity}>
//                     <Image
//                         style={[GlobalStyleSheet.image, { tintColor: colors.title }]}
//                         source={IMAGES.copylink}
//                     />
//                     <Text style={[GlobalStyleSheet.text, { color: colors.title }]}>Copy link</Text>
//                 </TouchableOpacity>
//                 {props.hidePost === false ? null : (
//                     <TouchableOpacity
//                         style={GlobalStyleSheet.TouchableOpacity}
//                         onPress={handleHidePost}
//                     >
//                         <Image
//                             style={[GlobalStyleSheet.image, { tintColor: colors.title }]}
//                             source={IMAGES.close}
//                         />
//                         <Text style={[GlobalStyleSheet.text, { color: colors.title }]}>Hide post</Text>
//                     </TouchableOpacity>
//                 )}
//             </BottomSheetView>
//         </BottomSheet>
//     );
// };

// export default forwardRef(PostoptionSheet);