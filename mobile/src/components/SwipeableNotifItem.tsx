import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions
} from 'react-native';
import { Trash2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;

interface Props {
    item: any;
    onPress: () => void;
    onDelete: () => void;
    onAccept?: () => void;
    onDecline?: () => void;
}

export const SwipeableNotifItem: React.FC<Props> = ({ item, onPress, onDelete, onAccept, onDecline }) => {
    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < SWIPE_THRESHOLD) {
                    Animated.timing(pan, {
                        toValue: { x: -width, y: 0 },
                        duration: 200,
                        useNativeDriver: false,
                    }).start(() => {
                        onDelete();
                    });
                } else {
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        friction: 5,
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    // Is this a request notification?
    const isRequest = item.type === 'request';

    return (
        <View style={styles.container}>
            {/* Background Action - Delete */}
            <View style={styles.backgroundAction}>
                <Trash2 color="#fff" size={24} />
            </View>

            {/* Foreground Swipeable Item */}
            <Animated.View
                style={[
                    styles.foregroundItem,
                    {
                        transform: [{
                            translateX: pan.x.interpolate({
                                inputRange: [-width, 0, width],
                                outputRange: [-width, 0, 0], // restrict swiping to the left
                                extrapolate: 'clamp'
                            })
                        }]
                    }
                ]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.9}>
                    <View style={[styles.notifDot, !item.read && { backgroundColor: '#6366f1' }]} />
                    <View style={styles.notifInfo}>
                        <Text style={styles.notifTitle}>{item.title}</Text>
                        <Text style={styles.notifMsg}>{item.message}</Text>

                        {isRequest && item.data?.joinRequestId && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.btn, styles.acceptBtn]}
                                    onPress={(e) => { e.stopPropagation(); onAccept?.(); }}
                                >
                                    <Text style={styles.acceptText}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btn, styles.declineBtn]}
                                    onPress={(e) => { e.stopPropagation(); onDecline?.(); }}
                                >
                                    <Text style={styles.declineText}>Decline</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    <View style={styles.notifTimeBox}>
                        <Text style={styles.notifTime}>Just now</Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 0,
        backgroundColor: '#ef4444',
    },
    backgroundAction: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    foregroundItem: {
        backgroundColor: '#fff',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    notifDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 16,
        marginTop: 6,
        backgroundColor: '#e2e8f0', // default dot color for read items
    },
    notifInfo: {
        flex: 1,
    },
    notifTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
    },
    notifMsg: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
        lineHeight: 18,
    },
    notifTimeBox: {
        marginLeft: 16,
    },
    notifTime: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 12,
    },
    btn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    acceptBtn: {
        backgroundColor: '#10b981',
    },
    acceptText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    declineBtn: {
        backgroundColor: '#fee2e2',
    },
    declineText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 13,
    },
});
