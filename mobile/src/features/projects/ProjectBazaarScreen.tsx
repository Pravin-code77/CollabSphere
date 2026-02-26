import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    ScrollView
} from 'react-native';
import client from '../../api/client';
import SkillTag from '../../components/SkillTag';

const ProjectBazaarScreen = ({ navigation }: any) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedUrgency, setSelectedUrgency] = useState('All');

    const categories = ['All', 'React', 'TypeScript', 'Python', 'AI/ML', 'Design', 'Node.js', 'Rust', 'Go'];
    const urgencies = ['All', 'High', 'Medium', 'Low'];

    useEffect(() => {
        fetchProjects();
    }, [search, selectedCategory, selectedUrgency]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            if (selectedCategory !== 'All') params.skill = selectedCategory;
            if (selectedUrgency !== 'All') params.urgency = selectedUrgency.toLowerCase();

            const response = await client.get('/projects', { params });
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects;

    const renderProject = ({ item }: any) => {
        const membersNeeded = Math.max(0, item.teamSize - (item.members?.length || 0));
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ProjectDetail', { project: item })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.projectTitle}>{item.title}</Text>
                    <View style={[
                        styles.urgencyBadge,
                        item.urgency === 'high' ? styles.urgencyHigh : styles.urgencyMedium
                    ]}>
                        <Text style={styles.urgencyText}>{item.urgency}</Text>
                    </View>
                </View>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

                <View style={styles.skillsList}>
                    {item.requiredSkills.map((req: any, idx: number) => (
                        <SkillTag key={idx} name={req.skill} />
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>👥 {membersNeeded} members needed</Text>
                    <Text style={styles.footerText}>👤 {item.ownerId?.username}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.header} stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Project Bazaar</Text>
                    <Text style={styles.headerSubtitle}>Find the perfect project that matches your skills and interests.</Text>
                </View>

                <View style={styles.filtersWrapper}>
                    <View style={styles.searchContainer}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={styles.searchBar}
                            placeholder="Search projects, skills, or descriptions..."
                            placeholderTextColor="#94a3b8"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.urgencyRow}>
                        <Text style={styles.urgencyLabel}>URGENCY:</Text>
                        {urgencies.map(urg => (
                            <TouchableOpacity
                                key={urg}
                                style={[styles.urgencyFilterBtn, selectedUrgency === urg && styles.urgencyFilterBtnActive]}
                                onPress={() => setSelectedUrgency(urg)}
                            >
                                <Text style={[styles.urgencyFilterText, selectedUrgency === urg && styles.urgencyFilterTextActive]}>{urg}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <FlatList
                    data={filteredProjects}
                    keyExtractor={(item: any) => item._id}
                    renderItem={renderProject}
                    contentContainerStyle={styles.list}
                    scrollEnabled={false} // Nested in ScrollView
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyText}>No projects found. Be the first to create one!</Text>
                        </View>
                    }
                />
                <View style={{ height: 100 }} />
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateProject')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    header: {
        flex: 1,
    },
    headerContent: {
        padding: 24,
        paddingBottom: 16,
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748b',
        lineHeight: 24,
    },
    filtersWrapper: {
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    searchBar: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1e293b',
    },
    categoryScroll: {
        marginBottom: 16,
    },
    categoryContent: {
        paddingHorizontal: 16,
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
    urgencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
    },
    urgencyLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 0.5,
    },
    urgencyFilterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    urgencyFilterBtnActive: {
        backgroundColor: '#f1f5f9',
    },
    urgencyFilterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    urgencyFilterTextActive: {
        color: '#0f172a',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    projectTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
    },
    urgencyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 8,
    },
    urgencyHigh: { backgroundColor: '#fee2e2' },
    urgencyMedium: { backgroundColor: '#fef9c3' },
    urgencyText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    description: {
        fontSize: 15,
        color: '#64748b',
        marginVertical: 14,
        lineHeight: 22,
    },
    skillsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16,
    },
    footerText: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabText: {
        color: 'white',
        fontSize: 36,
        fontWeight: '300',
    },
    emptyText: {
        textAlign: 'center',
        color: '#64748b',
        fontSize: 15,
    }
});

export default ProjectBazaarScreen;
