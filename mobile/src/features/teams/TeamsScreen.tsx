import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import {
    Users,
    Search,
    Filter,
    Zap,
    Rocket,
    MessageSquare,
    Plus,
    ChevronRight,
    Star,
    X
} from 'lucide-react-native';
import client from '../../api/client';
import SkillTag from '../../components/SkillTag';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../providers/AuthProvider';

const TeamsScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [teams, setTeams] = useState<any[]>([]);
    const [recommended, setRecommended] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'React', 'TypeScript', 'Node.js', 'Python', 'AI/ML', 'Design'];

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchData = async () => {
        try {
            const params: any = {};
            if (debouncedSearch) params.search = debouncedSearch;
            if (activeCategory !== 'All') params.skill = activeCategory;

            const [teamsRes, recommendedRes] = await Promise.all([
                client.get('/projects', { params }),
                client.get('/projects/recommended')
            ]);
            setTeams(teamsRes.data);
            setRecommended(recommendedRes.data);
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [debouncedSearch, activeCategory]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleJoinRequest = (project: any) => {
        navigation.navigate('ProjectDetail', { project });
    };

    const renderRecommendedCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.recCard}
            onPress={() => navigation.navigate('ProjectDetail', { project: item })}
        >
            <View style={styles.recBadge}>
                <Zap size={12} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.recBadgeText}>{item.matchScore}% Match</Text>
            </View>
            <Text style={styles.recTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.recVision} numberOfLines={2}>{item.description}</Text>

            <View style={styles.recFooter}>
                <View style={styles.avatarStack}>
                    {(item.members || []).slice(0, 3).map((m: any, i: number) => (
                        <Image
                            key={i}
                            source={{ uri: `https://ui-avatars.com/api/?name=${m.username}&background=random` }}
                            style={[styles.smallAvatar, { marginLeft: i > 0 ? -10 : 0 }]}
                        />
                    ))}
                    {item.members?.length > 3 && (
                        <View style={[styles.smallAvatar, styles.moreAvatar]}>
                            <Text style={styles.moreAvatarText}>+{item.members.length - 3}</Text>
                        </View>
                    )}
                </View>
                <ChevronRight size={18} color="#94a3b8" />
            </View>
        </TouchableOpacity>
    );

    const renderTeamItem = ({ item }: { item: any }) => {
        const teamMembers = item.members || [];
        const missingRoles = item.requiredSkills || [];
        const owner = item.ownerId;
        const ownerName = owner?.username || 'Unknown';

        return (
            <TouchableOpacity
                style={styles.teamCard}
                onPress={() => navigation.navigate('ProjectDetail', { project: item })}
            >
                <View style={styles.teamCardHeader}>
                    <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{item.title}</Text>
                        <Text style={styles.teamOwner}>by @{ownerName}</Text>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: item.status === 'open' ? '#dcfce7' : '#fee2e2' }
                    ]}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: item.status === 'open' ? '#166534' : '#991b1b' }
                        ]} />
                        <Text style={[
                            styles.statusText,
                            { color: item.status === 'open' ? '#166534' : '#991b1b' }
                        ]}>
                            {item.status === 'open' ? 'Recruiting' : 'Closed'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.teamVision} numberOfLines={3}>
                    {item.description}
                </Text>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>ACTIVE TEAM</Text>
                    <Text style={styles.memberCount}>{teamMembers.length}/{item.teamSize || '∞'}</Text>
                </View>

                <View style={styles.memberAvatars}>
                    {teamMembers.length > 0 ? teamMembers.map((m: any, i: number) => (
                        <Image
                            key={i}
                            source={{ uri: `https://ui-avatars.com/api/?name=${m.username}&background=random` }}
                            style={styles.memberAvatar}
                        />
                    )) : (
                        <Text style={styles.emptyTeamText}>No members yet</Text>
                    )}
                </View>

                {missingRoles.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>LOOKING FOR</Text>
                        </View>
                        <View style={styles.rolesRow}>
                            {missingRoles.slice(0, 3).map((r: any, i: number) => (
                                <View key={i} style={styles.roleTag}>
                                    <Text style={styles.roleText}>{r.skill}</Text>
                                </View>
                            ))}
                            {missingRoles.length > 3 && (
                                <Text style={styles.moreRolesText}>+{missingRoles.length - 3} more</Text>
                            )}
                        </View>
                    </>
                )}

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => navigation.navigate('ProjectDetail', { project: item })}
                    >
                        <Text style={styles.viewBtnText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => handleJoinRequest(item)}
                    >
                        <Rocket size={16} color="white" style={{ marginRight: 6 }} />
                        <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Scouting for teams...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Explore Teams</Text>
                    <Text style={styles.subtitle}>Find your next collaborators</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by tech, name or vision..."
                        placeholderTextColor="#94a3b8"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <X size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.filterBtn}>
                    <Filter size={20} color="#64748b" />
                </TouchableOpacity>
            </View>

            <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryBtn,
                                activeCategory === cat && styles.categoryBtnActive
                            ]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                activeCategory === cat && styles.categoryTextActive
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {recommended.length > 0 && (
                    <View style={styles.recommendedSection}>
                        <View style={styles.sectionTitleRow}>
                            <Text style={styles.sectionTitle}>The Perfect Fit</Text>
                            <Zap size={18} color="#f59e0b" fill="#f59e0b" />
                        </View>
                        <FlatList
                            data={recommended}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item._id}
                            renderItem={renderRecommendedCard}
                            contentContainerStyle={styles.recommendedList}
                        />
                    </View>
                )}

                <View style={styles.mainSection}>
                    <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionTitle}>All Active Teams</Text>
                        <Text style={styles.countText}>{teams.length} found</Text>
                    </View>

                    <FlatList
                        data={teams}
                        scrollEnabled={false}
                        keyExtractor={(item) => item._id}
                        renderItem={renderTeamItem}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Users size={48} color="#cbd5e1" />
                                <Text style={styles.emptyText}>No teams found matching your search</Text>
                            </View>
                        }
                    />
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    createBtn: {
        backgroundColor: '#2563eb',
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginVertical: 16,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: {
        flex: 1,
        height: 48,
        marginLeft: 10,
        fontSize: 15,
        color: '#1e293b',
    },
    filterBtn: {
        width: 48,
        height: 48,
        backgroundColor: 'white',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    categoryContainer: {
        marginBottom: 16,
    },
    categoryContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    categoryBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    categoryBtnActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    categoryTextActive: {
        color: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#64748b',
        fontWeight: '600',
    },
    recommendedSection: {
        marginBottom: 24,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        marginRight: 8,
    },
    recommendedList: {
        paddingHorizontal: 20,
        paddingBottom: 4,
    },
    recCard: {
        width: 240,
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 16,
        marginRight: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    recBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 12,
        gap: 4,
    },
    recBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#f59e0b',
    },
    recTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: 'white',
        marginBottom: 6,
    },
    recVision: {
        fontSize: 13,
        color: '#94a3b8',
        lineHeight: 18,
        marginBottom: 20,
    },
    recFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    smallAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#1e293b',
    },
    moreAvatar: {
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -10,
    },
    moreAvatarText: {
        fontSize: 10,
        color: 'white',
        fontWeight: '700',
    },
    mainSection: {
        paddingHorizontal: 20,
    },
    countText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    teamCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    teamCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    teamInfo: {
        flex: 1,
    },
    teamName: {
        fontSize: 19,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 2,
    },
    teamOwner: {
        fontSize: 13,
        color: '#2563eb',
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    teamVision: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    memberCount: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },
    memberAvatars: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 6,
    },
    memberAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'white',
    },
    emptyTeamText: {
        fontSize: 13,
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    rolesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    roleTag: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
    },
    moreRolesText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    viewBtn: {
        flex: 1,
        height: 44,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    viewBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },
    applyBtn: {
        flex: 1.5,
        height: 44,
        backgroundColor: '#2563eb',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: 'white',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 15,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default TeamsScreen;
