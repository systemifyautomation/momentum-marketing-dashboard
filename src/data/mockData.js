// Mock Klaviyo-style campaign data for Momentum Marketing dashboard

export const clients = [
  { id: "all", name: "All Clients", industry: null, color: "#8B5CF6" },
  { id: "clt_1", name: "Bright Skin Co.", industry: "Beauty & Skincare", color: "#EC4899" },
  { id: "clt_2", name: "Peak Performance Gear", industry: "Sports & Fitness", color: "#F59E0B" },
  { id: "clt_3", name: "Urban Eats Market", industry: "Food & Beverage", color: "#10B981" },
  { id: "clt_4", name: "LuxHome Interiors", industry: "Home & Decor", color: "#3B82F6" },
  { id: "clt_5", name: "TechNest Solutions", industry: "B2B Technology", color: "#6366F1" },
  { id: "clt_6", name: "Bloom & Petal Boutique", industry: "Floral & Gifts", color: "#F43F5E" },
];

export const campaigns = [
  // Bright Skin Co.
  {
    id: "c001", clientId: "clt_1", name: "Summer Glow Sale 🌞", type: "Promotional",
    subject: "Your summer skin routine starts here ✨",
    sentDate: "2026-05-22", sentTime: "10:00 AM",
    recipients: 14_820, delivered: 14_692, opens: 5_803, clicks: 1_247,
    revenue: 18_940, unsubscribes: 38, status: "Sent",
    openRate: 39.5, clickRate: 8.49, conversionRate: 4.12,
  },
  {
    id: "c002", clientId: "clt_1", name: "New SPF Collection Launch", type: "Product Launch",
    subject: "Meet your new SPF hero 🧴",
    sentDate: "2026-05-15", sentTime: "9:30 AM",
    recipients: 14_650, delivered: 14_521, opens: 6_234, clicks: 1_589,
    revenue: 24_320, unsubscribes: 29, status: "Sent",
    openRate: 42.9, clickRate: 10.94, conversionRate: 5.81,
  },
  {
    id: "c003", clientId: "clt_1", name: "Win-Back: Lapsed Customers", type: "Win-Back",
    subject: "We miss you — here's 20% off 💛",
    sentDate: "2026-05-08", sentTime: "2:00 PM",
    recipients: 3_240, delivered: 3_198, opens: 954, clicks: 287,
    revenue: 5_610, unsubscribes: 62, status: "Sent",
    openRate: 29.8, clickRate: 8.97, conversionRate: 3.44,
  },
  {
    id: "c004", clientId: "clt_1", name: "June Loyalty Rewards", type: "Newsletter",
    subject: "Your exclusive rewards are waiting 🎁",
    sentDate: "2026-06-01", sentTime: "10:00 AM",
    recipients: 15_100, delivered: 0, opens: 0, clicks: 0,
    revenue: 0, unsubscribes: 0, status: "Scheduled",
    openRate: 0, clickRate: 0, conversionRate: 0,
  },

  // Peak Performance Gear
  {
    id: "c005", clientId: "clt_2", name: "Memorial Day Flash Sale ⚡", type: "Promotional",
    subject: "48-hour sale: Up to 40% off gear",
    sentDate: "2026-05-23", sentTime: "7:00 AM",
    recipients: 22_410, delivered: 22_180, opens: 9_874, clicks: 2_943,
    revenue: 61_750, unsubscribes: 54, status: "Sent",
    openRate: 44.5, clickRate: 13.27, conversionRate: 6.83,
  },
  {
    id: "c006", clientId: "clt_2", name: "New Arrivals: Summer Collection", type: "Product Launch",
    subject: "Just dropped: lightweight running gear 🏃",
    sentDate: "2026-05-18", sentTime: "8:00 AM",
    recipients: 21_980, delivered: 21_760, opens: 8_120, clicks: 2_108,
    revenue: 38_200, unsubscribes: 41, status: "Sent",
    openRate: 37.3, clickRate: 9.69, conversionRate: 4.55,
  },
  {
    id: "c007", clientId: "clt_2", name: "Weekly Training Tips", type: "Newsletter",
    subject: "This week's pro training plan 💪",
    sentDate: "2026-05-12", sentTime: "6:30 AM",
    recipients: 21_500, delivered: 21_290, opens: 7_234, clicks: 1_102,
    revenue: 9_480, unsubscribes: 22, status: "Sent",
    openRate: 33.9, clickRate: 5.17, conversionRate: 1.82,
  },
  {
    id: "c008", clientId: "clt_2", name: "Father's Day Gift Guide", type: "Promotional",
    subject: "Perfect gifts for the dad who trains 🎽",
    sentDate: "2026-06-05", sentTime: "9:00 AM",
    recipients: 22_800, delivered: 0, opens: 0, clicks: 0,
    revenue: 0, unsubscribes: 0, status: "Draft",
    openRate: 0, clickRate: 0, conversionRate: 0,
  },

  // Urban Eats Market
  {
    id: "c009", clientId: "clt_3", name: "Weekly Fresh Picks 🥬", type: "Newsletter",
    subject: "This week's freshest arrivals",
    sentDate: "2026-05-24", sentTime: "8:00 AM",
    recipients: 9_870, delivered: 9_788, opens: 3_912, clicks: 924,
    revenue: 14_220, unsubscribes: 18, status: "Sent",
    openRate: 39.9, clickRate: 9.44, conversionRate: 3.67,
  },
  {
    id: "c010", clientId: "clt_3", name: "Local Farmer Spotlight", type: "Content",
    subject: "Meet the farmers behind your food 🌾",
    sentDate: "2026-05-17", sentTime: "9:00 AM",
    recipients: 9_650, delivered: 9_572, opens: 4_487, clicks: 1_342,
    revenue: 8_940, unsubscribes: 11, status: "Sent",
    openRate: 46.8, clickRate: 14.02, conversionRate: 2.91,
  },
  {
    id: "c011", clientId: "clt_3", name: "Bundle & Save Promo", type: "Promotional",
    subject: "Build your perfect pantry bundle 🧺",
    sentDate: "2026-05-10", sentTime: "10:30 AM",
    recipients: 9_450, delivered: 9_368, opens: 2_810, clicks: 763,
    revenue: 19_680, unsubscribes: 27, status: "Sent",
    openRate: 30.0, clickRate: 8.14, conversionRate: 5.22,
  },

  // LuxHome Interiors
  {
    id: "c012", clientId: "clt_4", name: "Spring Refresh Lookbook 🌸", type: "Content",
    subject: "Transform your space this spring",
    sentDate: "2026-05-21", sentTime: "11:00 AM",
    recipients: 7_340, delivered: 7_268, opens: 3_267, clicks: 891,
    revenue: 31_540, unsubscribes: 14, status: "Sent",
    openRate: 44.9, clickRate: 12.26, conversionRate: 8.14,
  },
  {
    id: "c013", clientId: "clt_4", name: "Clearance Event", type: "Promotional",
    subject: "Final markdowns — up to 60% off 🏷️",
    sentDate: "2026-05-14", sentTime: "8:00 AM",
    recipients: 7_180, delivered: 7_106, opens: 2_420, clicks: 612,
    revenue: 22_100, unsubscribes: 31, status: "Sent",
    openRate: 34.0, clickRate: 8.61, conversionRate: 5.98,
  },
  {
    id: "c014", clientId: "clt_4", name: "VIP Preview: New Collection", type: "Product Launch",
    subject: "You're invited: first look at our new arrivals 🛋️",
    sentDate: "2026-06-02", sentTime: "10:00 AM",
    recipients: 1_820, delivered: 0, opens: 0, clicks: 0,
    revenue: 0, unsubscribes: 0, status: "Scheduled",
    openRate: 0, clickRate: 0, conversionRate: 0,
  },

  // TechNest Solutions
  {
    id: "c015", clientId: "clt_5", name: "Q2 Product Update 🚀", type: "Newsletter",
    subject: "What's new in TechNest Q2 2026",
    sentDate: "2026-05-20", sentTime: "9:00 AM",
    recipients: 5_620, delivered: 5_564, opens: 2_782, clicks: 723,
    revenue: 47_800, unsubscribes: 8, status: "Sent",
    openRate: 49.9, clickRate: 12.99, conversionRate: 11.24,
  },
  {
    id: "c016", clientId: "clt_5", name: "Webinar Invitation: AI Automation", type: "Event",
    subject: "Join our live webinar — seats filling fast 🎙️",
    sentDate: "2026-05-13", sentTime: "10:00 AM",
    recipients: 5_480, delivered: 5_425, opens: 3_092, clicks: 1_108,
    revenue: 0, unsubscribes: 5, status: "Sent",
    openRate: 57.0, clickRate: 20.42, conversionRate: 0,
  },
  {
    id: "c017", clientId: "clt_5", name: "Enterprise Upsell Campaign", type: "Promotional",
    subject: "Upgrade to Enterprise — limited offer",
    sentDate: "2026-05-06", sentTime: "2:00 PM",
    recipients: 890, delivered: 882, opens: 441, clicks: 178,
    revenue: 124_000, unsubscribes: 3, status: "Sent",
    openRate: 50.0, clickRate: 20.18, conversionRate: 14.27,
  },

  // Bloom & Petal Boutique
  {
    id: "c018", clientId: "clt_6", name: "Mother's Day Collection 💐", type: "Promotional",
    subject: "Celebrate mom with beautiful blooms",
    sentDate: "2026-05-09", sentTime: "8:00 AM",
    recipients: 11_250, delivered: 11_138, opens: 5_569, clicks: 1_780,
    revenue: 28_640, unsubscribes: 24, status: "Sent",
    openRate: 50.0, clickRate: 15.98, conversionRate: 7.92,
  },
  {
    id: "c019", clientId: "clt_6", name: "Subscription Box Announcement", type: "Product Launch",
    subject: "Introducing our monthly flower box 🌺",
    sentDate: "2026-05-16", sentTime: "10:00 AM",
    recipients: 11_420, delivered: 11_306, opens: 5_200, clicks: 1_624,
    revenue: 19_480, unsubscribes: 19, status: "Sent",
    openRate: 46.0, clickRate: 14.36, conversionRate: 5.74,
  },
  {
    id: "c020", clientId: "clt_6", name: "June Wedding Season Guide", type: "Content",
    subject: "Everything you need for wedding flowers 💍",
    sentDate: "2026-06-03", sentTime: "9:00 AM",
    recipients: 11_600, delivered: 0, opens: 0, clicks: 0,
    revenue: 0, unsubscribes: 0, status: "Scheduled",
    openRate: 0, clickRate: 0, conversionRate: 0,
  },
];

// Monthly performance trend data (last 6 months)
export const monthlyTrends = [
  { month: "Dec '25", campaigns: 14, totalSent: 68_400, avgOpenRate: 32.1, avgClickRate: 7.4, revenue: 142_000 },
  { month: "Jan '26", campaigns: 16, totalSent: 74_200, avgOpenRate: 33.8, avgClickRate: 7.9, revenue: 158_400 },
  { month: "Feb '26", campaigns: 15, totalSent: 71_800, avgOpenRate: 36.2, avgClickRate: 8.6, revenue: 167_200 },
  { month: "Mar '26", campaigns: 18, totalSent: 82_100, avgOpenRate: 37.9, avgClickRate: 9.1, revenue: 189_600 },
  { month: "Apr '26", campaigns: 19, totalSent: 87_400, avgOpenRate: 39.4, avgClickRate: 9.8, revenue: 214_800 },
  { month: "May '26", campaigns: 20, totalSent: 94_680, avgOpenRate: 41.2, avgClickRate: 10.6, revenue: 248_300 },
];

// Client performance comparison (used for bar chart)
export const clientComparison = [
  { client: "Bright Skin", openRate: 37.4, clickRate: 9.47, revenue: 48870, campaigns: 3 },
  { client: "Peak Perf.", openRate: 38.6, clickRate: 9.38, revenue: 109430, campaigns: 3 },
  { client: "Urban Eats", openRate: 38.9, clickRate: 10.53, revenue: 42840, campaigns: 3 },
  { client: "LuxHome", openRate: 39.5, clickRate: 10.44, revenue: 53640, campaigns: 2 },
  { client: "TechNest", openRate: 52.3, clickRate: 17.86, revenue: 171800, campaigns: 3 },
  { client: "Bloom & Petal", openRate: 48.0, clickRate: 15.17, revenue: 48120, campaigns: 2 },
];

// Recent activity feed
export const recentActivity = [
  { id: "a1", type: "sent", client: "Bright Skin Co.", campaign: "Summer Glow Sale 🌞", time: "2 hours ago", metric: "14,692 delivered" },
  { id: "a2", type: "milestone", client: "TechNest Solutions", campaign: "Enterprise Upsell Campaign", time: "4 hours ago", metric: "$124,000 revenue" },
  { id: "a3", type: "sent", client: "Urban Eats Market", campaign: "Weekly Fresh Picks 🥬", time: "Yesterday", metric: "3,912 opens" },
  { id: "a4", type: "scheduled", client: "Bright Skin Co.", campaign: "June Loyalty Rewards", time: "Scheduled for Jun 1", metric: "15,100 recipients" },
  { id: "a5", type: "sent", client: "Peak Performance Gear", campaign: "Memorial Day Flash Sale ⚡", time: "Yesterday", metric: "$61,750 revenue" },
  { id: "a6", type: "milestone", client: "Bloom & Petal Boutique", campaign: "Mother's Day Collection 💐", time: "2 days ago", metric: "50% open rate!" },
  { id: "a7", type: "scheduled", client: "LuxHome Interiors", campaign: "VIP Preview: New Collection", time: "Scheduled for Jun 2", metric: "1,820 recipients" },
  { id: "a8", type: "draft", client: "Peak Performance Gear", campaign: "Father's Day Gift Guide", time: "Draft saved", metric: "Ready to review" },
];
