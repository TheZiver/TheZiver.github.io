
// ─── Community Groups (gist #9fdd3f8c495098ffa0beceece373d382) ───
interface CommunityGroup {
    icon_url: string;
    tags: string[];
    group_name?: string;
    owner?: string;
    member_count: number;
    description?: string;
    links?: string[];
    vrchat_link?: string;
}

interface CommunityGroupsResponse {
    community_groups: CommunityGroup[];
}

// ─── Daily VRChat (main gist) ───
interface DailyInfo {
    extra_info: string;
    description: string;
    warning: string;
}

interface FishCommunitiesInfo {
    verified_info: string;
    certified_info: string;
    known_info: string;
}

interface DailyVRChatData {
    daily_vrchat: {
        daily_vrchat_info: DailyInfo;
        host: string;
        time: string;
        started_at: string;
    };
    fish_communities: FishCommunitiesInfo;
    rose_fish: {
        rose_fish_info: string;
        vote_info: string;
        avatar_guidelines: string;
        members?: string;
    };
    daily_special_days?: Array<{
        date: string;
        type: string;
        name: string;
        description: string;
        colour?: string;
        link?: string;
    }>;
    wheel_spin_day?: string;
    wheel_spin_hour?: number;
    wheel_spin_minute?: number;
    winners?: Array<{
        name: string;
        spun_at: string;
        gif_url: string;
        won: string;
    }>;
}

// ─── News Feed ───
interface NewsFeedMedia {
    type: 'image' | 'video';
    url: string;
}

interface NewsFeedItem {
    author: string;
    author_avatar?: string;
    date: string;
    html_content: string;
    media?: NewsFeedMedia[];
    url?: string;
}

interface NewsFeedData {
    items: NewsFeedItem[];
}

// ─── Fish Status ───
type FishStatus = 'FISH_VERIFIED' | 'FISH_CERTIFIED' | 'FISH' | 'SYSTEM' | 'FISH_KNOWN';

// ─── Animation state (exposed on window) ───
interface FishAnimationAPI {
    readonly isAnimating: boolean;
    readonly fishCount: number;
    stop(): void;
}

// ─── Spin config for wheel countdown ───
interface WheelSpinConfig {
    day: number;
    hour: number;
    minute: number;
}

// ─── Augment window global ───
interface Window {
    __fishAnimation: FishAnimationAPI;
    timerElementsChecked: boolean;
    timerElementsMissing: boolean | string[];
    wheelSpinConfig?: WheelSpinConfig;
}
