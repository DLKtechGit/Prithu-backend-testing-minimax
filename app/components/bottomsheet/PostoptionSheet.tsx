import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, FlatList } from 'react-native';
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
    const [showPopup, setShowPopup] = useState(false); // State for popup visibility
    const [popupMessage, setPopupMessage] = useState(''); // Popup title
    const [popupSubtitle, setPopupSubtitle] = useState(''); // Popup subtitle
    const fadeAnim = useState(new Animated.Value(0))[0]; // Animation value for fade
    const snapPoints = useMemo(() => ['50%'], []);

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

    const handleNotInterested = async () => {
        console.log('handleNotInterested called with postId:', currentPostId);
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                setPopupMessage('Error!');
                setPopupSubtitle('User not authenticated');
                setShowPopup(true);
                return;
            }
            if (!currentPostId) {
                setPopupMessage('Error!');
                setPopupSubtitle('Post ID is missing');
                setShowPopup(true);
                return;
            }

            const res = await fetch('http://192.168.1.42:5000/api/user/not/intrested', {
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
                setPopupMessage('Success');
                setPopupSubtitle('Category marked as not interested');
                setShowPopup(true);
                if (notInterestedCallbackRef.current) {
                    await notInterestedCallbackRef.current(currentPostId);
                }
            } else {
                console.log('Error marking category as not interested:', data.message);
                setPopupMessage('Error!');
                setPopupSubtitle(data.message || 'Failed to mark as not interested');
                setShowPopup(true);
            }
        } catch (error) {
            console.error('Not interested error:', error);
            setPopupMessage('Error!');
            setPopupSubtitle('Something went wrong while marking as not interested');
            setShowPopup(true);
        }
    };

    const handleHidePost = async () => {
        console.log('handleHidePost called with postId:', currentPostId);
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            console.log("token", userToken);
            if (!userToken) {
                setPopupMessage('Error!');
                setPopupSubtitle('User not authenticated');
                setShowPopup(true);
                return;
            }
            if (!currentPostId) {
                setPopupMessage('Error!');
                setPopupSubtitle('Post ID is missing');
                setShowPopup(true);
                return;
            }

            let userId: string;
            try {
                const base64Url = userToken.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(atob(base64));
                userId = payload.userId;
                console.log('Decoded userId:', userId);
            } catch (error) {
                console.error('Error decoding token:', error);
                setPopupMessage('Error!');
                setPopupSubtitle('Failed to decode user token');
                setShowPopup(true);
                return;
            }

            const res = await fetch('http://192.168.1.42:5000/api/user/hide/feed', {
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
                setPopupMessage('Success');
                setPopupSubtitle('Post hidden successfully');
                setShowPopup(true);
                if (hidePostCallbackRef.current) {
                    await hidePostCallbackRef.current(currentPostId);
                }
            } else {
                console.log('Error hiding post:', data.message);
                setPopupMessage('Error!');
                setPopupSubtitle(data.message || 'Failed to hide post');
                setShowPopup(true);
            }
        } catch (error) {
            console.error('Hide post error:', error);
            setPopupMessage('Error!');
            setPopupSubtitle('Something went wrong while hiding post');
            setShowPopup(true);
        }
    };

    const fetchReportTypes = async () => {
        setLoading(true);
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            const headers: any = { 'Content-Type': 'application/json' };
            if (userToken) {
                headers.Authorization = `Bearer ${userToken}`;
            }

            const res = await fetch('http://192.168.1.42:5000/api/report-types', {
                method: 'GET',
                headers,
            });

            const data = await res.json();
            if (res.ok) {
                setReportTypes(data.data || []);
            } else {
                setPopupMessage('Error!');
                setPopupSubtitle(data.message || 'Failed to fetch report types');
                setShowPopup(true);
            }
        } catch (error) {
            console.error('Fetch report types error:', error);
            setPopupMessage('Error!');
            setPopupSubtitle('Something went wrong while fetching report types');
            setShowPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const handleReport = () => {
        setViewMode('report');
        fetchReportTypes();
    };

   const handleReportTypeSelection = async (typeId: string) => {
    console.log('handleReportTypeSelection called with typeId:', typeId);
    setSelectedTypeId(typeId);
    setSelections([]); // Reset selections for a new report
    console.log('Selections reset to:', []); // Log reset
    try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
            setPopupMessage('Error!');
            setPopupSubtitle('User not authenticated');
            setShowPopup(true);
            return;
        }
        if (!typeId) {
            setPopupMessage('Error!');
            setPopupSubtitle('Report type ID is missing');
            setShowPopup(true);
            return;
        }

        const res = await fetch(`http://192.168.1.42:5000/api/report-questions/start?typeId=${typeId}`, {
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
            const reportRes = await fetch('http://192.168.1.42:5000/api/report-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                    typeId: typeId,
                    targetId: currentPostId,
                    targetType: "Feed",
                    answers: [], // Explicitly send empty answers for no-question reports
                }),
            });

            const reportData = await reportRes.json();
            if (reportRes.ok) {
                setPopupMessage('Success');
                setPopupSubtitle('Report submitted successfully');
                setShowPopup(true);
            } else {
                setPopupMessage('Error!');
                setPopupSubtitle(reportData.message || 'Failed to submit report');
                setShowPopup(true);
            }
        } else {
            console.log('Error fetching start question:', data.message);
            setPopupMessage('Error!');
            setPopupSubtitle(data.message || 'No report questions available for this type');
            setShowPopup(true);
        }
    } catch (error) {
        console.error('Report type selection error:', error);
        setPopupMessage('Error!');
        setPopupSubtitle('Something went wrong while submitting report type');
        setShowPopup(true);
    }
};

const handleOptionSelection = async (option: any) => {
    console.log('handleOptionSelection called with option:', option);
    try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
            setPopupMessage('Error!');
            setPopupSubtitle('User not authenticated');
            setShowPopup(true);
            return;
        }
        if (!currentQuestion._id || !option._id) {
            setPopupMessage('Error!');
            setPopupSubtitle('Missing question or option details');
            setShowPopup(true);
            return;
        }

        const res = await fetch('http://192.168.1.42:5000/api/report-questions/next', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                reportId: selectedTypeId,
                questionId: currentQuestion._id,
                selectedOption: option._id
            }),
        });

        const textResponse = await res.text();
        console.log('Raw response:', textResponse);

        let data;
        try {
            data = JSON.parse(textResponse);
        } catch (error) {
            console.error('JSON parse error:', error, 'Raw response:', textResponse);
            setPopupMessage('Error!');
            setPopupSubtitle('Invalid response from server');
            setShowPopup(true);
            return;
        }

        if (res.ok) {
            if (data.data) {
                console.log('Next question fetched successfully:', data);
                setSelections(prev => {
                    const newSelections = [...prev, {
                        questionId: currentQuestion._id,
                        questionText: currentQuestion.questionText,
                        answer: option.text
                    }];
                    console.log('Updated selections:', newSelections); // Log updated selections
                    return newSelections;
                });
                setCurrentQuestion(data.data);
            } else {
                console.log('Reporting flow complete');
                setSelections(prev => {
                    const newSelections = [...prev, {
                        questionId: currentQuestion._id,
                        questionText: currentQuestion.questionText,
                        answer: option.text
                    }];
                    console.log('Final selections before summary:', newSelections); // Log final selections
                    return newSelections;
                });
                setViewMode('summary');
            }
        } else {
            console.log('Error fetching next question:', data.message);
            setPopupMessage('Error!');
            setPopupSubtitle(data.message || 'No next question available');
            setShowPopup(true);
        }
    } catch (error) {
        console.error('Option selection error:', error);
        setPopupMessage('Error!');
        setPopupSubtitle('Something went wrong while fetching next question');
        setShowPopup(true);
    }
};

const handleSubmitReport = async () => {
    console.log('handleSubmitReport called with selections:', selections); // Log selections before submission
    try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
            setPopupMessage('Error!');
            setPopupSubtitle('User not authenticated');
            setShowPopup(true);
            return;
        }
        if (!selectedTypeId || !currentPostId) {
            setPopupMessage('Error!');
            setPopupSubtitle('Missing report details');
            setShowPopup(true);
            return;
        }

        const res = await fetch('http://192.168.1.42:5000/api/report-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                typeId: selectedTypeId,
                targetId: currentPostId,
                targetType: "Feed",
                answers: selections, // Send selections as answers
            }),
        });
        console.log("select",selections)
        const data = await res.json();
        if (res.ok) {
            setPopupMessage('Success');
            setPopupSubtitle('Report submitted successfully');
            setShowPopup(true);
        } else {
            setPopupMessage('Error!');
            setPopupSubtitle(data.message || 'Failed to submit report');
            setShowPopup(true);
        }
    } catch (error) {
        console.error('Submit report error:', error);
        setPopupMessage('Error!');
        setPopupSubtitle('Something went wrong while submitting report');
        setShowPopup(true);
    }
};

    const theme = useTheme();
    const { colors } = theme;

    // Custom Popup Component
    const Popup = () => (
        <Animated.View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: fadeAnim,
        }}>
            <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                width: '90%',
                elevation: 10,
            }}>
                <Image
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        marginBottom: 15,
                    }}
                    source={IMAGES.bugrepellent}
                />
                <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#333',
                    textAlign: 'center',
                }}>{popupMessage}</Text>
                <Text style={{
                    fontSize: 14,
                    color: '#666',
                    textAlign: 'center',
                    marginVertical: 10,
                }}>{popupSubtitle}</Text>
                <TouchableOpacity
                    style={{
                        backgroundColor: '#28A745',
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                        marginTop: 15,
                    }}
                    onPress={() => {
                        setShowPopup(false);
                        if (popupMessage === 'Success') {
                            bottomSheetRef.current.close();
                        }
                    }}
                >
                    <Text style={{
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}>Let's Go</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

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
        <>
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
            {showPopup && <Popup />}
        </>
    );
};

export default forwardRef(PostoptionSheet);