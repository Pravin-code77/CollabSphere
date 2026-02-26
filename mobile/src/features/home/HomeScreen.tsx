import React, { useState, useRef } from 'react';

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    FlatList,
    Animated,
    Image,
    RefreshControl,
    StatusBar
} from 'react-native';
import {
    Bell,
    Rocket,
    Target,
    X,
    Zap,
    Users,
    ChevronRight,
    Search,
    ArrowUpRight,
    Sparkles,
    Plus,
    Activity
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../providers/AuthProvider';
import client from '../../api/client';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SwipeableNotifItem } from '../../components/SwipeableNotifItem';


const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboard, setDashboard] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    const fetchDashboard = async () => {
        try {
            const [dashRes, notifRes] = await Promise.all([
                client.get('/profiles/dashboard'),
                client.get('/notifications')
            ]);
            setDashboard(dashRes.data);
            setNotifications(notifRes.data);
            setUnreadCount(notifRes.data.filter((n: any) => !n.read).length);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 20,
                    friction: 7,
                    useNativeDriver: true
                })
            ]).start();
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchDashboard();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    const handleBellPress = async () => {
        setShowNotifs(true);
        if (unreadCount > 0) {
            try {
                await client.post('/notifications/read');
                setUnreadCount(0);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleDeleteNotif = async (id: string) => {
        try {
            await client.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Delete notification error:', error);
        }
    };

    const handleRespondRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            await client.post(`/projects/requests/${requestId}/respond`, { status });
            // Remove the notification from the list that matches the request ID
            const notifToRemove = notifications.find(n => n.data?.joinRequestId === requestId);

            setNotifications(prev => prev.filter(n => n.data?.joinRequestId !== requestId));

            // Delete the notification from backend so it doesn't return on next fetch
            if (notifToRemove) {
                await client.delete(`/notifications/${notifToRemove._id}`);
            }

            fetchDashboard();
        } catch (error) {
            console.error('Respond to request error:', error);
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Configuring Workspace...</Text>
            </View>
        );
    }

    const { activeProjects = [], pendingRequests = [], stats = {}, profile = {} } = dashboard || {};

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />

            {/* Dark Premium Header Background */}
            <View style={styles.headerBackground}>
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                    <Defs>
                        <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor="#1e1b4b" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#312e81" stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#grad)" />
                </Svg>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            >
                {/* 1. Command Center Header */}
                <View style={styles.header}>
                    <View style={styles.greetingContainer}>
                        <View style={styles.welcomeBadge}>
                            <Sparkles size={12} color="#818cf8" fill="#818cf8" />
                            <Text style={styles.welcomeText}>Online Now</Text>
                        </View>
                        <Text style={styles.greeting}>Welcome Back</Text>
                        <Text style={styles.username}>@{user?.username || 'innovator'}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.bellBtn} onPress={handleBellPress}>
                            <Bell size={22} color="#fff" />
                            {unreadCount > 0 && <View style={styles.badge} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation.navigate('ProfileTab')}>
                            <Image
                                source={{ uri: profile.avatarUrl || `https://ui-avatars.com/api/?name=${user?.username}&background=6366f1&color=fff` }}
                                style={styles.avatar as any}
                            />
                            <View style={styles.onlineDot} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 2. Stats Insight Card - Floating Effect */}
                <Animated.View style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconBox, { backgroundColor: '#e0e7ff' }]}>
                            <Activity size={20} color="#4338ca" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{stats.projectsCount || 0}</Text>
                            <Text style={styles.statLabel}>Active Builds</Text>
                        </View>
                        <ArrowUpRight size={14} color="#10b981" style={styles.trendIcon} />
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.statIconBox, { backgroundColor: '#fef3c7' }]}>
                            <Zap size={20} color="#d97706" fill="#d97706" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{stats.skillsCount || 0}</Text>
                            <Text style={styles.statLabel}>Skill Index</Text>
                        </View>
                        <ArrowUpRight size={14} color="#10b981" style={styles.trendIcon} />
                    </View>
                </Animated.View>

                {/* 3. Action Required (Pending Requests) - Glassmorphism style */}
                {pendingRequests.length > 0 && (
                    <View style={styles.actionSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionHeaderLeft}>
                                <Users size={20} color="#4338ca" />
                                <Text style={styles.sectionTitle}>Incoming Talent</Text>
                            </View>
                            <View style={styles.actionBadge}>
                                <Text style={styles.actionBadgeText}>{pendingRequests.length} Pending</Text>
                            </View>
                        </View>

                        {pendingRequests.map((req: any, idx: number) => (
                            <TouchableOpacity
                                key={req._id}
                                style={[styles.actionCard, { borderLeftColor: idx % 2 === 0 ? '#6366f1' : '#ec4899' }]}
                                onPress={() => navigation.navigate('ProjectDetail', { project: req.projectId })}
                            >
                                <View style={styles.actionInfo}>
                                    <Text style={styles.actionUser}>@{req.senderId?.username || 'Candidate'}</Text>
                                    <Text style={styles.actionMsg} numberOfLines={1}>Requests to join <Text style={styles.projectName}>{req.projectId?.title}</Text></Text>
                                </View>
                                <View style={styles.reviewBtn}>
                                    <ChevronRight size={18} color="#4338ca" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* 4. Active Projects - Horizontal Scroll with Premium Cards */}
                <View style={[styles.section, { marginTop: 10 }]}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionHeaderLeft}>
                            <Rocket size={20} color="#4338ca" />
                            <Text style={styles.sectionTitle}>Active Projects</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('ExploreProject')}>
                            <Text style={styles.viewAll}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectCarouselContent} style={styles.projectCarousel}>
                        {activeProjects.length > 0 ? activeProjects.map((p: any) => (
                            <TouchableOpacity
                                key={p._id}
                                style={styles.projectCard}
                                onPress={() => navigation.navigate('ProjectDetail', { project: p })}
                            >
                                <View style={styles.projectCardTop}>
                                    <View style={styles.projectIconBox}>
                                        <Target size={20} color="#fff" />
                                    </View>
                                    <View style={styles.activePill}>
                                        <View style={styles.activeInnerDot} />
                                        <Text style={styles.activePillText}>In Progress</Text>
                                    </View>
                                </View>

                                <Text style={styles.projectCardTitle} numberOfLines={1}>{p.title}</Text>
                                <Text style={styles.projectCardOwner}>by {p.ownerId?.username || 'you'}</Text>

                                <View style={styles.projectCardDivider} />

                                <View style={styles.projectCardFooter}>
                                    <View style={styles.teamAvatars}>
                                        <View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>T</Text></View>
                                        <View style={[styles.miniAvatar, { marginLeft: -8, backgroundColor: '#818cf8' }]}><Text style={styles.miniAvatarText}>S</Text></View>
                                        {p.members?.length > 0 && (
                                            <View style={[styles.miniAvatar, { marginLeft: -8, backgroundColor: '#f472b6' }]}>
                                                <Text style={styles.miniAvatarText}>+{p.members.length}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.timeTag}>
                                        <Activity size={10} color="#64748b" />
                                        <Text style={styles.timeText}>Just now</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )) : (
                            <TouchableOpacity style={styles.emptyProjectCard} onPress={() => navigation.navigate('ExploreProject')}>
                                <View style={styles.plusBox}>
                                    <Plus size={24} color="#6366f1" />
                                </View>
                                <Text style={styles.emptyTitle}>Launch Project</Text>
                                <Text style={styles.emptySub}>Transform your idea into reality</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                {/* 5. Recommended / Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Access</Text>
                    <View style={styles.quickGrid}>
                        <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('ExploreTeams')}>
                            <View style={[styles.quickIcon, { backgroundColor: '#eff6ff' }]}>
                                <Users size={22} color="#3b82f6" />
                            </View>
                            <Text style={styles.quickLabel}>Find Teammates</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('ExploreProject')}>
                            <View style={[styles.quickIcon, { backgroundColor: '#f0fdf4' }]}>
                                <Search size={22} color="#22c55e" />
                            </View>
                            <Text style={styles.quickLabel}>Browse Tech</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Notifications Modal */}
            <Modal visible={showNotifs} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Updates</Text>
                            <TouchableOpacity onPress={() => setShowNotifs(false)} style={styles.closeBtn}>
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <SwipeableNotifItem
                                    item={item}
                                    onPress={() => {
                                        if (item.data?.project) {
                                            setShowNotifs(false);
                                            navigation.navigate('ProjectDetail', { project: item.data.project });
                                        }
                                    }}
                                    onDelete={() => handleDeleteNotif(item._id)}
                                    onAccept={item.type === 'request' && item.data?.joinRequestId ? () => handleRespondRequest(item.data.joinRequestId, 'accepted') : undefined}
                                    onDecline={item.type === 'request' && item.data?.joinRequestId ? () => handleRespondRequest(item.data.joinRequestId, 'rejected') : undefined}
                                />
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyNotifs}>
                                    <Sparkles size={40} color="#e2e8f0" style={{ marginBottom: 16 }} />
                                    <Text style={styles.emptyNotifText}>You're all caught up!</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 250,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6366f1',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingTop: 10,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 30,
    },
    greetingContainer: {
        flex: 1,
    },
    welcomeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(129, 140, 248, 0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 8,
        gap: 6,
    },
    welcomeText: {
        color: '#a5b4fc',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    greeting: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '600',
        marginBottom: 2,
    },
    username: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bellBtn: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
        borderWidth: 2,
        borderColor: '#1e1b4b',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#fff',
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    statItem: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        elevation: 10,
        shadowColor: '#4338ca',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1e293b',
    },
    statLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    trendIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
    },

    // Action Section
    actionSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    actionBadge: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    actionBadgeText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: '900',
    },
    actionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 5,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    actionInfo: {
        flex: 1,
    },
    actionUser: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 2,
    },
    actionMsg: {
        fontSize: 12,
        color: '#64748b',
    },
    projectName: {
        fontWeight: 'bold',
        color: '#4338ca',
    },
    reviewBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Projects
    section: {
        marginBottom: 32,
    },
    viewAll: {
        fontSize: 13,
        color: '#6366f1',
        fontWeight: '800',
    },
    projectCarousel: {
        marginLeft: 0,
    },
    projectCarouselContent: {
        paddingHorizontal: 24,
        gap: 16,
    },
    projectCard: {
        width: 200,
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 20,
        elevation: 10,
        shadowColor: '#4338ca',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    projectCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    projectIconBox: {
        width: 40,
        height: 40,
        backgroundColor: '#6366f1',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    activePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    activeInnerDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#10b981',
    },
    activePillText: {
        color: '#10b981',
        fontSize: 9,
        fontWeight: '800',
    },
    projectCardTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 4,
    },
    projectCardOwner: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        marginBottom: 16,
    },
    projectCardDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 16,
    },
    projectCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    teamAvatars: {
        flexDirection: 'row',
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: '#6366f1',
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniAvatarText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    timeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '600',
    },

    emptyProjectCard: {
        width: 200,
        height: 160,
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 20,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 4,
    },
    emptySub: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        fontWeight: '500',
    },

    // Quick Actions
    quickGrid: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 16,
        marginTop: 10,
    },
    quickCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    quickIcon: {
        width: 50,
        height: 50,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    quickLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        height: '80%',
        padding: 24,
        paddingTop: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
    },
    notifItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    notifDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 16,
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
    emptyNotifs: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyNotifText: {
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '700',
    }
});

export default HomeScreen;
