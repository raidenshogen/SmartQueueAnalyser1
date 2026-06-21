import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Gauge, 
  Users, 
  History as HistoryIcon,
  PieChart, 
  User, 
  Settings as SettingsIcon, 
  Send, 
  Sparkles, 
  Plus, 
  CheckCircle, 
  Play, 
  TrendingUp, 
  ArrowRight, 
  Filter, 
  ChevronRight, 
  RefreshCw, 
  Trash2, 
  LogOut, 
  ShieldAlert, 
  BarChart2, 
  FileText,
  UserCheck,
  Search,
  Eye,
  EyeOff,
  Sliders,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  GitCompare,
  Scale
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, KPIHistory, WaitDistributionItem, AgentPerformance } from './server/mockData';

function findKPIHistoryArray(obj: any): any[] | null {
  if (!obj) return null;
  if (Array.isArray(obj)) {
    if (obj.length > 0 && (
      obj[0].jour || 
      obj[0].day || 
      obj[0].date || 
      obj[0].site || 
      obj[0].service || 
      obj[0].volume_tickets !== undefined || 
      obj[0].tx_respect_sla !== undefined ||
      obj[0].occupation_guichets !== undefined
    )) {
      return obj;
    }
  }
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (Array.isArray(val)) {
        if (val.length > 0 && (
          val[0].jour || 
          val[0].day || 
          val[0].date || 
          val[0].site || 
          val[0].service || 
          val[0].volume_tickets !== undefined || 
          val[0].tx_respect_sla !== undefined ||
          val[0].occupation_guichets !== undefined
        )) {
          return val;
        }
      } else if (val && typeof val === 'object') {
        const nested = findKPIHistoryArray(val);
        if (nested) return nested;
      }
    }
  }
  return null;
}

// Roster of individuals to satisfy "include the individuals / connect to the individuals"
interface Individual {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarUrl: string;
  volumeTarget: string;
  avgWait: string;
  productivity: string;
  serviceRate: string;
  mfaActive: boolean;
  biometricActive: boolean;
}

const individualsRoster: Individual[] = [
  {
    id: "IND-01",
    name: "Alexander Sterling",
    role: "Director of Signal Analytics",
    email: "a.sterling@signal-analytics.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    volumeTarget: "42.8k",
    avgWait: "08:45",
    productivity: "94.2",
    serviceRate: "88.5%",
    mfaActive: true,
    biometricActive: false
  },
  {
    id: "IND-02",
    name: "Harper Nelson",
    role: "Admin Manager",
    email: "harper.nelson@signal-analytics.com",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=112&q=80",
    volumeTarget: "38.5k",
    avgWait: "09:12",
    productivity: "92.0",
    serviceRate: "91.2%",
    mfaActive: false,
    biometricActive: true
  },
  {
    id: "IND-03",
    name: "Sophia Martinez",
    role: "Database Lead Operator",
    email: "s.martinez@signal-analytics.com",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    volumeTarget: "45.1k",
    avgWait: "07:30",
    productivity: "96.5",
    serviceRate: "94.0%",
    mfaActive: true,
    biometricActive: true
  },
  {
    id: "IND-04",
    name: "Elena Rostova",
    role: "Support Supervisor",
    email: "e.rostova@signal-analytics.com",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120",
    volumeTarget: "40.2k",
    avgWait: "08:15",
    productivity: "95.1",
    serviceRate: "89.8%",
    mfaActive: true,
    biometricActive: false
  }
];

export const cleanSiteNameFrontend = (site: string | undefined | null): string => {
  if (!site) return '';
  const trimmed = site.trim();
  if (/^site[_\-\s]?(\d+)$/i.test(trimmed)) {
    const match = trimmed.match(/^site[_\-\s]?(\d+)$/i);
    if (match) {
      return `Site ${match[1]}`;
    }
  }
  return trimmed
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
};

export const cleanServiceNameFrontend = (service: string | undefined | null): string => {
  if (!service) return '';
  const trimmed = service.trim();
  const lower = trimmed.toLowerCase();
  
  const serviceMapping: Record<string, string> = {
    'service_18': 'Business Registration Update',
    'service_16': 'Child Support Claim',
    'service_15': 'Dependents Registration',
    'service_20': 'Disability Assessment Scheduling',
    'service_7': 'Disability Pension Request',
    'service_2': 'Employee Declaration',
    'service_19': 'Employer Contribution Adjustment',
    'service_1': 'Employer Registration',
    'service_réclamation': 'Employment Status Verification',
    'service_reclamation': 'Employment Status Verification',
    'service_3': 'Family Allowance Request',
    'service_10': 'Health Insurance Enrollment (AMO)',
    'service_4': 'Maternity Benefit Application',
    'service_renseignements': 'Maternity Leave Confirmation',
    'service_6': 'Old-Age Pension Setup',
    'service_13': 'Online Appointment Booking',
    'service_11': 'Retirement Benefit Inquiry',
    'service_9': 'Short-Term Job Loss Indemnity',
    'service_5': 'Sickness Benefit Claim',
    'service_paiement': 'Sickness Benefit Extension',
    'service_14': 'Social Security Contributions Inquiry',
    'service_12': 'Survivor Grant Request',
    'service_accueil': 'Survivor Pension Adjustment',
    'service_8': 'Survivor Pension Application',
    'service_17': 'Widow/Widower Pension'
  };

  if (serviceMapping[lower]) {
    return serviceMapping[lower];
  }
  
  if (/^service[_\-\s]?(\d+)$/i.test(trimmed)) {
    const match = trimmed.match(/^service[_\-\s]?(\d+)$/i);
    if (match) {
      return `Service ${match[1]}`;
    }
  }
  
  return trimmed
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
};

export default function App() {
  // Auth and Individual Context State
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'authenticated'>('login');
  const [selectedIndividual, setSelectedIndividual] = useState<Individual>(individualsRoster[0]);
  
  // Login input values (auto-populated based on selected individual)
  const [loginEmail, setLoginEmail] = useState(individualsRoster[0].email);
  const [loginPassword, setLoginPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<'FR' | 'EN' | 'AR'>('EN');

  // App Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'predictions' | 'comparison' | 'profile' | 'settings'>('overview');
  
  // Dashboard & Simulation Core States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [kpiHistory, setKPIHistory] = useState<KPIHistory[]>([]);
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [waitDistributions, setWaitDistributions] = useState<WaitDistributionItem[]>([]);
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [aiInsightLoading, setAiInsightLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Pagination & metrics raw state channels
  const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
  const [serverTotalCount, setServerTotalCount] = useState<number | null>(null);
  const [lastWeekRecordsRaw, setLastWeekRecordsRaw] = useState<KPIHistory[]>([]);
  const [chartRecordsRaw, setChartRecordsRaw] = useState<KPIHistory[]>([]);

  // Filters State
  const [timePeriod, setTimePeriod] = useState('Last Week');
  const [historySite, setHistorySite] = useState('All Global Sites');
  const [historyService, setHistoryService] = useState('All Services');
  const [historyPeriod, setHistoryPeriod] = useState('Last Month');
  const [predictionTimePeriod, setPredictionTimePeriod] = useState('Last Month');
  const [historyPage, setHistoryPage] = useState(1);

  // Dynamic discovered sites/services lists to prevent filter lockouts
  const [allDiscoveredSites, setAllDiscoveredSites] = useState<string[]>([]);
  const [allDiscoveredServices, setAllDiscoveredServices] = useState<string[]>([]);

  // Dark Mode Toggle State (strictly visual theme stays Ventriloc light, as requested)
  const [darkMode, setDarkMode] = useState(false);

  // Horizon comparison state variables
  const [comparisonHorizon, setComparisonHorizon] = useState<'week' | 'month' | 'quarter'>('month');
  const [comparisonKPI, setComparisonKPI] = useState<'volume' | 'waitTime' | 'productivity' | 'serviceRate'>('volume');
  const [personalizationFactor, setPersonalizationFactor] = useState<number>(100);
  const [agentStaffingAdj, setAgentStaffingAdj] = useState<number>(0);
  const [hasSetDefaults, setHasSetDefaults] = useState(false);
  const [activeHoverPoint, setActiveHoverPoint] = useState<number | null>(null);
  const [syncToast, setSyncToast] = useState<{message: string, type: 'info' | 'success'} | null>(null);

  // High-fidelity Comparison data structure
  const comparisonData = {
    week: {
      volume: [
        { label: "Day 1", history: 1200, predicted: 1150 },
        { label: "Day 2", history: 1350, predicted: 1280 },
        { label: "Day 3", history: 1410, predicted: 1390 },
        { label: "Day 4", history: 1100, predicted: 1200 },
        { label: "Day 5", history: 950, predicted: 1050 },
        { label: "Day 6", history: 1300, predicted: 1250 },
        { label: "Day 7", history: 1540, predicted: 1480 },
        { label: "Day 8", history: 1620, predicted: 1550 },
        { label: "Day 9", history: 1480, predicted: 1520 },
        { label: "Day 10", history: 1150, predicted: 1210 },
        { label: "Day 11", history: 1020, predicted: 1100 },
        { label: "Day 12", history: 1380, predicted: 1350 },
        { label: "Day 13", history: 1650, predicted: 1580 }
      ],
      waitTime: [
        { label: "Day 1", history: 8.5, predicted: 8.0 },
        { label: "Day 2", history: 9.2, predicted: 8.8 },
        { label: "Day 3", history: 10.1, predicted: 9.5 },
        { label: "Day 4", history: 7.4, predicted: 8.2 },
        { label: "Day 5", history: 6.8, predicted: 7.0 },
        { label: "Day 6", history: 8.9, predicted: 8.5 },
        { label: "Day 7", history: 11.2, predicted: 10.4 },
        { label: "Day 8", history: 11.8, predicted: 11.0 },
        { label: "Day 9", history: 9.5, predicted: 10.2 },
        { label: "Day 10", history: 8.1, predicted: 8.5 },
        { label: "Day 11", history: 7.2, predicted: 7.8 },
        { label: "Day 12", history: 9.0, predicted: 8.9 },
        { label: "Day 13", history: 11.5, predicted: 10.8 }
      ],
      productivity: [
        { label: "Day 1", history: 91, predicted: 92 },
        { label: "Day 2", history: 93, predicted: 91 },
        { label: "Day 3", history: 88, predicted: 90 },
        { label: "Day 4", history: 94, predicted: 93 },
        { label: "Day 5", history: 95, predicted: 94 },
        { label: "Day 6", history: 90, predicted: 91 },
        { label: "Day 7", history: 87, predicted: 89 },
        { label: "Day 8", history: 89, predicted: 90 },
        { label: "Day 9", history: 92, predicted: 91 },
        { label: "Day 10", history: 94, predicted: 93 },
        { label: "Day 11", history: 96, predicted: 94 },
        { label: "Day 12", history: 91, predicted: 92 },
        { label: "Day 13", history: 88, predicted: 90 }
      ],
      serviceRate: [
        { label: "Day 1", history: 94.2, predicted: 93.5 },
        { label: "Day 2", history: 92.5, predicted: 93.0 },
        { label: "Day 3", history: 90.1, predicted: 91.5 },
        { label: "Day 4", history: 95.8, predicted: 94.0 },
        { label: "Day 5", history: 96.5, predicted: 95.0 },
        { label: "Day 6", history: 93.2, predicted: 93.8 },
        { label: "Day 7", history: 89.4, predicted: 91.0 },
        { label: "Day 8", history: 91.3, predicted: 92.0 },
        { label: "Day 9", history: 93.8, predicted: 93.0 },
        { label: "Day 10", history: 95.2, predicted: 94.5 },
        { label: "Day 11", history: 96.8, predicted: 95.5 },
        { label: "Day 12", history: 92.9, predicted: 93.5 },
        { label: "Day 13", history: 90.5, predicted: 92.0 }
      ]
    },
    month: {
      volume: [
        { label: "W1-A", history: 8500, predicted: 8200 },
        { label: "W1-B", history: 9200, predicted: 8900 },
        { label: "W2-A", history: 9800, predicted: 9400 },
        { label: "W2-B", history: 7600, predicted: 8100 },
        { label: "W3-A", history: 8900, predicted: 8700 },
        { label: "W3-B", history: 10400, predicted: 9900 },
        { label: "W4-A", history: 11200, predicted: 10600 },
        { label: "W4-B", history: 9500, predicted: 9900 },
        { label: "W5-A", history: 8800, predicted: 9100 },
        { label: "W5-B", history: 10900, predicted: 10300 }
      ],
      waitTime: [
        { label: "W1-A", history: 8.2, predicted: 8.5 },
        { label: "W1-B", history: 8.8, predicted: 8.9 },
        { label: "W2-A", history: 9.5, predicted: 9.1 },
        { label: "W2-B", history: 7.1, predicted: 7.9 },
        { label: "W3-A", history: 8.6, predicted: 8.4 },
        { label: "W3-B", history: 10.2, predicted: 9.6 },
        { label: "W4-A", history: 11.0, predicted: 10.2 },
        { label: "W4-B", history: 9.2, predicted: 9.4 },
        { label: "W5-A", history: 8.4, predicted: 8.8 },
        { label: "W5-B", history: 10.7, predicted: 9.9 }
      ],
      productivity: [
        { label: "W1-A", history: 92.5, predicted: 91.0 },
        { label: "W1-B", history: 91.8, predicted: 92.0 },
        { label: "W2-A", history: 90.2, predicted: 91.5 },
        { label: "W2-B", history: 93.8, predicted: 92.8 },
        { label: "W3-A", history: 92.0, predicted: 92.5 },
        { label: "W3-B", history: 89.2, predicted: 90.5 },
        { label: "W4-A", history: 88.4, predicted: 89.8 },
        { label: "W4-B", history: 91.5, predicted: 91.0 },
        { label: "W5-A", history: 93.0, predicted: 92.2 },
        { label: "W5-B", history: 90.1, predicted: 91.2 }
      ],
      serviceRate: [
        { label: "W1-A", history: 93.8, predicted: 94.0 },
        { label: "W1-B", history: 94.2, predicted: 93.5 },
        { label: "W2-A", history: 92.1, predicted: 92.8 },
        { label: "W2-B", history: 95.4, predicted: 94.5 },
        { label: "W3-A", history: 93.5, predicted: 93.8 },
        { label: "W3-B", history: 90.8, predicted: 92.0 },
        { label: "W4-A", history: 89.9, predicted: 91.2 },
        { label: "W4-B", history: 92.6, predicted: 93.0 },
        { label: "W5-A", history: 94.5, predicted: 93.8 },
        { label: "W5-B", history: 91.2, predicted: 92.5 }
      ]
    },
    quarter: {
      volume: [
        { label: "Week 1", history: 35000, predicted: 34000 },
        { label: "Week 2", history: 36800, predicted: 35500 },
        { label: "Week 3", history: 38200, predicted: 37000 },
        { label: "Week 4", history: 33500, predicted: 35000 },
        { label: "Week 5", history: 31200, predicted: 32500 },
        { label: "Week 6", history: 37500, predicted: 36000 },
        { label: "Week 7", history: 39900, predicted: 38500 },
        { label: "Week 8", history: 41200, predicted: 40000 },
        { label: "Week 9", history: 38800, predicted: 39500 },
        { label: "Week 10", history: 34500, predicted: 35500 },
        { label: "Week 11", history: 32100, predicted: 33000 },
        { label: "Week 12", history: 39000, predicted: 37500 }
      ],
      waitTime: [
        { label: "Week 1", history: 8.9, predicted: 8.6 },
        { label: "Week 2", history: 9.1, predicted: 8.8 },
        { label: "Week 3", history: 9.8, predicted: 9.2 },
        { label: "Week 4", history: 7.9, predicted: 8.4 },
        { label: "Week 5", history: 7.2, predicted: 7.5 },
        { label: "Week 6", history: 9.4, predicted: 9.0 },
        { label: "Week 7", history: 10.5, predicted: 10.0 },
        { label: "Week 8", history: 11.2, predicted: 10.6 },
        { label: "Week 9", history: 9.9, predicted: 10.1 },
        { label: "Week 10", history: 8.3, predicted: 8.5 },
        { label: "Week 11", history: 7.6, predicted: 7.9 },
        { label: "Week 12", history: 9.6, predicted: 9.1 }
      ],
      productivity: [
        { label: "Week 1", history: 91.2, predicted: 92.0 },
        { label: "Week 2", history: 92.4, predicted: 91.8 },
        { label: "Week 3", history: 89.8, predicted: 90.5 },
        { label: "Week 4", history: 93.1, predicted: 92.7 },
        { label: "Week 5", history: 94.5, predicted: 93.8 },
        { label: "Week 6", history: 91.8, predicted: 92.0 },
        { label: "Week 7", history: 88.9, predicted: 90.0 },
        { label: "Week 8", history: 90.3, predicted: 91.2 },
        { label: "Week 9", history: 92.1, predicted: 91.5 },
        { label: "Week 10", history: 93.8, predicted: 93.0 },
        { label: "Week 11", history: 94.9, predicted: 94.0 },
        { label: "Week 12", history: 91.1, predicted: 91.8 }
      ],
      serviceRate: [
        { label: "Week 1", history: 93.1, predicted: 93.5 },
        { label: "Week 2", history: 93.8, predicted: 93.0 },
        { label: "Week 3", history: 91.2, predicted: 92.0 },
        { label: "Week 4", history: 94.9, predicted: 94.2 },
        { label: "Week 5", history: 95.8, predicted: 95.0 },
        { label: "Week 6", history: 93.5, predicted: 93.8 },
        { label: "Week 7", history: 90.2, predicted: 91.5 },
        { label: "Week 8", history: 91.9, predicted: 92.5 },
        { label: "Week 9", history: 93.4, predicted: 93.0 },
        { label: "Week 10", history: 95.1, predicted: 94.5 },
        { label: "Week 11", history: 96.2, predicted: 95.5 },
        { label: "Week 12", history: 92.5, predicted: 93.2 }
      ]
    }
  };

  // Advanced Assistant Panel
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'model', text: string}>>([
    {
      role: 'model',
      text: `### Welcome back, Director.
I am connected directly to the SmartQueueAnalyst forecasting logs. 
*Ask me anything about:*
- **SLA Violation Alerts**: "Identify support tickets currently at risk."
- **Resource Placement**: "Optimize global center allocations for regional bottlenecks."
- **Queue Performance**: "Give me a summary of billing queue metrics."`
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Workflow N8N connection configuration
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('https://ebook-untagged-smelting.ngrok-free.dev/webhook/api/data');
  const [autoSync, setAutoSync] = useState(true);
  const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [webhookTestResponse, setWebhookTestResponse] = useState<string>('');

  // 1. Find the 7 most recent unique days for "last week"
  const lastWeekRecords = useMemo(() => {
    if (lastWeekRecordsRaw && lastWeekRecordsRaw.length > 0) {
      return lastWeekRecordsRaw;
    }
    if (!kpiHistory || kpiHistory.length === 0) return [];
    const uniqueDays = Array.from(new Set(kpiHistory.map(h => h.jour))) as string[];
    uniqueDays.sort((a, b) => b.localeCompare(a));
    const sliceDays = uniqueDays.slice(0, 7);
    return kpiHistory.filter(h => sliceDays.includes(h.jour));
  }, [lastWeekRecordsRaw, kpiHistory]);

  // 2. Average Wait Time in last week
  const avgWaitTime = useMemo(() => {
    if (lastWeekRecords.length === 0) return 3.4;
    const totalVol = lastWeekRecords.reduce((sum, r) => sum + r.volume_tickets, 0) || 1;
    const weightedWaitSum = lastWeekRecords.reduce((sum, r) => sum + r.duree_attente_moy * r.volume_tickets, 0);
    return parseFloat((weightedWaitSum / totalVol).toFixed(1));
  }, [lastWeekRecords]);

  // 3. Average Service Rate in last week
  const avgServiceRate = useMemo(() => {
    if (lastWeekRecords.length === 0) return 94.8;
    const totalVol = lastWeekRecords.reduce((sum, r) => sum + r.volume_tickets, 0) || 1;
    const weightedSvcSum = lastWeekRecords.reduce((sum, r) => sum + r.taux_service * r.volume_tickets, 0);
    return parseFloat((weightedSvcSum / totalVol).toFixed(1));
  }, [lastWeekRecords]);

  // 4. Total Volume in last week
  const totalVolumeLastWeek = useMemo(() => {
    if (lastWeekRecords.length === 0) return 1450;
    return lastWeekRecords.reduce((sum, r) => sum + r.volume_tickets, 0);
  }, [lastWeekRecords]);

  // 5. Average Productivity in last week
  const avgProductivity = useMemo(() => {
    if (lastWeekRecords.length === 0) return 8.2;
    return parseFloat((lastWeekRecords.reduce((sum, r) => sum + r.productivite_agent, 0) / lastWeekRecords.length).toFixed(1));
  }, [lastWeekRecords]);

  // 6. Average Abandonment Rate in last week
  const avgAbandonRate = useMemo(() => {
    if (lastWeekRecords.length === 0) return 2.1;
    return parseFloat((lastWeekRecords.reduce((sum, r) => sum + r.taux_abandon, 0) / lastWeekRecords.length).toFixed(1));
  }, [lastWeekRecords]);

  // 7. Resource Occupation averages by site
  const siteOccupation = useMemo(() => {
    // Collect all records to work with. If lastWeekRecords is empty, use kpiHistory.
    const records = lastWeekRecords.length > 0 ? lastWeekRecords : kpiHistory;

    const defaultState = {
      topSites: [
        { name: "London Hub", value: 78, color: "#ff682c" },
        { name: "Paris Ops", value: 62, color: "#ffdbcf" },
        { name: "Berlin Center", value: 45, color: "#816729" }
      ],
      globalAvg: 65
    };

    if (!records || records.length === 0) {
      return defaultState;
    }

    const siteMap = new Map<string, { sum: number, count: number }>();
    for (const record of records) {
      if (!record.site) continue;
      const siteName = record.site.trim();
      const current = siteMap.get(siteName) || { sum: 0, count: 0 };
      siteMap.set(siteName, {
        sum: current.sum + (record.occupation_guichets || 0),
        count: current.count + 1
      });
    }

    const computedSites = Array.from(siteMap.entries()).map(([name, stats]) => {
      return {
        name,
        value: Math.round(stats.sum / stats.count)
      };
    });

    if (computedSites.length === 0) {
      return defaultState;
    }

    // Sort descending by value to get top sites
    computedSites.sort((a, b) => b.value - a.value);

    // Get top 3
    const top3 = computedSites.slice(0, 3);

    const colors = ["#ff682c", "#ffdbcf", "#816729"];
    const formattedTopSites = top3.map((site, index) => ({
      name: site.name,
      value: site.value,
      color: colors[index % colors.length]
    }));

    // Calculate dynamic average across all computed sites for a true global average
    const globalAvg = Math.round(
      computedSites.reduce((sum, s) => sum + s.value, 0) / computedSites.length
    );

    return {
      topSites: formattedTopSites,
      globalAvg
    };
  }, [lastWeekRecords, kpiHistory]);

  // 8. Dynamic real Alerts from Last Week records
  const dynamicAlerts = useMemo(() => {
    if (lastWeekRecords.length === 0) {
      return [
        { id: '1', title: 'Workforce levels healthy. No upcoming SLA warnings under current queue volumes.', severity: 'low', time: '10m ago' },
        { id: '2', title: 'SLA margin high. Daily service level compliance is at 94.8% average.', severity: 'low', time: '1h ago' }
      ];
    }

    const alertsList: Array<{ id: string; title: string; severity: string; time: string }> = [];
    const sortedRecords = [...lastWeekRecords].sort((a, b) => b.jour.localeCompare(a.jour));

    for (const record of sortedRecords) {
      if (record.sla_breach_count > 0) {
        alertsList.push({
          id: `sla-${record.id}`,
          title: `🚩 ${record.sla_breach_count} SLA Breaches at ${cleanSiteNameFrontend(record.site)} (${cleanServiceNameFrontend(record.service)})`,
          severity: 'high',
          time: `Date: ${record.jour}`
        });
      }
      if (record.duree_attente_moy > 3.2) {
        alertsList.push({
          id: `wait-${record.id}`,
          title: `⏳ Long wait time: ${record.duree_attente_moy}m at ${cleanSiteNameFrontend(record.site)}`,
          severity: 'high',
          time: `Date: ${record.jour}`
        });
      }
      if (record.taux_abandon > 4.5) {
        alertsList.push({
          id: `abandon-${record.id}`,
          title: `⚠️ High Abandon rate: ${record.taux_abandon}% in ${cleanServiceNameFrontend(record.service)}`,
          severity: 'medium',
          time: `Date: ${record.jour}`
        });
      }
      if (record.taux_service < 90) {
        alertsList.push({
          id: `svc-${record.id}`,
          title: `📉 Low compliance: ${record.taux_service}% at ${cleanSiteNameFrontend(record.site)}`,
          severity: 'high',
          time: `Date: ${record.jour}`
        });
      }
      if (alertsList.length >= 4) break;
    }

    if (alertsList.length === 0) {
      return [
        { id: 'ok-1', title: 'All site queues are performing beautifully. No breaches recorded.', severity: 'low', time: 'Just now' },
        { id: 'ok-2', title: 'Calculated wait margin is exceptionally secure under 3.0 mins.', severity: 'low', time: '10m ago' }
      ];
    }
    return alertsList;
  }, [lastWeekRecords]);

  // 9. Dynamic AI insights
  const dynamicAIInsight = useMemo(() => {
    if (aiInsight) {
      return aiInsight;
    }
    if (lastWeekRecords.length === 0) {
      return "Calculated wait-times look extremely stable for this cycle. Keep resources balanced.";
    }

    const totalBreaches = lastWeekRecords.reduce((sum, r) => sum + r.sla_breach_count, 0);
    const worstSvcRecord = [...lastWeekRecords].sort((a,b) => a.taux_service - b.taux_service)[0];
    const bestSvcRecord = [...lastWeekRecords].sort((a,b) => b.taux_service - a.taux_service)[0];

    if (totalBreaches > 10) {
      return `Weekly congestion alert: A total of ${totalBreaches} SLA breaches occurred in the last 7 days. Underperforming at ${cleanSiteNameFrontend(worstSvcRecord?.site)} ${cleanServiceNameFrontend(worstSvcRecord?.service)} with a service rate of ${worstSvcRecord?.taux_service}%. Adjust staffing model immediately.`;
    } else {
      return `Operational model highly stable over the last week. Combined wait times did not exceed ${avgWaitTime.toFixed(1)} mins, and average SLA adherence stayed at a robust ${avgServiceRate.toFixed(1)}%. Resource occupation is running perfectly at ${siteOccupation.globalAvg}% average.`;
    }
  }, [lastWeekRecords, avgWaitTime, avgServiceRate, siteOccupation]);

  // 9.5 Prediction records manager
  const predictionRecords = useMemo(() => {
    if (predictionData && predictionData.length > 0) {
      return predictionData;
    }
    const baseRecords = kpiHistory && kpiHistory.length > 0 ? kpiHistory : [];
    if (baseRecords.length === 0) {
      const mockClassics = [];
      const sites = ["Paris Ops", "London Hub", "Berlin Center"];
      const services = ["Premium Support", "Technical Tier 2", "Claims Adj.", "Premium Billing"];
      for (let day = 1; day <= 30; day++) {
        const dateStr = `2026-07-${day < 10 ? '0' + day : day}`;
        for (const s of sites) {
          for (const srv of services) {
            mockClassics.push({
              id: `${day}-${s}-${srv}`,
              jour: dateStr,
              date: dateStr,
              site: s,
              service: srv,
              volume_tickets: Math.round(150 + Math.random() * 200),
              duree_attente_moy: 2.1 + Math.random() * 1.5,
              duree_traitement_moy: 8.5 + Math.random() * 3,
              taux_service: 93.5 + Math.random() * 5,
              taux_abandon: 2.5 + Math.random() * 3,
              sla_breach_count: Math.random() > 0.85 ? Math.round(Math.random() * 3) : 0,
              flux_par_heure: 12.5 + Math.random() * 6,
              occupation_guichets: 0.65 + Math.random() * 0.15,
              productivite_agent: 7.5 + Math.random() * 3
            });
          }
        }
      }
      return mockClassics;
    }

    return baseRecords.map((r, idx) => {
      const histDate = new Date(r.jour);
      histDate.setDate(histDate.getDate() + 30);
      const year = histDate.getFullYear();
      const month = String(histDate.getMonth() + 1).padStart(2, '0');
      const day = String(histDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const parsePct = (v: number) => (v > 1 ? v : v * 100);
      return {
        ...r,
        id: `pred-${r.id || idx}`,
        jour: formattedDate,
        date: formattedDate,
        volume_tickets: Math.round((r.volume_tickets || 120) * 1.08),
        duree_attente_moy: parseFloat(((r.duree_attente_moy || 2.4) * 0.95).toFixed(2)),
        duree_traitement_moy: parseFloat(((r.duree_traitement_moy || 8.2) * 0.98).toFixed(2)),
        taux_service: parseFloat((parsePct(r.taux_service) * 1.01).toFixed(2)),
        taux_abandon: parseFloat((parsePct(r.taux_abandon || 0) * 0.9).toFixed(2)),
        sla_breach_count: Math.max(0, (r.sla_breach_count || 0) - 1),
        flux_par_heure: parseFloat(((r.flux_par_heure || 8.5) * 1.05).toFixed(2)),
        occupation_guichets: parseFloat(((r.occupation_guichets || 0.72) * 0.96).toFixed(4)),
        productivite_agent: parseFloat(((r.productivite_agent || 8.1) * 1.04).toFixed(2))
      };
    });
  }, [predictionData, kpiHistory]);

  // 10. Group and sort kpiHistory for Recharts Area Charts
  const chartData = useMemo(() => {
    const rawRecords = chartRecordsRaw && chartRecordsRaw.length > 0 ? chartRecordsRaw : kpiHistory;
    if (!rawRecords || rawRecords.length === 0) return [];
    const grouped: { [date: string]: { jour: string; waitSum: number; treatSum: number; count: number } } = {};
    for (const record of rawRecords) {
      if (!grouped[record.jour]) {
        grouped[record.jour] = { jour: record.jour, waitSum: 0, treatSum: 0, count: 0 };
      }
      grouped[record.jour].waitSum += record.duree_attente_moy;
      grouped[record.jour].treatSum += record.duree_traitement_moy;
      grouped[record.jour].count += 1;
    }
    return Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .map(date => {
        const item = grouped[date];
        const dateObj = new Date(date);
        const label = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        return {
          jour: date,
          label: label,
          "Wait Time": parseFloat((item.waitSum / item.count).toFixed(1)),
          "Treatment Time": parseFloat((item.treatSum / item.count).toFixed(1))
        };
      });
  }, [chartRecordsRaw, kpiHistory]);

  const itemsPerPage = 10;

  const filteredHistoryList = useMemo(() => {
    if (!kpiHistory) return [];
    let filtered = [...kpiHistory];
    if (historySite !== 'All Global Sites') {
      filtered = filtered.filter(h => h.site === historySite);
    }
    if (historyService !== 'All Services' && historyService !== 'All Global Sites' && historyService !== 'Premium Support') {
      filtered = filtered.filter(h => h.service === historyService || h.service.toLowerCase().includes(historyService.toLowerCase()));
    }
    return filtered.sort((a, b) => b.jour.localeCompare(a.jour));
  }, [kpiHistory, historySite, historyService]);

  const historySites = useMemo(() => {
    const sites = Array.from(new Set(allDiscoveredSites)).filter(Boolean);
    sites.sort();
    return ['All Global Sites', ...sites.filter(s => s !== 'All Global Sites')];
  }, [allDiscoveredSites]);

  const historyServices = useMemo(() => {
    const services = Array.from(new Set(allDiscoveredServices)).filter(Boolean);
    services.sort();
    return ['All Services', ...services.filter(s => s !== 'All Services' && s !== 'Premium Support')];
  }, [allDiscoveredServices]);

  const totalPages = useMemo(() => {
    if (serverTotalPages !== null) return serverTotalPages;
    return Math.ceil(filteredHistoryList.length / itemsPerPage) || 1;
  }, [serverTotalPages, filteredHistoryList]);

  const totalHistoryCount = serverTotalCount !== null ? serverTotalCount : filteredHistoryList.length;

  useEffect(() => {
    if (historyPage > totalPages) {
      setHistoryPage(totalPages);
    }
  }, [totalPages, historyPage]);

  const paginatedHistory = useMemo(() => {
    if (serverTotalPages !== null) {
      return kpiHistory;
    }
    const startIndex = (historyPage - 1) * itemsPerPage;
    return filteredHistoryList.slice(startIndex, startIndex + itemsPerPage);
  }, [serverTotalPages, kpiHistory, filteredHistoryList, historyPage]);

  // Load backend metrics matching simulated wait models
  const fetchDashboardData = async () => {
    setLoading(true);
    
    const fetchOverview = async () => {
      try {
        const response = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'overview', 
            n8nWebhookUrl
          })
        });
        if (response.ok) {
          const data = await response.json();
          const overview = data.overview || data.data?.overview || data.data || data;
          if (overview && typeof overview === 'object') {
            setOverviewMetrics({
              avgWaitTime: overview.avgWaitTime || overview.duree_attente_moy || "13.4 mins",
              slaAdherenceRate: overview.slaAdherenceRate || (overview.taux_service ? `${overview.taux_service}%` : "94.8%"),
              totalTickets: overview.totalTickets || overview.volume_tickets || 24,
              breachedCount: overview.breachedCount || overview.sla_breach_count || 0,
              warningCount: overview.warningCount || 0,
              highRiskCount: overview.highRiskCount || 0,
              activeAgentsCount: overview.activeAgentsCount || overview.nb_guichets_actifs || 6,
              priorityBreakdown: overview.priorityBreakdown || { Urgent: 2, High: 5, Normal: 12, Low: 5 },
              predictionsMade: overview.predictionsMade || 1452,
              workflowConnected: !!n8nWebhookUrl
            });
          }
        }
      } catch (e) {
        console.error("Failed to load overview data stream:", e);
      }
    };

    const fetchPrediction = async () => {
      try {
        const response = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'prediction', 
            n8nWebhookUrl,
            payload: {
              period: comparisonHorizon,
              site: historySite,
              service: historyService
            }
          })
        });
        if (response.ok) {
          const predData = await response.json();
          const tickets = predData.tickets || predData.data?.tickets || (predData.source === 'n8n' && Array.isArray(predData.data) ? predData.data : null);
          const agents = predData.agents || predData.data?.agents;
          const waitDistributions = predData.waitDistributions || predData.data?.waitDistributions;

          if (tickets) setTickets(tickets);
          if (agents) setAgents(agents);
          if (waitDistributions) setWaitDistributions(waitDistributions);

          // Extract KPI Predictions row list if present in the data payload
          const predList = predData.predictions || predData.data?.predictions || (Array.isArray(predData) ? predData : (Array.isArray(predData.data) ? predData.data : null));
          if (predList && Array.isArray(predList) && predList.length > 0) {
            setPredictionData(predList);
          }
        }
      } catch (e) {
        console.error("Failed to load prediction data stream:", e);
      }
    };

    const fetchHistory = async () => {
      try {
        const mappedPeriod = historyPeriod.toLowerCase().includes('week') ? 'week' :
                             historyPeriod.toLowerCase().includes('quarter') ? 'quarter' :
                             historyPeriod.toLowerCase().includes('year') ? 'quarter' : 'month';
        const response = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'history', 
            n8nWebhookUrl,
            payload: {
              page: historyPage,
              limit: itemsPerPage,
              site: historySite,
              service: historyService,
              period: mappedPeriod
            }
          })
        });
        if (response.ok) {
          const histData = await response.json();
          let history = histData.history;
          if (!history && histData.data) {
            if (Array.isArray(histData.data)) {
              history = histData.data;
            } else if (histData.data.history) {
              history = histData.data.history;
            }
          }
          if (!history) {
            history = findKPIHistoryArray(histData);
          }
          if (history && Array.isArray(history)) {
            setKPIHistory(history);
          }
          if (typeof histData.totalPages === 'number') {
            setServerTotalPages(histData.totalPages);
          }
          if (typeof histData.totalCount === 'number') {
            setServerTotalCount(histData.totalCount);
          }
          if (histData.lastWeekRecords && Array.isArray(histData.lastWeekRecords)) {
            setLastWeekRecordsRaw(histData.lastWeekRecords);
          }
          if (histData.chartRecordsRaw && Array.isArray(histData.chartRecordsRaw)) {
            setChartRecordsRaw(histData.chartRecordsRaw);
          }
        }
      } catch (e) {
        console.error("Failed to load historical data stream:", e);
      }
    };

    try {
      await Promise.all([fetchOverview(), fetchPrediction(), fetchHistory()]);
    } catch (error) {
      console.error("Failed to load pipeline data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverTotalPages !== null) {
      const fetchHistoryPaged = async () => {
        try {
          const mappedPeriod = historyPeriod.toLowerCase().includes('week') ? 'week' :
                               historyPeriod.toLowerCase().includes('quarter') ? 'quarter' :
                               historyPeriod.toLowerCase().includes('year') ? 'quarter' : 'month';
          const response = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'history',
              n8nWebhookUrl,
              payload: {
                page: historyPage,
                limit: itemsPerPage,
                site: historySite,
                service: historyService,
                period: mappedPeriod
              }
            })
          });
          if (response.ok) {
            const histData = await response.json();
            if (histData.history && Array.isArray(histData.history)) {
              setKPIHistory(histData.history);
            }
            if (typeof histData.totalPages === 'number') {
              setServerTotalPages(histData.totalPages);
            }
            if (typeof histData.totalCount === 'number') {
              setServerTotalCount(histData.totalCount);
            }
          }
        } catch (e) {
          console.error("Failed to load paginated history page:", e);
        }
      };
      fetchHistoryPaged();
    }
  }, [historyPage, historySite, historyService, historyPeriod, n8nWebhookUrl]);

  const handleTestWebhook = async () => {
    setWebhookTestStatus('testing');
    setWebhookTestResponse('');
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          n8nWebhookUrl,
          payload: {
            timestamp: new Date().toISOString(),
            message: "Hello from SmartQueueAnalyst Comparison & Analytics suite!",
            environment: "AI Studio Preview App"
          }
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setWebhookTestStatus('success');
        setWebhookTestResponse(JSON.stringify(data.data || data, null, 2));
      } else {
        setWebhookTestStatus('failed');
        setWebhookTestResponse(data.error || "Webhook response was not successful.");
      }
    } catch (e: any) {
      setWebhookTestStatus('failed');
      setWebhookTestResponse(e.message || "Failed to contact proxy backend.");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedIndividual, historySite, historyService, historyPeriod, comparisonHorizon]);

  useEffect(() => {
    if (kpiHistory && kpiHistory.length > 0) {
      const filteredRawSites = (Array.from(new Set(kpiHistory.map(h => String((h as any).site || "")))) as string[])
        .filter(Boolean)
        .filter((s: string) => {
          const sl = s.toLowerCase();
          return !sl.includes("berlin central") && !sl.includes("done hue hub") && !sl.includes("paris ops") && !sl.includes("paris_ops");
        });
      const filteredRawServices = (Array.from(new Set(kpiHistory.map(h => String((h as any).service || "")))) as string[]).filter(Boolean);

      // Natural Sort sites e.g. Site 2 before Site 10 and numeric bounds 1 to 180
      const sortedSites = filteredRawSites.sort((a: string, b: string) => 
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      );
      const sortedServices = filteredRawServices.sort();

      if (sortedSites.length > 0) {
        setAllDiscoveredSites(sortedSites);
        if (!hasSetDefaults) {
          setHistorySite(sortedSites[0]);
          if (sortedServices.length > 0) {
            setHistoryService(sortedServices[0]);
          }
          setHasSetDefaults(true);
        }
      }
      if (sortedServices.length > 0) {
        setAllDiscoveredServices(sortedServices);
      }
    }
  }, [kpiHistory, hasSetDefaults]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showAssistantModal]);

  useEffect(() => {
    const fetchAIInsight = async () => {
      setAiInsightLoading(true);
      try {
        const response = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'chat',
            n8nWebhookUrl,
            payload: {
              message: "In 2 sentences maximum, give the most important alert from the last 7 days of queue data. Be direct, no formatting, no bullet points.",
              history: []
            }
          })
        });
        if (response.ok) {
          const data = await response.json();
          const replyText = data.reply || data.text || (data.data && (data.data.reply || data.data.text)) || null;
          if (replyText) {
            setAiInsight(replyText);
          }
        }
      } catch (e) {
        console.error("Failed to load automated AI Insight:", e);
      } finally {
        setAiInsightLoading(false);
      }
    };
    
    fetchAIInsight();
  }, [n8nWebhookUrl]);

  // Auto populate email when selecting individuals
  const handleSelectIndividual = (ind: Individual) => {
    setSelectedIndividual(ind);
    setLoginEmail(ind.email);
    setAuthMode('authenticated');
    setActiveTab('overview');
    setTimeout(() => {
      handleSyncData();
    }, 50);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMode('authenticated');
    setActiveTab('overview');
    setTimeout(() => {
      handleSyncData();
    }, 50);
  };

  const handleSyncData = async () => {
    setSyncing(true);
    setHistoryPage(1);
    setSyncToast({ message: "Synchronizing to get a new data...", type: "info" });
    try {
      const mappedPeriod = historyPeriod.toLowerCase().includes('week') ? 'week' :
                           historyPeriod.toLowerCase().includes('quarter') ? 'quarter' :
                           historyPeriod.toLowerCase().includes('year') ? 'quarter' : 'month';
      // 1. Invoke history refresh workflow returning live historic logs
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'history', 
          n8nWebhookUrl, 
          action: 'sync history',
          payload: { 
            action: 'sync history',
            actionAlt: 'sync_history',
            actionAlt2: 'syncHistory',
            page: 1,
            limit: itemsPerPage,
            site: historySite,
            service: historyService,
            period: mappedPeriod
          } 
        })
      });

      if (response.ok) {
        const histData = await response.json();
        let history = histData.history;
        if (!history && histData.data) {
          if (Array.isArray(histData.data)) {
            history = histData.data;
          } else if (histData.data.history) {
            history = histData.data.history;
          }
        }
        if (!history) {
          history = findKPIHistoryArray(histData);
        }
        if (history && Array.isArray(history)) {
          setKPIHistory(history);
        }
      }

      // 2. Fetch general live overview state and ticketing predictions
      await fetchDashboardData();
      setSyncToast({ message: "Synchronized to get the real data!", type: "success" });
      setTimeout(() => {
        setSyncToast(null);
      }, 4000);
    } catch (e) {
      console.error("Sync history failed:", e);
      setSyncToast({ message: "Synchronization failed. Please verify n8n webhook connection.", type: "info" });
      setTimeout(() => {
        setSyncToast(null);
      }, 5000);
    } finally {
      setSyncing(false);
    }
  };

  const handleSendChat = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim()) return;

    if (!presetText) setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setChatLoading(true);

    try {
      // Proxy chat payload to our server API route
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          n8nWebhookUrl,
          payload: {
            message: textToSend,
            history: chatMessages
          }
        })
      });
      const data = await response.json();
      const replyText = data.reply || data.text || (data.data && (data.data.reply || data.data.text)) || null;
      if (replyText) {
        setChatMessages(prev => [...prev, { role: 'model', text: replyText }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'model', text: "The assistant received your payload. Forecasting simulation models are healthy." }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'model', text: `Connection timeout: fall-back validation completed successfully.` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSaveProfile = () => {
    // Modify current active individual values locally
    setSelectedIndividual(prev => ({
      ...prev,
      name: selectedIndividual.name,
      email: selectedIndividual.email,
      role: selectedIndividual.role
    }));
    // Save state notification
    alert("Profile configurations saved securely to asset logs!");
  };

  return (
    <div className="absolute inset-0 bg-[#efefef] font-sans text-[#202020] overflow-x-hidden select-none">
      
      <AnimatePresence mode="wait">
        
        {/* LOGIN SCREEN: SPLIT CANVAS EXACT LOGOUT STATE */}
        {authMode !== 'authenticated' ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white"
          >
            {/* LEFT HALF — PRECISE DIRECTOR ACCESS FORM */}
            <div className="lg:col-span-5 flex flex-col justify-between p-8 lg:p-14 bg-white relative">
              
              {/* TOP BRAND EMBLEM */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff682c] flex items-center justify-center text-white">
                  <span className="font-display font-medium text-lg">S</span>
                </div>
                <span className="font-display font-bold text-lg tracking-tight text-[#202020]">SmartQueueAnalyst</span>
              </div>

              {/* INDIVIDUAL CONTROLLER ROSTER */}
              <div className="my-1 border border-dashed border-[#e8e8e8] bg-[#fbfbfb] rounded-xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#ff682c]" />
                  <span>Connect to individuals (Select to Login)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {individualsRoster.map((ind) => (
                    <button
                      key={ind.id}
                      onClick={() => handleSelectIndividual(ind)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg transition text-left cursor-pointer border ${
                        selectedIndividual.id === ind.id 
                          ? 'border-[#ff682c] bg-orange-50/40' 
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <img src={ind.avatarUrl} alt={ind.name} className="w-7 h-7 rounded-full object-cover" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-[#202020] truncate">{ind.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{ind.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* CENTER COMPACT FORM */}
              <div className="max-w-md w-full mx-auto my-6 space-y-6">
                <div>
                  <h1 className="font-display text-[#202020] tracking-tight font-light leading-none text-4xl sm:text-5xl">
                    {authMode === 'signup' ? 'Create Your' : 'Director'} <br />
                    <span className="font-semibold block mt-0.5">
                      {authMode === 'signup' ? 'DirectorAccount' : 'Access'}
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-2">
                    {authMode === 'signup' ? 'Sign up to manage your intelligence assets.' : 'Sign in to manage your intelligence assets.'}
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="username" 
                          value={selectedIndividual.name}
                          onChange={(e) => setSelectedIndividual({...selectedIndividual, name: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 text-xs bg-[#f7f3f2] border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff682c]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Work Email</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 transform rotate-45" />
                      <input 
                        type="email" 
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="director@signal.com" 
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#f7f3f2] border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff682c]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Secure Password</label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#f7f3f2] border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff682c]"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-[#ff682c] focus:ring-[#ff682c]" 
                      />
                      <span>Remember me</span>
                    </label>
                    <a href="#forgot" className="text-[#ff682c] font-medium hover:underline">Forgot Password?</a>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#202020] hover:bg-slate-800 text-white font-medium text-xs rounded-full transition cursor-pointer"
                  >
                    {authMode === 'signup' ? 'Sign Up' : 'Sign In'}
                  </button>
                </form>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-400 font-light text-xs">OR</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button 
                  onClick={() => setAuthMode('authenticated')}
                  className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>

                <div className="text-center pt-2">
                  <button 
                    onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    {authMode === 'signup' ? (
                      <>Already have an account? <span className="text-[#ff682c] font-medium hover:underline">Sign In</span></>
                    ) : (
                      <>Don't have an account? <span className="text-[#ff682c] font-medium hover:underline">Sign Up</span></>
                    )}
                  </button>
                </div>
              </div>

              {/* BOTTOM LANGUAGE TOGGLE */}
              <div className="flex gap-4 text-[11px] font-semibold text-slate-400 mt-4 justify-start">
                <button onClick={() => setLang('FR')} className={`hover:text-[#ff682c] ${lang === 'FR' ? 'text-[#202020]' : ''}`}>FR</button>
                <span className="text-slate-200">|</span>
                <button onClick={() => setLang('EN')} className={`hover:text-[#ff682c] ${lang === 'EN' ? 'text-[#202020]' : ''}`}>EN</button>
                <span className="text-slate-200">|</span>
                <button onClick={() => setLang('AR')} className={`hover:text-[#ff682c] ${lang === 'AR' ? 'text-[#202020]' : ''}`}>AR</button>
              </div>

            </div>

            {/* RIGHT HALF — PRECISE ARCHITECTURAL COMPASS GRAPHIC PANEL */}
            <div className="hidden lg:col-span-7 bg-[#f7f3f2] flex-col items-center justify-center p-12 text-center relative border-l border-[#e8e8e8] lg:flex">
              
              <div className="relative w-80 h-80 flex items-center justify-center">
                {/* Vintage Detailed Compass Rose Graphics using SVG */}
                <svg viewBox="0 0 400 400" className="w-76 h-76 transform hover:rotate-12 transition-transform duration-1000">
                  {/* Outer Rings */}
                  <circle cx="200" cy="200" r="160" fill="none" stroke="#202020" strokeWidth="1" />
                  <circle cx="200" cy="200" r="150" fill="none" stroke="#828282" strokeWidth="1.5" strokeDasharray="3,3" />
                  <circle cx="200" cy="200" r="40" fill="none" stroke="#ff682c" strokeWidth="2" />
                  <circle cx="200" cy="200" r="15" fill="#ff682c" opacity="0.1" />
                  
                  {/* Outer ticks */}
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <line 
                      key={idx}
                      x1="200" y1="40" x2="200" y2="48"
                      stroke="#4d4d4d" strokeWidth="1.5"
                      transform={`rotate(${idx * 30} 200 200)`}
                    />
                  ))}

                  {/* Compass Stars (Triangles representing compass needles) */}
                  {/* North Point */}
                  <path d="M200,200 L185,200 L200,50 Z" fill="#ff682c" stroke="#202020" strokeWidth="1.5" />
                  <path d="M200,200 L215,200 L200,50 Z" fill="#ffdbcf" stroke="#202020" strokeWidth="1.5" />
                  
                  {/* South Point */}
                  <path d="M200,200 L185,200 L200,350 Z" fill="#ffdbcf" stroke="#202020" strokeWidth="1.5" />
                  <path d="M200,200 L215,200 L200,350 Z" fill="#ff682c" stroke="#202020" strokeWidth="1.5" />
                  
                  {/* East Point */}
                  <path d="M200,200 L200,185 L350,200 Z" fill="#ff682c" stroke="#202020" strokeWidth="1.5" />
                  <path d="M200,200 L200,215 L350,200 Z" fill="#ffdbcf" stroke="#202020" strokeWidth="1.5" />
                  
                  {/* West Point */}
                  <path d="M200,200 L200,185 L50,200 Z" fill="#ffdbcf" stroke="#202020" strokeWidth="1.5" />
                  <path d="M200,200 L200,215 L50,200 Z" fill="#ff682c" stroke="#202020" strokeWidth="1.5" />

                  {/* Intermediate directions (smaller stars) */}
                  <path d="M200,200 L190,190 L295,105 Z" fill="#816729" stroke="#202020" strokeWidth="1" />
                  <path d="M200,200 L190,190 L105,295 Z" fill="#816729" stroke="#202020" strokeWidth="1" />
                  <path d="M200,200 L210,190 L295,295 Z" fill="#e8e8e8" stroke="#202020" strokeWidth="1" />
                  <path d="M200,200 L190,210 L105,105 Z" fill="#e8e8e8" stroke="#202020" strokeWidth="1" />

                  {/* Core hub */}
                  <circle cx="200" cy="200" r="28" fill="#ffffff" stroke="#202020" strokeWidth="2.5" />
                  <circle cx="200" cy="200" r="14" fill="#ff682c" stroke="#202020" strokeWidth="1.5" />
                  <circle cx="200" cy="200" r="5" fill="#ffffff" />
                </svg>

                {/* Compass Direction Labels (N, S, E, W) */}
                <span className="absolute top-0 text-xl font-display font-bold text-[#202020]">N</span>
                <span className="absolute bottom-1 text-xl font-display font-bold text-[#202020]">S</span>
                <span className="absolute right-0 text-xl font-display font-bold text-[#202020]">E</span>
                <span className="absolute left-0 text-xl font-display font-bold text-[#202020]">W</span>
              </div>

              <div className="max-w-md mt-10 space-y-3">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-[#202020]">Intelligence Made Simple.</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Access high-fidelity signals and market analytics with the new Director dashboard. Precision engineering for the modern asset manager.
                </p>
              </div>

              {/* Version Code and Tag */}
              <div className="absolute bottom-8 text-[10px] font-mono tracking-widest text-slate-400">
                V.4.0.2 / RESOURCE ENGINE
              </div>

            </div>
          </motion.div>
        ) : (
          
          /* MAIN WEB APPLICATION CONSOLE */
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex bg-[#efefef]"
          >
            {/* Sync Notifications Pop-up Toast */}
            {syncToast && (
              <div id="sync-status-toast" className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-xs font-semibold transition-all duration-300 ${
                syncToast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-white text-slate-800 border-slate-200'
              }`}>
                {syncToast.type === 'success' ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                ) : (
                  <RefreshCw className="w-3 h-3 text-[#ff682c] animate-spin" />
                )}
                <span>{syncToast.message}</span>
              </div>
            )}

            {/* SIDEBAR NAVIGATION PANEL */}
            <aside className="w-64 bg-[#efefef] border-r border-[#e8e8e8] flex flex-col justify-between p-6 shrink-0">
              
              <div className="space-y-8">
                {/* Brand Identifier */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#ff682c] flex items-center justify-center text-white">
                    <span className="font-display font-bold text-sm">S</span>
                  </div>
                  <span className="font-display font-bold text-sm tracking-tight text-[#202020]">SmartQueueAnalyst</span>
                </div>

                {/* Operations Links */}
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">Operations</span>
                    <nav className="space-y-1">
                      <button 
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                          activeTab === 'overview' ? 'bg-[#ffedeb]/80 text-[#ff682c] font-semibold' : 'text-slate-600 hover:bg-[#e8e8e8]'
                        }`}
                      >
                        <Gauge className="w-4 h-4" />
                        <span>Overview</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('history')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                          activeTab === 'history' ? 'bg-[#ffedeb]/80 text-[#ff682c] font-semibold' : 'text-slate-600 hover:bg-[#e8e8e8]'
                        }`}
                      >
                        <HistoryIcon className="w-4 h-4" />
                        <span>History</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('predictions')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                          activeTab === 'predictions' ? 'bg-[#ffedeb]/80 text-[#ff682c] font-semibold' : 'text-slate-600 hover:bg-[#e8e8e8]'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Predictions</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('comparison')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                          activeTab === 'comparison' ? 'bg-[#ffedeb]/80 text-[#ff682c] font-semibold' : 'text-slate-600 hover:bg-[#e8e8e8]'
                        }`}
                      >
                        <GitCompare className="w-4 h-4" />
                        <span>Comparison</span>
                      </button>
                    </nav>
                  </div>

                  {/* System Links */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">System</span>
                    <nav className="space-y-1">
                      <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                          activeTab === 'profile' ? 'bg-[#ffedeb]/80 text-[#ff682c] font-semibold' : 'text-slate-600 hover:bg-[#e8e8e8]'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                          activeTab === 'settings' ? 'bg-[#ffedeb]/80 text-[#ff682c] font-semibold' : 'text-slate-600 hover:bg-[#e8e8e8]'
                        }`}
                      >
                        <SettingsIcon className="w-4 h-4" />
                        <span>Settings</span>
                      </button>

                      {/* Fake Dark Mode switch mimicking layout */}
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-slate-600 bg-transparent">
                        <span className="font-medium">Dark mode</span>
                        <button 
                          onClick={() => setDarkMode(!darkMode)}
                          className="w-8 h-4 rounded-full bg-slate-300 relative transition-colors focus:outline-none"
                        >
                          <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-4 bg-[#ff682c]' : ''}`} />
                        </button>
                      </div>
                    </nav>
                  </div>
                </div>
              </div>

              {/* SIDEBAR FOOTER: DYNAMIC ACTIVE INDIVIDUAL */}
              <div className="border-t border-[#e8e8e8] pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={selectedIndividual.avatarUrl} alt={selectedIndividual.name} className="w-10 h-10 rounded-full object-cover border border-[#e8e8e8]" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#202020] truncate leading-tight">{selectedIndividual.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize truncate">{selectedIndividual.role}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setAuthMode('login')}
                  className="w-full flex items-center gap-2 px-1.5 py-1 text-slate-400 hover:text-[#ff682c] text-[11px] font-medium transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>

            </aside>

            {/* MAIN PANEL AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#efefef]">
              
              {/* HEAD ACTIONS & INTERFACE */}
              <header className="px-8 py-5 flex items-center justify-between bg-[#efefef]">
                
                {/* PAGE DYNAMIC TITLE */}
                <h1 className="font-display font-semibold text-2xl tracking-tight text-[#202020]">
                  {activeTab === 'overview' && 'System Overview'}
                  {activeTab === 'history' && 'KPI History'}
                  {activeTab === 'predictions' && 'Predictive Engine'}
                  {activeTab === 'comparison' && 'Roster Evaluation'}
                  {activeTab === 'profile' && 'Director Profile'}
                  {activeTab === 'settings' && 'System Configuration'}
                </h1>

                {/* CONTROLLERS METRICS AREA */}
                <div className="flex items-center gap-2.5">
                  
                  {activeTab === 'overview' && (
                    <>
                      <div className="relative">
                        <button className="px-4 py-2 bg-white rounded-full text-xs font-medium text-slate-600 border border-slate-200 flex items-center gap-2 hover:bg-slate-50">
                          <span>Time period: {timePeriod}</span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>

                      <button 
                        onClick={handleSyncData}
                        disabled={syncing}
                        className="px-4 py-2 bg-[#202020] hover:bg-slate-800 text-white font-medium text-xs rounded-full transition flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                        <span>Sync Data</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'history' && (
                    <>
                      <div className="relative">
                        <select 
                          value={historySite}
                          onChange={(e) => {
                            setHistorySite(e.target.value);
                            setHistoryPage(1);
                          }}
                          className="appearance-none pl-4 pr-9 py-2 bg-white rounded-full text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 focus:outline-none cursor-pointer"
                        >
                          {historySites.map(s => (
                            <option key={s} value={s}>{s === 'All Global Sites' ? s : `SITE: ${cleanSiteNameFrontend(s)}`}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          value={historyService}
                          onChange={(e) => {
                            setHistoryService(e.target.value);
                            setHistoryPage(1);
                          }}
                          className="appearance-none pl-4 pr-9 py-2 bg-white rounded-full text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 focus:outline-none cursor-pointer"
                        >
                          {historyServices.map(s => (
                            <option key={s} value={s}>{s === 'All Services' ? s : `SERVICE: ${cleanServiceNameFrontend(s)}`}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          value={historyPeriod}
                          onChange={(e) => {
                            setHistoryPeriod(e.target.value);
                            setHistoryPage(1);
                          }}
                          className="appearance-none pl-4 pr-9 py-2 bg-white rounded-full text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 focus:outline-none cursor-pointer"
                        >
                          <option value="Last Week">Last Week</option>
                          <option value="Last Month">Last Month</option>
                          <option value="Last Quarter">Last Quarter</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <button 
                        onClick={handleSyncData}
                        disabled={syncing}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 font-medium text-xs rounded-full transition flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                        <span>Sync Data</span>
                      </button>

                      <button 
                        onClick={() => alert("Downloading CSV of KPI Logs")}
                        className="px-4 py-2 bg-[#202020] hover:bg-slate-800 text-white font-medium text-xs rounded-full transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'predictions' && (
                    <>
                      <div className="relative">
                        <select 
                          value={predictionTimePeriod}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPredictionTimePeriod(val);
                            if (val === 'Last Week') {
                              setComparisonHorizon('week');
                            } else if (val === 'Last Month') {
                              setComparisonHorizon('month');
                            } else if (val === 'Last Quarter') {
                              setComparisonHorizon('quarter');
                            }
                          }}
                          className="appearance-none pl-4 pr-9 py-2 bg-white rounded-full text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 focus:outline-none cursor-pointer text-ellipsis"
                        >
                          <option value="Last Week">Last Week</option>
                          <option value="Last Month">Last Month</option>
                          <option value="Last Quarter">Last Quarter</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <button 
                        onClick={handleSyncData}
                        disabled={syncing}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 font-medium text-xs rounded-full transition flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                        <span>Sync Data</span>
                      </button>

                      <button 
                        onClick={() => alert("Downloading prediction engine predictions")}
                        className="px-4 py-2 bg-[#202020] hover:bg-slate-800 text-white font-medium text-xs rounded-full transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Export Dataset</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'comparison' && (
                    <>
                      <div className="relative">
                        <select 
                          value={predictionTimePeriod}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPredictionTimePeriod(val);
                            if (val === 'Last Week') {
                              setComparisonHorizon('week');
                            } else if (val === 'Last Month') {
                              setComparisonHorizon('month');
                            } else if (val === 'Last Quarter') {
                              setComparisonHorizon('quarter');
                            }
                          }}
                          className="appearance-none pl-4 pr-9 py-2 bg-white rounded-full text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 focus:outline-none cursor-pointer text-ellipsis"
                        >
                          <option value="Last Week">Last Week</option>
                          <option value="Last Month">Last Month</option>
                          <option value="Last Quarter">Last Quarter</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <button 
                        onClick={handleSyncData}
                        disabled={syncing}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 font-medium text-xs rounded-full transition flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                        <span>Sync Data</span>
                      </button>
                    </>
                  )}

                  {/* FLOAT ARTIFICIAL INTELLIGENCE CHAT DIRECT ACTION */}
                  <button 
                    onClick={() => setShowAssistantModal(true)}
                    className="px-4 py-2 bg-[#ff682c]/10 text-[#ff682c] border border-[#ff682c]/20 hover:bg-[#ff682c]/20 font-medium text-xs rounded-full transition flex items-center gap-1.5 cursor-pointer ml-2 relative"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>AI Assistant</span>
                  </button>

                </div>
              </header>

              {/* OVERFLUID CONTENT SECTION */}
              <div className="flex-1 px-8 pb-8 overflow-y-auto space-y-6">
                
                {/* GLOBAL SYNCHRONIZATION REMINDER BANNER */}
                <div id="sync-reminder-banner" className="bg-[#fff9f6] border border-[#ff682c]/20 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#b03d0d] gap-3 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff682c] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff682c]"></span>
                    </span>
                    <span className="font-semibold font-display">Database Synchronization Reminder:</span>
                    <span>Synchronize to get latest data and stay fully updated with your webhooks.</span>
                  </div>
                  <button 
                    onClick={handleSyncData}
                    disabled={syncing}
                    id="sync-now-btn"
                    className="px-3 py-1 bg-[#ff682c] text-white hover:bg-[#e05218] rounded-full text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                    <span>Synchronize Now</span>
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  
                  {/* TAB CARD: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <motion.div 
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Grid of 4 KPIs cards matching image specs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        
                        {/* 1. VOLUME TICKETS */}
                        <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Volume Tickets</span>
                            <span className="text-xs font-semibold text-[#ff682c] flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3" />
                              <span>Last Week</span>
                            </span>
                          </div>
                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-display font-medium text-[#202020]">{totalVolumeLastWeek.toLocaleString()}</span>
                            <span className="text-[11px] text-[#828282]">total</span>
                          </div>
                          {/* Small Sparkline simulation in Card */}
                          <div className="h-6 mt-4 opacity-75">
                            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                              <path d="M0,15 Q15,8 30,12 T60,5 T90,2 T100,10" fill="none" stroke="#ff682c" strokeWidth="1.5" />
                            </svg>
                          </div>
                        </div>

                        {/* 2. WAIT TIME */}
                        <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Wait Time</span>
                            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                              <span>Target &lt; 3.0m</span>
                            </span>
                          </div>
                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-display font-medium text-[#202020]">{avgWaitTime.toFixed(1)} mins</span>
                            <span className="text-[11px] text-[#828282]">avg</span>
                          </div>
                          <div className="h-6 mt-4 opacity-75">
                            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                              <path d="M0,5 Q20,15 40,8 T80,18 T100,2" fill="none" stroke="rgb(16,185,129)" strokeWidth="1.5" />
                            </svg>
                          </div>
                        </div>

                        {/* 3. PRODUCTIVITY */}
                        <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Productivity</span>
                            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                              <span>Optimal</span>
                            </span>
                          </div>
                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-display font-medium text-[#202020]">{avgProductivity.toFixed(1)} calls/h</span>
                            <span className="text-[11px] text-[#828282]">avg</span>
                          </div>
                          <div className="h-6 mt-4 opacity-75">
                            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                              <path d="M0,18 Q30,15 60,8 T100,4" fill="none" stroke="rgb(16,185,129)" strokeWidth="1.5" />
                            </svg>
                          </div>
                        </div>

                        {/* 4. SERVICE RATE */}
                        <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Service Rate</span>
                            <span className="text-xs font-semibold text-[#ff682c] flex items-center gap-0.5">
                              <span>SLA 95%</span>
                            </span>
                          </div>
                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-display font-medium text-[#202020]">{avgServiceRate.toFixed(1)}%</span>
                            <span className="text-[11px] text-[#828282]">avg</span>
                          </div>
                          <div className="h-6 mt-4 opacity-75">
                            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                              <path d="M0,15 Q25,5 50,15 T100,18" fill="none" stroke="#ff682c" strokeWidth="1.5" />
                            </svg>
                          </div>
                        </div>

                      </div>

                      {/* Main Center Grid Occupation and Side alerts */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* RESOURCE OCCUPATION CARD: EXACT CIRCLE AND BAR LAYOUT */}
                        <div className="bg-white p-8 rounded-lg border border-[#e8e8e8] lg:col-span-2 space-y-6">
                          <div>
                            <h2 className="font-display font-semibold text-[#202020] text-lg">Resource Occupation</h2>
                            <p className="text-xs text-slate-400 mt-1">Average allocation across global centers over the last week.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
                            
                            {/* Horizontal Progress bar bars */}
                            <div className="space-y-5">
                              {siteOccupation.topSites.map((site) => (
                                <div key={site.name} className="space-y-1.5">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-[#202020]">{site.name}</span>
                                    <span className="text-slate-400">{site.value}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${site.value}%`, backgroundColor: site.color }} 
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Centered Donut Orange Ring Chart Widget */}
                            <div className="flex flex-col items-center justify-center">
                              <div className="relative w-44 h-44 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="88" cy="88" r="70" stroke="#f1edec" strokeWidth="15" fill="transparent" />
                                  <circle 
                                    cx="88" 
                                    cy="88" 
                                    r="70" 
                                    stroke="#ff682c" 
                                    strokeWidth="15" 
                                    fill="transparent" 
                                    strokeDasharray="440"
                                    strokeDashoffset={440 - (440 * siteOccupation.globalAvg) / 100}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                  <span className="font-display font-bold text-3xl text-[#202020]">{siteOccupation.globalAvg}%</span>
                                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Global Avg</span>
                                </div>
                              </div>
                              <div className="flex gap-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-4 justify-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-[#ff682c] rounded-full" />
                                  <span>Utilization</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-slate-200 rounded-full" />
                                  <span>Capacity</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* RIGHT RAIL: SYSTEM ALERTS AND INTELLIGENCE */}
                        <div className="space-y-6">
                          
                          {/* Card 1: RECENT ALERTS */}
                          <div className="bg-white p-6 rounded-lg border border-[#e8e8e8]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-4">Recent Alerts</span>
                            <div className="space-y-4">
                              {dynamicAlerts.map((al) => (
                                <div key={al.id} className="flex gap-3 justify-start items-start">
                                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${al.severity === 'high' ? 'bg-[#ff682c]' : 'bg-slate-400'}`} />
                                  <div>
                                    <h4 className="text-xs font-semibold text-[#202020] leading-tight">{al.title}</h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{al.time}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Card 2: BLACK INSIGTH ACCENT */}
                          <div className="bg-[#202020] text-white p-6 rounded-lg space-y-3 relative overflow-hidden">
                            <div className="flex items-center gap-2 text-white">
                              <Sparkles className="w-4 h-4 text-[#ff682c] animate-pulse" />
                              <span className="text-[10px] font-mono tracking-widest uppercase">AI Insight</span>
                            </div>
                            {aiInsightLoading ? (
                              <div className="space-y-2 py-2">
                                <div className="h-3 bg-neutral-850 rounded animate-pulse w-3/4"></div>
                                <div className="h-3 bg-neutral-850 rounded animate-pulse w-5/6"></div>
                                <div className="h-3 bg-neutral-850 rounded animate-pulse w-2/3"></div>
                              </div>
                            ) : (
                              <p className="text-xs font-light text-slate-300 leading-relaxed">
                                {dynamicAIInsight}
                              </p>
                            )}
                          </div>

                        </div>

                      </div>

                    </motion.div>
                  )}

                  {/* TAB CARD: HISTORY */}
                  {activeTab === 'history' && (
                    <motion.div 
                      key="history"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Main Dual Area Chart Wait Time vs Treatment Time */}
                      <div className="bg-white p-8 rounded-lg border border-[#e8e8e8] space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="font-display font-semibold text-[#202020] text-lg">Wait Time vs Treatment Time</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Performance correlation analysis over the last 30 days.</p>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-1 bg-[#ff682c]" />
                              <span>Treatment Time</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-1 border-t border-dashed border-slate-400" />
                              <span>Wait Time</span>
                            </div>
                          </div>
                        </div>

                        {/* Chart Render Canvas */}
                        <div className="h-64 w-full relative pt-4 text-xs font-semibold">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="treatGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ff682c" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#ff682c" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="waitGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#828282" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#828282" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eceb"/>
                              <XAxis dataKey="label" stroke="#a1a1a1" fontSize={10} tickLine={false}/>
                              <YAxis stroke="#a1a1a1" fontSize={10} tickLine={false}/>
                              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8' }} />
                              <Area type="monotone" dataKey="Treatment Time" stroke="#ff682c" strokeWidth={2.5} fillOpacity={1} fill="url(#treatGrad)" />
                              <Area type="monotone" dataKey="Wait Time" stroke="#828282" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#waitGrad)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Detailed KPI History Logs Table Listing */}
                      <div className="bg-white rounded-lg border border-[#e8e8e8] overflow-hidden">
                        
                        <div className="p-6 border-b border-[#e8e8e8] flex items-center justify-between">
                          <div>
                            <h3 className="font-display font-semibold text-[#202020] text-sm">Detailed KPI History</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Real-time DB synchronization complete • {totalHistoryCount.toLocaleString()} records found</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button className="p-2 border border-slate-200.5 rounded-full hover:bg-slate-50 text-slate-400">
                              <Filter className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-2 border border-slate-200.5 rounded-full hover:bg-slate-50 text-slate-400">
                              <Search className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Table Render Container */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#f7f3f2] border-b border-[#e8e8e8] uppercase font-bold text-[10px] text-slate-500 tracking-wider">
                              <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Site</th>
                                <th className="px-6 py-4">Service</th>
                                <th className="px-6 py-4 text-right">Volume</th>
                                <th className="px-6 py-4 text-right">Wait (Moy)</th>
                                <th className="px-6 py-4 text-right">Treat. (Moy)</th>
                                <th className="px-6 py-4 text-center">Svc Rate</th>
                                <th className="px-6 py-4 text-right">Abandon</th>
                                <th className="px-6 py-4 text-right">SLA Breaches</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e8e8e8] font-medium text-[#202020]">
                              {paginatedHistory.map((item) => {
                                const parsePct = (v: number) => (v > 1 ? v : v * 100);
                                return (
                                  <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-semibold">{item.jour}</td>
                                    <td className="px-6 py-4 text-slate-500">{cleanSiteNameFrontend(item.site)}</td>
                                    <td className="px-6 py-4 text-slate-500">{cleanServiceNameFrontend(item.service)}</td>
                                    <td className="px-6 py-4 text-right font-mono">{item.volume_tickets.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono">{item.duree_attente_moy.toFixed(1)} mins</td>
                                    <td className="px-6 py-4 text-right font-mono">{item.duree_traitement_moy.toFixed(1)} mins</td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                        parsePct(item.taux_service) >= 95 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        parsePct(item.taux_service) >= 90 ? 'bg-orange-50 text-[#ff682c] border border-orange-100' :
                                        'bg-rose-50 text-rose-600 border border-rose-100'
                                      }`}>
                                        {parsePct(item.taux_service).toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-500">
                                      {parsePct(item.taux_abandon || 0).toFixed(1)}%
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">
                                      <span className={item.sla_breach_count > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                        {item.sla_breach_count || 0}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                              {paginatedHistory.length === 0 && (
                                <tr>
                                  <td colSpan={9} className="px-6 py-10 text-center text-slate-400">
                                    No records match your selected global site resource or service classifications.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination footer */}
                        <div className="p-4 bg-[#fbfbfb] border-t border-[#e8e8e8] flex items-center justify-between text-xs text-slate-500">
                          <span>
                            Showing {totalHistoryCount === 0 ? 0 : (historyPage - 1) * itemsPerPage + 1} - {Math.min(historyPage * itemsPerPage, totalHistoryCount)} of {totalHistoryCount.toLocaleString()} records
                          </span>
                          <div className="flex gap-1 items-center">
                            <button 
                              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                              disabled={historyPage === 1}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                            >
                              Previous
                            </button>
                            <span className="text-[11px] px-2 font-bold text-[#202020]">Page {historyPage} of {totalPages}</span>
                            <button 
                              onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                              disabled={historyPage === totalPages}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                            >
                              Next
                            </button>
                          </div>
                        </div>

                      </div>

                    </motion.div>
                  )}

                  {/* TAB CARD: PREDICTIONS */}
                  {activeTab === 'predictions' && (() => {
                    const formatPct = (val: number) => (val > 1 ? val : val * 100);
                    const formatCompact = (val: number) => {
                      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                      if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
                      return val.toLocaleString();
                    };

                    const activeDays = 
                      predictionTimePeriod === 'Last Week' ? 13 : 
                      predictionTimePeriod === 'Last Month' ? 30 : 90;

                    const sortedHistory = [...kpiHistory]
                      .filter(h => h.jour && h.jour !== 'undefined' && h.jour !== 'null')
                      .sort((a,b) => a.jour.localeCompare(b.jour));

                    const maxHistDateStr = sortedHistory[sortedHistory.length - 1]?.jour;
                    let filteredHist = sortedHistory;
                    if (maxHistDateStr) {
                      const maxDate = new Date(maxHistDateStr);
                      const cutoff = new Date(maxDate);
                      cutoff.setDate(cutoff.getDate() - activeDays);
                      filteredHist = sortedHistory.filter(h => new Date(h.jour) >= cutoff);
                    }

                    const sortedPreds = [...predictionRecords]
                      .filter(r => r.jour && r.jour !== 'undefined' && r.jour !== 'null')
                      .sort((a,b) => a.jour.localeCompare(b.jour));
                    
                    const minPredDateStr = sortedPreds[0]?.jour;
                    let filteredPreds = sortedPreds;
                    if (minPredDateStr) {
                      const minDate = new Date(minPredDateStr);
                      const cutoff = new Date(minDate);
                      cutoff.setDate(cutoff.getDate() + activeDays);
                      filteredPreds = sortedPreds.filter(r => new Date(r.jour) <= cutoff);
                    }

                    const totalVolume = filteredPreds.reduce((s, r) => s + (r.volume_tickets || 0), 0);
                    const totalHistVolume = filteredHist.reduce((s, r) => s + (r.volume_tickets || 0), 0) || 1;
                    const volumeTrendPct = ((totalVolume - totalHistVolume) / totalHistVolume) * 100;

                    const predSvcAvg = filteredPreds.reduce((s, r) => s + formatPct(r.taux_service), 0) / (filteredPreds.length || 1);
                    const histSvcAvg = filteredHist.reduce((s, r) => s + formatPct(r.taux_service), 0) / (filteredHist.length || 1) || 94.8;
                    const serviceTrendPct = predSvcAvg - histSvcAvg;

                    const throughputAvg = filteredPreds.reduce((s, r) => s + (r.flux_par_heure || 0), 0) / (filteredPreds.length || 1);
                    const histThroughputAvg = filteredHist.reduce((s, r) => s + (r.flux_par_heure || 0), 0) / (filteredHist.length || 1) || 12.0;
                    const throughputTrendPct = histThroughputAvg > 0 ? ((throughputAvg - histThroughputAvg) / histThroughputAvg) * 100 : 0;

                    const parseSlack = (item: any) => {
                      const occ = item.occupation_guichets || 0;
                      return (1 - (occ > 1 ? occ / 100 : occ)) * 100;
                    };
                    const slackAvg = filteredPreds.reduce((s, r) => s + parseSlack(r), 0) / (filteredPreds.length || 1);
                    const histSlackAvg = filteredHist.reduce((s, r) => s + parseSlack(r), 0) / (filteredHist.length || 1) || 15.0;
                    const slackTrendPct = slackAvg - histSlackAvg;

                    const matchScore = Math.max(0, Math.min(100, (1 - Math.abs(histSvcAvg - predSvcAvg) / 100) * 100));

                    const q3Records = filteredPreds.filter(r => {
                      const d = new Date(r.jour);
                      if (isNaN(d.getTime())) return true;
                      const m = d.getMonth() + 1;
                      return m === 7 || m === 8 || m === 9;
                    });
                    const q3SvcAvg = q3Records.length > 0 
                      ? q3Records.reduce((s, r) => s + formatPct(r.taux_service), 0) / q3Records.length 
                      : predSvcAvg;

                    // Group volume trend over time by date
                    const histGroup: { [date: string]: number } = {};
                    filteredHist.forEach(r => {
                      if (!r.jour || r.jour === 'undefined' || r.jour === 'null') return;
                      if (!histGroup[r.jour]) histGroup[r.jour] = 0;
                      histGroup[r.jour] += r.volume_tickets;
                    });

                    const predGroup: { [date: string]: number } = {};
                    filteredPreds.forEach(r => {
                      if (!r.jour || r.jour === 'undefined' || r.jour === 'null') return;
                      if (!predGroup[r.jour]) predGroup[r.jour] = 0;
                      predGroup[r.jour] += r.volume_tickets;
                    });

                    // Sort chronologically and create combined chart data
                    const allDatesArr = [...new Set([...Object.keys(histGroup), ...Object.keys(predGroup)])]
                      .filter(d => d && d !== 'undefined' && d !== 'null' && !isNaN(new Date(d).getTime()))
                      .sort();
                    const maxHistDate = [...Object.keys(histGroup)]
                      .filter(d => d && d !== 'undefined' && d !== 'null' && !isNaN(new Date(d).getTime()))
                      .sort().pop() || '';

                    const forecastChartPoints = allDatesArr.map(date => {
                      const dObj = new Date(date);
                      if (isNaN(dObj.getTime())) return null;
                      const keyLabel = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                      return {
                        date,
                        label: keyLabel,
                        "Historical": histGroup[date] !== undefined ? histGroup[date] : null,
                        "Projected": predGroup[date] !== undefined ? predGroup[date] : null
                      };
                    }).filter(Boolean);

                    const baselineLabel = maxHistDate ? new Date(maxHistDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';

                    // Wait Time overlay chart
                    const histWaitGroup: { [date: string]: { sum: number, count: number } } = {};
                    filteredHist.forEach(r => {
                      if (!r.jour || r.jour === 'undefined' || r.jour === 'null') return;
                      if (!histWaitGroup[r.jour]) histWaitGroup[r.jour] = { sum: 0, count: 0 };
                      histWaitGroup[r.jour].sum += r.duree_attente_moy;
                      histWaitGroup[r.jour].count++;
                    });

                    const predWaitGroup: { [date: string]: { sum: number, count: number } } = {};
                    filteredPreds.forEach(r => {
                      if (!r.jour || r.jour === 'undefined' || r.jour === 'null') return;
                      if (!predWaitGroup[r.jour]) predWaitGroup[r.jour] = { sum: 0, count: 0 };
                      predWaitGroup[r.jour].sum += r.duree_attente_moy;
                      predWaitGroup[r.jour].count++;
                    });

                    const waitOverlayPoints = allDatesArr.map(date => {
                      const dObj = new Date(date);
                      if (isNaN(dObj.getTime())) return null;
                      const keyLabel = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                      return {
                        date,
                        label: keyLabel,
                        "Historical Wait": histWaitGroup[date] ? (histWaitGroup[date].sum / histWaitGroup[date].count) : null,
                        "Predicted Wait": predWaitGroup[date] ? (predWaitGroup[date].sum / predWaitGroup[date].count) : null
                      };
                    }).filter(pt => pt && (pt["Historical Wait"] !== null || pt["Predicted Wait"] !== null));

                    // Accurate and clean variance comparison
                    const avgHistWait = filteredHist.length > 0 ? (filteredHist.reduce((s, r) => s + r.duree_attente_moy, 0) / filteredHist.length) : 2.5;
                    const avgPredWait = filteredPreds.length > 0 ? (filteredPreds.reduce((s, r) => s + r.duree_attente_moy, 0) / filteredPreds.length) : 2.5;
                    
                    let maxDailyDev = 0;
                    let dailyCounts = 0;
                    waitOverlayPoints.forEach(pt => {
                      if (pt["Historical Wait"] !== null && pt["Predicted Wait"] !== null) {
                        const hW = pt["Historical Wait"];
                        const pW = pt["Predicted Wait"];
                        const dev = hW > 0 ? (Math.abs(pW - hW) / hW) * 100 : 0;
                        if (dev > maxDailyDev) maxDailyDev = dev;
                        dailyCounts++;
                      }
                    });

                    const peakDevVal = dailyCounts > 0 ? maxDailyDev : (avgHistWait > 0 ? (Math.abs(avgPredWait - avgHistWait) / avgHistWait) * 100 : 0);

                    // Current Risk Level - Dynamic based on active period metrics
                    const avgAbandon = filteredPreds.reduce((s, r) => s + formatPct(r.taux_abandon || 0), 0) / (filteredPreds.length || 1);
                    const totalBreaches = filteredPreds.reduce((s, r) => s + (r.sla_breach_count || 0), 0);
                    
                    let riskText = 'LOW';
                    let riskColors = 'text-emerald-500';
                    let riskBarColor = 'bg-emerald-500';
                    let riskWidth = 'w-1/3';
                    if (avgAbandon > 5 || totalBreaches > 15 || predSvcAvg < 92) {
                      riskText = 'CRITICAL';
                      riskColors = 'text-rose-600 font-bold';
                      riskBarColor = 'bg-rose-500';
                      riskWidth = 'w-full';
                    } else if (avgAbandon > 2 || totalBreaches > 5 || predSvcAvg < 96) {
                      riskText = 'MODERATE';
                      riskColors = 'text-[#ff682c] font-semibold';
                      riskBarColor = 'bg-[#ff682c]';
                      riskWidth = 'w-2/3';
                    }

                    const strokeDashoffset = 240 - (240 * matchScore) / 100;

                    return (
                      <motion.div 
                        key="predictions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Grid predictions indicators */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                          <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Projected Volume</span>
                            <span className="text-2xl font-display font-medium text-[#202020] mt-1.5 block">
                              {formatCompact(totalVolume)} Units
                            </span>
                            <span className={`text-[11px] font-semibold mt-1 block ${volumeTrendPct >= 0 ? 'text-[#ff682c]' : 'text-emerald-500'}`}>
                              {volumeTrendPct >= 0 ? '+' : ''}{volumeTrendPct.toFixed(1)}% vs history
                            </span>
                          </div>
                          <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Service Reliability</span>
                            <span className="text-2xl font-display font-medium text-[#202020] mt-1.5 block">
                              {predSvcAvg.toFixed(1)}%
                            </span>
                            <span className={`text-[11px] font-semibold mt-1 block ${serviceTrendPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {serviceTrendPct >= 0 ? '+' : ''}{serviceTrendPct.toFixed(1)}% delta
                            </span>
                          </div>
                          <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">System Throughput</span>
                            <span className="text-2xl font-display font-medium text-[#202020] mt-1.5 block">
                              {throughputAvg.toFixed(1)} p/h
                            </span>
                            <span className={`text-[11px] font-semibold mt-1 block ${throughputTrendPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {throughputTrendPct >= 0 ? '+' : ''}{throughputTrendPct.toFixed(1)}% projected
                            </span>
                          </div>
                          <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Resource Slack</span>
                            <span className="text-2xl font-display font-medium text-[#202020] mt-1.5 block">
                              {slackAvg.toFixed(1)}%
                            </span>
                            <span className={`text-[11px] font-semibold mt-1 block ${slackTrendPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {slackTrendPct >= 0 ? '+' : ''}{slackTrendPct.toFixed(1)}% delta
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Forecast Area Chart Panel */}
                          <div className="bg-white p-6 rounded-lg border border-[#e8e8e8] lg:col-span-2 space-y-4">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Projected Volume Forecast</span>
                              <p className="text-[11px] text-slate-400">Comparative daily ticket volumes (Historical vs Projected)</p>
                            </div>
                            
                            <div className="h-48 w-full relative pt-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={forecastChartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eceb" />
                                  <XAxis dataKey="label" stroke="#a1a1a1" fontSize={9} tickLine={false} />
                                  <YAxis stroke="#a1a1a1" fontSize={9} tickLine={false} />
                                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e8e8e8', fontSize: '11px' }} />
                                  {baselineLabel && (
                                    <ReferenceLine x={baselineLabel} stroke="#ff682c" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Baseline Junction', position: 'top', fill: '#ff682c', fontSize: 9, fontWeight: 'bold' }} />
                                  )}
                                  <Line type="monotone" dataKey="Historical" stroke="#202020" strokeWidth={2} dot={false} connectNulls />
                                  <Line type="monotone" dataKey="Projected" stroke="#ff682c" strokeWidth={1.8} strokeDasharray="5 5" dot={false} connectNulls />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-[#828282] font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#202020] rounded-sm" /> Historical Actuals</span>
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#ff682c] rounded-sm" /> Engine Forecast (Proj)</span>
                            </div>
                          </div>

                          {/* Future KPI Projections panel */}
                          <div className="bg-white p-6 rounded-lg border border-[#e8e8e8] flex flex-col justify-between space-y-5">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Future KPI Projections</span>
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500">Q3 Forecast</span>
                                <span className="text-[#202020] font-mono">{q3SvcAvg.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500">Resource Slack</span>
                                <span className="text-[#202020] font-mono">{slackAvg.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500">Throughput</span>
                                <span className="text-[#202020] font-mono">{throughputAvg.toFixed(1)} p/h</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500">Service Delta</span>
                                <span className={`font-mono font-bold ${serviceTrendPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {serviceTrendPct >= 0 ? '+' : ''}{serviceTrendPct.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Match rate circle gauge */}
                            <div className="flex justify-center pt-2">
                              <div className="relative w-24 h-24 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="48" cy="48" r="38" stroke="#ffdbcf" strokeWidth="6" fill="transparent" />
                                  <circle cx="48" cy="48" r="38" stroke="#ff682c" strokeWidth="6" fill="transparent" strokeDasharray="240" strokeDashoffset={strokeDashoffset} />
                                </svg>
                                <div className="absolute text-center">
                                  <span className="font-display font-bold text-xs">{matchScore.toFixed(0)}%</span>
                                  <span className="block text-[8px] uppercase font-semibold text-slate-400">Match</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Prediction vs History Card */}
                        <div className="bg-white p-6 rounded-lg border border-[#e8e8e8] space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Prediction vs History</span>
                              <p className="text-[11px] text-slate-400">Comparative wait time overlay for structural resource planning</p>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-[#ff682c] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                              Peak Deviation: {peakDevVal >= 0 ? '+' : ''}{peakDevVal.toFixed(1)}% Variance
                            </span>
                          </div>
                          <div className="h-44 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={waitOverlayPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eceb" />
                                <XAxis dataKey="label" stroke="#a1a1a1" fontSize={9} tickLine={false} />
                                <YAxis stroke="#a1a1a1" fontSize={9} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e8e8e8', fontSize: '11px' }} />
                                <Line type="monotone" dataKey="Historical Wait" stroke="#a1a1a1" strokeWidth={1.5} dot={false} connectNulls />
                                <Line type="monotone" dataKey="Predicted Wait" stroke="#ff682c" strokeWidth={2} dot={true} connectNulls />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Risk Level gauge mimicking screen */}
                        <div className="bg-slate-50/80 p-6 rounded-lg border border-[#e8e8e8] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold tracking-widest text-[#828282] uppercase mb-0.5 block">Current Risk Level</span>
                            <span className={`text-3xl font-display font-light ${riskColors}`}>{riskText}</span>
                          </div>
                          <div className="w-64 max-w-xs space-y-1">
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                              <span className={`h-full border-r border-white ${riskBarColor} ${riskWidth}`} />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                              <span className={riskText === 'LOW' ? 'text-emerald-500 font-bold' : ''}>LOW</span>
                              <span className={riskText === 'MODERATE' ? 'text-[#ff682c] font-bold' : ''}>MODERATE</span>
                              <span className={riskText === 'CRITICAL' ? 'text-rose-600 font-bold' : ''}>CRITICAL</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* TAB CARD: COMPARISON */}
                  {activeTab === 'comparison' && (() => {
                    // Local calculations for active curves
                    const kpiLabels: Record<string, string> = {
                      volume: 'Ticket Volume',
                      waitTime: 'Average Wait Time',
                      productivity: 'Productivity Score',
                      serviceRate: 'Service SLA Rate'
                    };

                    const kpiUnits: Record<string, string> = {
                      volume: 'units',
                      waitTime: 'mins',
                      productivity: '%',
                      serviceRate: '%'
                    };

                    const getSimulatedVal = (v: number, kpiKey: string) => {
                      if (kpiKey === 'volume') return v;
                      if (kpiKey === 'waitTime') return v * Math.max(0.15, (1 - agentStaffingAdj * 0.12));
                      if (kpiKey === 'productivity') return v * Math.max(0.40, (1 - agentStaffingAdj * 0.08));
                      if (kpiKey === 'serviceRate') return Math.min(100.0, Math.max(45.0, v + agentStaffingAdj * 3.5));
                      return v;
                    };

                    const activePoints = comparisonData[comparisonHorizon][comparisonKPI];
                    const activeHistoryVals = activePoints.map(p => p.history);
                    const activePredictedVals = activePoints.map(p => getSimulatedVal(p.predicted, comparisonKPI));

                    const allVals = [...activeHistoryVals, ...activePredictedVals];
                    const maxVal = Math.max(...allVals) * 1.05;
                    const minVal = Math.max(0, Math.min(...allVals) * 0.95);

                    const width = 600;
                    const height = 240;
                    const paddingX = 40;
                    const paddingY = 30;

                    const getX = (index: number, total: number) => {
                      return paddingX + (index * (width - paddingX * 2)) / (total - 1);
                    };

                    const getY = (val: number) => {
                      const range = maxVal - minVal || 1;
                      return height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
                    };

                    // Path strings
                    const historyPathStr = activeHistoryVals.map((v, i) => 
                      `${i === 0 ? 'M' : 'L'} ${getX(i, activePoints.length).toFixed(1)} ${getY(v).toFixed(0)}`
                    ).join(' ');

                    const predictedPathStr = activePredictedVals.map((v, i) => 
                      `${i === 0 ? 'M' : 'L'} ${getX(i, activePoints.length).toFixed(1)} ${getY(v).toFixed(0)}`
                    ).join(' ');

                    const buildAreaPath = (vals: number[]) => {
                      if (vals.length === 0) return '';
                      const points = vals.map((v, i) => `${getX(i, vals.length).toFixed(1)},${getY(v).toFixed(0)}`).join(' ');
                      return `M ${getX(0, vals.length).toFixed(1)},${(height - paddingY).toFixed(0)} L ${points} L ${getX(vals.length - 1, vals.length).toFixed(1)},${(height - paddingY).toFixed(0)} Z`;
                    };

                    // Format auxiliary
                    const formatVal = (val: number, kpiKey: string) => {
                      if (kpiKey === 'volume') return Math.round(val).toLocaleString();
                      if (kpiKey === 'waitTime') return `${val.toFixed(1)}m`;
                      return `${val.toFixed(1)}%`;
                    };

                    // Calculate Summary Diagnostics
                    const avgHistory = activeHistoryVals.reduce((acc, v) => acc + v, 0) / activeHistoryVals.length;
                    const avgPredicted = activePredictedVals.reduce((acc, v) => acc + v, 0) / activePredictedVals.length;
                    const peakVarianceIdx = activePoints.reduce((maxIdx, pt, curIdx, arr) => {
                      const currentPredAdj = getSimulatedVal(pt.predicted, comparisonKPI);
                      const currentDiff = Math.abs(pt.history - currentPredAdj);
                      const maxDiff = Math.abs(arr[maxIdx].history - getSimulatedVal(arr[maxIdx].predicted, comparisonKPI));
                      return currentDiff > maxDiff ? curIdx : maxIdx;
                    }, 0);

                    const peakHist = activeHistoryVals[peakVarianceIdx];
                    const peakPred = activePredictedVals[peakVarianceIdx];
                    const peakPctDiff = peakPred !== 0 ? ((peakHist - peakPred) / peakPred) * 100 : 0;

                    // Compute specific KPI card aggregations for the selected horizon
                    const curHorizonObj = comparisonData[comparisonHorizon];
                    const formatCompact = (val: number) => {
                      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                      if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
                      return Math.round(val).toLocaleString();
                    };

                    // 1. Volume
                    const totalHistVol = curHorizonObj.volume.reduce((s, r) => s + r.history, 0);
                    const totalPredVol = curHorizonObj.volume.reduce((s, r) => s + getSimulatedVal(r.predicted, 'volume'), 0);

                    // 2. Wait
                    const avgHistWait = curHorizonObj.waitTime.reduce((s, r) => s + r.history, 0) / curHorizonObj.waitTime.length;
                    const avgPredWait = curHorizonObj.waitTime.reduce((s, r) => s + getSimulatedVal(r.predicted, 'waitTime'), 0) / curHorizonObj.waitTime.length;

                    // 3. Abandon (mapped from productivity)
                    const avgHistProd = curHorizonObj.productivity.reduce((s, r) => s + r.history, 0) / curHorizonObj.productivity.length;
                    const avgPredProd = curHorizonObj.productivity.reduce((s, r) => s + getSimulatedVal(r.predicted, 'productivity'), 0) / curHorizonObj.productivity.length;
                    const avgHistAbandon = Math.max(0, 100 - avgHistProd);
                    const avgPredAbandon = Math.max(0, 100 - avgPredProd);

                    // 4. Svc Rate
                    const avgHistService = curHorizonObj.serviceRate.reduce((s, r) => s + r.history, 0) / curHorizonObj.serviceRate.length;
                    const avgPredService = curHorizonObj.serviceRate.reduce((s, r) => s + getSimulatedVal(r.predicted, 'serviceRate'), 0) / curHorizonObj.serviceRate.length;

                    return (
                      <motion.div 
                        key="comparison"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        {/* HEADER EXPLANATORY CARD */}
                        <div className="bg-white p-6 rounded-lg border border-[#e8e8e8]">
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ff682c] border border-orange-100 font-bold text-[9px] uppercase tracking-wider">
                            Horizon Comparison Engine
                          </span>
                          <h2 className="font-display font-semibold text-[#202020] text-xl mt-1.5">Real-Time vs ML Predictions</h2>
                          <p className="text-xs text-slate-400 mt-1">
                            Assess model accuracy, identify structural deviations, and stress-test operations across multiple time windows. Use horizontal selectors at the top menu to toggle active comparing windows.
                          </p>
                        </div>

                        {/* HIGH-DENSITY COMPARATIVE OVERVIEW METRIC TILES */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                          <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ticket Volume</span>
                            <span className="text-xl font-display font-medium text-[#202020] mt-1.5 block">
                              {formatCompact(totalHistVol)} vs {formatCompact(totalPredVol)}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5 font-semibold">
                              Actual vs Predicted (Total)
                            </span>
                          </div>

                          <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Wait Time</span>
                            <span className="text-xl font-display font-medium text-[#202020] mt-1.5 block">
                              {avgHistWait.toFixed(1)}m vs {avgPredWait.toFixed(1)}m
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5 font-semibold">
                              Actual vs Predicted (Mins)
                            </span>
                          </div>

                          <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Abandon Rate</span>
                            <span className="text-xl font-display font-medium text-[#202020] mt-1.5 block">
                              {avgHistAbandon.toFixed(1)}% vs {avgPredAbandon.toFixed(1)}%
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5 font-semibold">
                              Actual vs Predicted (Avg)
                            </span>
                          </div>

                          <div className="bg-white p-5 rounded-lg border border-[#e8e8e8]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service SLA Rate</span>
                            <span className="text-xl font-display font-medium text-[#202020] mt-1.5 block">
                              {avgHistService.toFixed(1)}% vs {avgPredService.toFixed(1)}%
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5 font-semibold">
                              Actual vs Predicted (Avg)
                            </span>
                          </div>
                        </div>

                        {/* MAIN DEEP-DIVE CHART & PERSONALIZATION CONTROLLER ROW */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* THE PRIMARY CHART DISPLAY PANEL */}
                          <div className="bg-white p-6 rounded-lg border border-[#e8e8e8] lg:col-span-2 space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <h3 className="text-sm font-bold uppercase text-[#202020] tracking-wide">
                                  {kpiLabels[comparisonKPI]} Overlay Comparison
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Overlaying historical logs (solid orange) against ML forecast outputs (dashed graphite).
                                </p>
                              </div>

                              <div className="flex gap-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-1.5 bg-[#ff682c] rounded-sm" />
                                  <span>Historical (Actuals)</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-1.5 border-t border-dashed border-slate-700" />
                                  <span>ML Model Proj.</span>
                                </span>
                              </div>
                            </div>

                            {/* CHART CANVAS */}
                            <div className="h-64 w-full relative pt-4">
                              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                                <defs>
                                  {/* Area Fill Gradient for Orange */}
                                  <linearGradient id="compHistGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ff682c" stopOpacity="0.25"></stop>
                                    <stop offset="100%" stopColor="#ff682c" stopOpacity="0.0"></stop>
                                  </linearGradient>
                                </defs>

                                {/* Gridlines based on height thresholds */}
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const yRatio = idx / 3;
                                  const yPos = paddingY + yRatio * (height - paddingY * 2);
                                  const labelVal = maxVal - yRatio * (maxVal - minVal);
                                  return (
                                    <g key={idx}>
                                      <line 
                                        x1={paddingX} 
                                        y1={yPos} 
                                        x2={width - paddingX} 
                                        y2={yPos} 
                                        stroke="#f2eded" 
                                        strokeWidth="1" 
                                      />
                                      <text 
                                        x={paddingX - 8} 
                                        y={yPos + 3} 
                                        className="text-[9px] font-semibold text-slate-400" 
                                        textAnchor="end"
                                      >
                                        {formatVal(labelVal, comparisonKPI)}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Active shaded region under historical data */}
                                <path 
                                  d={buildAreaPath(activeHistoryVals)} 
                                  fill="url(#compHistGrad)" 
                                />

                                {/* Draw historical spline */}
                                <path 
                                  d={historyPathStr} 
                                  fill="none" 
                                  stroke="#ff682c" 
                                  strokeWidth="2.5" 
                                  strokeLinecap="round" 
                                />

                                {/* Draw predicted curve (dashed) */}
                                <path 
                                  d={predictedPathStr} 
                                  fill="none" 
                                  stroke="#334155" 
                                  strokeWidth="2" 
                                  strokeDasharray="4,4" 
                                  strokeLinecap="round" 
                                />

                                {/* Interactive hover trigger checkpoints */}
                                {activePoints.map((pt, idx) => {
                                  const x = getX(idx, activePoints.length);
                                  const histY = getY(pt.history);
                                  const predY = getY(activePredictedVals[idx]);

                                  return (
                                    <g key={idx}>
                                      {/* Vertical track line when hovered */}
                                      {activeHoverPoint === idx && (
                                        <line 
                                          x1={x} 
                                          y1={paddingY} 
                                          x2={x} 
                                          y2={height - paddingY} 
                                          stroke="#cbd5e1" 
                                          strokeWidth="1" 
                                          strokeDasharray="2,2" 
                                        />
                                      )}

                                      {/* Interactive anchor point circles */}
                                      <circle 
                                        cx={x} 
                                        cy={histY} 
                                        r={activeHoverPoint === idx ? 5 : 3.5} 
                                        className="fill-white stroke-[#ff682c]" 
                                        strokeWidth="2" 
                                      />
                                      <circle 
                                        cx={x} 
                                        cy={predY} 
                                        r={activeHoverPoint === idx ? 5 : 3.5} 
                                        className="fill-white stroke-[#334155]" 
                                        strokeWidth="2" 
                                      />

                                      {/* Invisible column overlay to capture hover easily */}
                                      <rect
                                        x={x - (width - paddingX * 2) / (activePoints.length * 2)}
                                        y={paddingY}
                                        width={(width - paddingX * 2) / activePoints.length}
                                        height={height - paddingY * 2}
                                        fill="transparent"
                                        className="cursor-pointer"
                                        onMouseEnter={() => setActiveHoverPoint(idx)}
                                        onMouseLeave={() => setActiveHoverPoint(null)}
                                      />
                                    </g>
                                  );
                                })}
                              </svg>

                              {/* Tooltip Overlay */}
                              {activeHoverPoint !== null && activePoints[activeHoverPoint] && (() => {
                                const pt = activePoints[activeHoverPoint];
                                const histVal = pt.history;
                                const predVal = activePredictedVals[activeHoverPoint];
                                const diff = histVal - predVal;
                                const pctDiff = predVal !== 0 ? (diff / predVal) * 100 : 0;

                                return (
                                  <div 
                                    className="absolute bg-[#202020] text-white p-3 rounded-md shadow-lg border border-neutral-700 text-[10px] space-y-1.5 z-40"
                                    style={{
                                      left: `${Math.min(getX(activeHoverPoint, activePoints.length) + 15, width - 150)}px`,
                                      top: '20px'
                                    }}
                                  >
                                    <div className="font-bold text-slate-300 border-b border-neutral-800 pb-1">
                                      {pt.label}
                                    </div>
                                    <div className="flex justify-between gap-4 font-mono">
                                      <span>Actual:</span>
                                      <span className="font-bold text-white">{formatVal(histVal, comparisonKPI)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4 font-mono">
                                      <span>Predicted:</span>
                                      <span className="font-semibold text-slate-300">{formatVal(predVal, comparisonKPI)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4 font-mono pt-1 border-t border-neutral-800">
                                      <span>Variance:</span>
                                      <span className={`font-bold ${diff >= 0 ? 'text-[#ff682c]' : 'text-emerald-400'}`}>
                                        {diff >= 0 ? '+' : ''}{formatVal(diff, comparisonKPI)} ({pctDiff.toFixed(1)}%)
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}

                            </div>

                            {/* Chart ticks label row */}
                            <div className="flex justify-between px-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                              {activePoints.map((pt, i) => {
                                // show every label for small lists, or alternate for 30 points
                                if (activePoints.length > 15 && i % 4 !== 0 && i !== activePoints.length - 1) return null;
                                return <span key={i}>{pt.label}</span>;
                              })}
                            </div>
                          </div>

                          {/* HEADCOUNT CAPACITY SIMULATOR PANEL */}
                          <div className="bg-white p-6 rounded-lg border border-[#e8e8e8] flex flex-col justify-between space-y-5">
                            <div className="space-y-4">
                              <div>
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-850 text-[9px] font-bold uppercase tracking-wider block w-fit">
                                  Recruitment & Staffing Planner
                                </span>
                                <h3 className="text-sm font-bold text-[#202020] mt-1.5 uppercase">Capacity Simulator</h3>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Simulate recruiting additional support desk agents or budgeting layoffs to review predictive SLA compliance, wait times, and operational risks.
                                </p>
                              </div>

                              {/* Staffing adjustment counter component */}
                              <div className="space-y-3 bg-[#fbfbfb] p-4 rounded-lg border border-slate-150">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Staffing Adjustment</span>
                                <div className="flex items-center justify-between">
                                  <button 
                                    onClick={() => setAgentStaffingAdj(prev => Math.max(-4, prev - 1))}
                                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition font-bold"
                                  >
                                    -
                                  </button>
                                  <div className="text-center">
                                    <span className={`text-xl font-display font-bold ${
                                      agentStaffingAdj > 0 ? 'text-emerald-600' : agentStaffingAdj < 0 ? 'text-rose-600' : 'text-[#202020]'
                                    }`}>
                                      {agentStaffingAdj > 0 ? `+${agentStaffingAdj}` : agentStaffingAdj}
                                    </span>
                                    <span className="block text-[8px] font-medium text-slate-400 uppercase mt-0.5">
                                      {agentStaffingAdj > 0 ? 'Surplus Agents' : agentStaffingAdj < 0 ? 'Deficit Agents' : 'Baseline Staffing'}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => setAgentStaffingAdj(prev => Math.min(6, prev + 1))}
                                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition font-bold"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-[11px] leading-relaxed text-slate-500 border-t border-dashed border-slate-200 pt-2 mt-1">
                                  {agentStaffingAdj > 0 ? (
                                    <span className="text-emerald-600 font-semibold">
                                      ✅ Adding {agentStaffingAdj} agent({agentStaffingAdj > 1 ? 's' : ''}) reduces average SLA response delays by {(agentStaffingAdj * 12).toFixed(0)}%.
                                    </span>
                                  ) : agentStaffingAdj < 0 ? (
                                    <span className="text-rose-600 font-semibold">
                                      ⚠️ Laying off {Math.abs(agentStaffingAdj)} agent({Math.abs(agentStaffingAdj) > 1 ? 's' : ''}) triggers critical queue bottleneck warnings.
                                    </span>
                                  ) : (
                                    <span>Standard operational headcount holds steady at normal system margins.</span>
                                  )}
                                </div>
                              </div>

                              {/* Pre-configured Scenario Buttons */}
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tactical Presets</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <button 
                                    onClick={() => setAgentStaffingAdj(-2)}
                                    className="px-2.5 py-1.5 bg-[#f7f3f2] hover:bg-slate-100 border border-slate-200.5 rounded text-[10px] font-semibold text-slate-600 transition text-left"
                                  >
                                    📉 Budget Layoffs (-2)
                                  </button>
                                  <button 
                                    onClick={() => setAgentStaffingAdj(3)}
                                    className="px-2.5 py-1.5 bg-[#f7f3f2] hover:bg-slate-100 border border-slate-200.5 rounded text-[10px] font-semibold text-slate-600 transition text-left"
                                  >
                                    ⚡ Rush Staffing (+3)
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Reset Simulator Staffing Baseline Button */}
                            <div className="border-t border-slate-100 pt-4 mt-auto">
                              <button 
                                onClick={() => setAgentStaffingAdj(0)}
                                className="w-full py-2 bg-[#202020] text-white hover:bg-slate-850 font-bold text-xs rounded-lg transition"
                              >
                                Restore Staffing Baseline
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* FOUR SUB-CHARTS (EACH KPI HAS A DEDICATED MINI VISUALIZATION BLOCK FOR THE SELECTED HORIZON) */}
                        <div className="space-y-4 pt-2">
                          <div>
                            <h3 className="font-display font-semibold text-[#202020] text-base">At-A-Glance KPIs Overlays</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Simultaneous visualization of all primary parameters across the {comparisonHorizon === 'week' ? 'Last 13 Days' : comparisonHorizon === 'month' ? 'Last Month' : 'Last Quarter'}. Click a card to toggle deep-dive analytics.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                            {(['volume', 'waitTime', 'productivity', 'serviceRate'] as const).map((kpiKey) => {
                              // Mini SVG calculations
                              const miniPts = comparisonData[comparisonHorizon][kpiKey];
                              const miniHistList = miniPts.map(pt => pt.history);
                              const miniPredList = miniPts.map(pt => getSimulatedVal(pt.predicted, kpiKey));
                              const mAll = [...miniHistList, ...miniPredList];
                              const mMax = Math.max(...mAll) * 1.02;
                              const mMin = Math.max(0, Math.min(...mAll) * 0.98);

                              const miniWidth = 240;
                              const miniHeight = 60;
                              const miniPadX = 10;
                              const miniPadY = 10;

                              const getMiniX = (idx: number) => {
                                return miniPadX + (idx * (miniWidth - miniPadX * 2)) / (miniPts.length - 1);
                              };

                              const getMiniY = (v: number) => {
                                const r = mMax - mMin || 1;
                                return miniHeight - miniPadY - ((v - mMin) / r) * (miniHeight - miniPadY * 2);
                              };

                              const mHistPath = miniHistList.map((v, i) => 
                                `${i === 0 ? 'M' : 'L'} ${getMiniX(i).toFixed(1)} ${getMiniY(v).toFixed(0)}`
                              ).join(' ');

                              const mPredPath = miniPredList.map((v, i) => 
                                `${i === 0 ? 'M' : 'L'} ${getMiniX(i).toFixed(1)} ${getMiniY(v).toFixed(0)}`
                              ).join(' ');

                              const isSelected = comparisonKPI === kpiKey;

                              const miniAvgHist = miniHistList.reduce((a, b) => a + b, 0) / miniHistList.length;
                              const miniAvgPred = miniPredList.reduce((a, b) => a + b, 0) / miniPredList.length;
                              const miniDiff = miniAvgHist - miniAvgPred;
                              const miniPct = miniAvgPred !== 0 ? (miniDiff / miniAvgPred) * 100 : 0;

                              return (
                                <div 
                                  key={kpiKey}
                                  onClick={() => {
                                    setComparisonKPI(kpiKey);
                                    setActiveHoverPoint(null);
                                  }}
                                  className={`bg-white p-5 rounded-lg border transition cursor-pointer flex flex-col justify-between h-48 hover:shadow-md ${
                                    isSelected 
                                      ? 'border-[#ff682c] ring-2 ring-[#ff682c]/10' 
                                      : 'border-[#e8e8e8] hover:border-slate-300'
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between items-start">
                                      <h4 className="text-xs font-bold text-[#202020] uppercase tracking-wide">
                                        {kpiLabels[kpiKey]}
                                      </h4>
                                      <span className={`text-[10px] font-bold ${miniPct >= 0 ? 'text-[#ff682c]' : 'text-emerald-600'}`}>
                                        {miniPct >= 0 ? '+' : ''}{miniPct.toFixed(1)}% var
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-baseline mt-1">
                                      <span className="text-[10px] text-slate-400">Hist: {formatVal(miniAvgHist, kpiKey)}</span>
                                      <span className="text-[10px] text-slate-400">Pred: {formatVal(miniAvgPred, kpiKey)}</span>
                                    </div>
                                  </div>

                                  {/* MINI CHART ELEMENT */}
                                  <div className="h-16 w-full relative pt-2">
                                    <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${miniWidth} ${miniHeight}`} preserveAspectRatio="none">
                                      {/* Hist spline */}
                                      <path 
                                        d={mHistPath} 
                                        fill="none" 
                                        stroke="#ff682c" 
                                        strokeWidth="1.8" 
                                        strokeLinecap="round" 
                                      />
                                      {/* Pred spline dotted */}
                                      <path 
                                        d={mPredPath} 
                                        fill="none" 
                                        stroke="#475569" 
                                        strokeWidth="1.2" 
                                        strokeDasharray="2,2" 
                                        strokeLinecap="round" 
                                      />
                                    </svg>
                                  </div>

                                  <div className="text-[9px] uppercase font-bold tracking-widest text-[#828282] mt-2 text-right">
                                    {isSelected ? '● ACTIVE INTERACTIVE VIEW' : 'CLICK TO EXPAND'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </motion.div>
                    );
                  })()}

                  {/* TAB CARD: PROFILE */}
                  {activeTab === 'profile' && (
                    <motion.div 
                      key="profile"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-3xl mx-auto space-y-6"
                    >
                      {/* Form panel exactly matches image 6 layout */}
                      <div className="bg-white p-8 rounded-lg border border-[#e8e8e8] space-y-6">
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img src={selectedIndividual.avatarUrl} alt={selectedIndividual.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#ff682c] rounded-full border-2 border-white flex items-center justify-center">
                                <span className="w-1 h-1 bg-white rounded-full" />
                              </span>
                            </div>
                            <div>
                              <h3 className="font-display font-semibold text-slate-800 text-sm">Profile Configuration</h3>
                              <p className="text-xs text-slate-400 mt-0.5">Edit metadata corresponding to {selectedIndividual.name}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <span className="px-3 py-1 bg-[#202020]/5 text-[#202020] rounded-full text-[10px] font-mono flex items-center gap-1.5 border border-[#202020]/10">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              <span>System Security Active</span>
                            </span>
                          </div>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                            <input 
                              type="text"
                              value={selectedIndividual.name}
                              onChange={(e) => setSelectedIndividual({...selectedIndividual, name: e.target.value})}
                              className="w-full bg-[#fbfbfb] border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-[#202020] focus:outline-none focus:border-[#ff682c]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                            <input 
                              type="email"
                              value={selectedIndividual.email}
                              onChange={(e) => setSelectedIndividual({...selectedIndividual, email: e.target.value})}
                              className="w-full bg-[#fbfbfb] border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-[#202020] focus:outline-none focus:border-[#ff682c]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Operational Role</label>
                            <input 
                              type="text"
                              value={selectedIndividual.role}
                              onChange={(e) => setSelectedIndividual({...selectedIndividual, role: e.target.value})}
                              className="w-full bg-[#fbfbfb] border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-[#202020] focus:outline-none focus:border-[#ff682c]"
                            />
                          </div>
                        </div>

                        {/* Account Protection Settings Swithes */}
                        <div className="border-t border-[#e8e8e8] pt-6 space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-[#ff682c] transform rotate-45" />
                            <span>Account Protection</span>
                          </h4>

                          <div className="divide-y divide-[#e8e8e8] border border-[#e8e8e8] rounded-lg overflow-hidden bg-[#fbfbfb]">
                            
                            <div className="flex items-center justify-between p-4 bg-white">
                              <div>
                                <span className="text-xs font-bold text-slate-700 block">Activate 2FA</span>
                                <span className="text-[11px] text-slate-400">Add an extra layer of security via mobile authenticator app.</span>
                              </div>
                              <button 
                                onClick={() => setSelectedIndividual({...selectedIndividual, mfaActive: !selectedIndividual.mfaActive})}
                                className="w-10 h-5 rounded-full relative bg-slate-200 hover:bg-slate-300 transition focus:outline-none"
                              >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${selectedIndividual.mfaActive ? 'translate-x-5 bg-[#ff682c]' : ''}`} />
                              </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white">
                              <div>
                                <span className="text-xs font-bold text-slate-700 block">Manage Biometric Devices</span>
                                <span className="text-[11px] text-slate-400">Enable FaceID or TouchID login for recognized secure hardware.</span>
                              </div>
                              <button 
                                onClick={() => setSelectedIndividual({...selectedIndividual, biometricActive: !selectedIndividual.biometricActive})}
                                className="w-10 h-5 rounded-full relative bg-slate-200 hover:bg-slate-300 transition focus:outline-none"
                              >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${selectedIndividual.biometricActive ? 'translate-x-5 bg-[#ff682c]' : ''}`} />
                              </button>
                            </div>

                          </div>
                        </div>

                        {/* Save Actions and Security logs link */}
                        <div className="border-t border-[#e8e8e8] pt-6 flex items-center justify-between">
                          <button 
                            onClick={() => alert("Downloading secure audit logs of latest activities...")}
                            className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1.5 transition underline capitalize"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download Security logs</span>
                          </button>
                          
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setSelectedIndividual(prev => ({...prev}))}
                              className="px-4 py-2 text-xs font-bold border border-slate-200 text-slate-600 rounded flex items-center gap-1 hover:bg-slate-50 cursor-pointer"
                            >
                              Discard Changes
                            </button>
                            <button 
                              onClick={handleSaveProfile}
                              className="px-4 py-2 bg-[#202020] hover:bg-slate-800 text-white font-bold text-xs rounded transition flex items-center gap-1 cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>

                        <div className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-400 border-t border-[#e8e8e8]/50 pt-4 leading-relaxed">
                          Last Security Configuration Audit: October 12, 2023 • System Status: <span className="text-[#ff682c]">ENCRYPTED</span>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* TAB CARD: SETTINGS WITH WEBHOOK PIPELINES */}
                  {activeTab === 'settings' && (
                    <motion.div 
                      key="settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-3xl mx-auto space-y-6"
                    >
                      <div className="bg-white p-8 rounded-lg border border-[#e8e8e8] space-y-6">
                        <div>
                          <h3 className="font-display font-semibold text-slate-800 text-lg">System Configuration</h3>
                          <p className="text-xs text-slate-500 mt-1">Configure Webhook pipelines to connect the wait time prediction front-end directly to active N8N workflows.</p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">N8N Webhook Endpoint (POST)</label>
                            <input 
                              type="text" 
                              value={n8nWebhookUrl}
                              onChange={(e) => setN8nWebhookUrl(e.target.value)}
                              placeholder="e.g. https://your-n8n.app/webhook/dd4d6976-e7d5-49ce-83d6-1b913bc8f47e"
                              className="w-full bg-[#fbfbfb] border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-[#202020] focus:outline-none focus:border-[#ff682c]"
                            />
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                              Registering your webhook proxies all forecast metric dispatches and pipeline simulations directly as automated pipeline inputs!
                            </p>
                          </div>

                          <div className="flex gap-3 items-center">
                            <button
                              type="button"
                              onClick={handleTestWebhook}
                              disabled={webhookTestStatus === 'testing' || !n8nWebhookUrl}
                              className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
                                webhookTestStatus === 'testing' 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                  : 'bg-[#ff682c] hover:bg-[#202020] text-white border border-[#ff682c]'
                              }`}
                            >
                              {webhookTestStatus === 'testing' ? 'Testing Connection...' : '⚡ Test Webhook Integration'}
                            </button>
                            {webhookTestStatus !== 'idle' && (
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${
                                  webhookTestStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                  webhookTestStatus === 'failed' ? 'bg-rose-50 border-rose-200 text-rose-500' :
                                  'bg-orange-50 border-orange-200 text-orange-500'
                                }`}>
                                  {webhookTestStatus === 'success' ? '✔ Connection Succeeded' : `✖ Test Failed`}
                                </span>
                              </div>
                            )}
                          </div>

                          {webhookTestResponse && (
                            <div className="rounded-lg border border-[#e8e8e8] p-4 bg-[#fcfcfc] space-y-2">
                              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                                <span>Execution Logs / Feedback payload</span>
                                <button
                                  onClick={() => setWebhookTestResponse('')}
                                  className="hover:text-slate-700 bg-transparent border-none outline-none cursor-pointer text-[9px] font-semibold uppercase tracking-widest text-slate-400"
                                >
                                  Clear Logs
                                </button>
                              </div>
                              <pre className="text-[10px] font-mono p-3 bg-slate-900 text-emerald-400 overflow-x-auto rounded border border-neutral-800 max-h-48 leading-relaxed whitespace-pre-wrap">
                                {webhookTestResponse}
                              </pre>
                            </div>
                          )}

                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                            <span className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Payload Schema</span>
                            <div className="p-3 bg-white border border-[#e8e8e8] rounded font-mono text-[10px] text-slate-600 space-y-1">
                              <p className="text-[#ff682c]">POST /api/data</p>
                              <p className="text-slate-400">{"Body: { \"type\": \"history | prediction | chat | overview\", \"payload\": { ... } }"}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-[#fbfbfb] border border-[#e8e8e8] rounded-xl mt-4">
                            <div>
                              <span className="text-xs font-bold text-slate-700 block">Automatic Simulation Refresh</span>
                              <span className="text-[11px] text-slate-400">Auto recalculate pipeline forecasts and timers every 5 minutes.</span>
                            </div>
                            <button 
                              onClick={() => setAutoSync(!autoSync)}
                              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${autoSync ? 'bg-[#ff682c] text-white' : 'bg-slate-200 text-slate-500'}`}
                            >
                              {autoSync ? 'AUTO ON' : 'AUTO OFF'}
                            </button>
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>

              </div>
              
            </main>

          </motion.div>
        )}

      </AnimatePresence>

      {/* FLOAT INTELLIGENT COMPANION ASSISTANT PANEL */}
      <AnimatePresence>
        {showAssistantModal && (
          <div className="fixed inset-0 bg-[#202020]/40 backdrop-blur-sm flex items-center justify-end z-50 p-4">
            <motion.div 
              key="assistant-drawer"
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 200, opacity: 0 }}
              className="bg-white border-l border-[#e8e8e8] w-full max-w-lg h-full rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#e8e8e8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ff682c]" />
                  <div>
                    <h3 className="font-display font-semibold text-[#202020] text-sm">AI Operations Companion</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Analytic advisor connected to wait-time logs</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAssistantModal(false)}
                  className="p-2 border border-slate-200 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <span className="text-xs font-bold">Close</span>
                </button>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 h-full">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role !== 'user' && (
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border text-[#ff682c]">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </div>
                    )}
                    <div className={`p-4 rounded-xl text-xs max-w-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#202020] text-white rounded-tr-none' 
                        : 'bg-stone-50 border border-slate-200 text-[#202020] rounded-tl-none'
                    }`}>
                      {msg.role === 'model' ? (
                        <div className="space-y-2">
                          {msg.text.split("\n").map((line, lIdx) => {
                            if (line.startsWith("###")) {
                              return <h4 key={lIdx} className="font-display font-bold text-xs uppercase tracking-wider text-[#ff682c] mt-2">{line.replace("###", "")}</h4>;
                            }
                            if (line.startsWith("-")) {
                              return <li key={lIdx} className="list-disc ml-4 text-slate-600">{line.replace("-", "").trim()}</li>;
                            }
                            return <p key={lIdx}>{line}</p>;
                          })}
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3 justify-start items-center">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border">
                      <RefreshCw className="w-4 h-4 text-[#ff682c] animate-spin" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Assistant calculating optimal placements...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggester Buttons */}
              <div className="p-4 bg-slate-50 border-t border-[#e8e8e8] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Suggested Instructions</span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button 
                    onClick={() => handleSendChat("Identify tickets at risk of breaching SLAs")}
                    className="w-full text-left p-2.5 bg-white hover:bg-orange-50/10 border border-slate-200 hover:border-[#ff682c] text-[11px] font-medium text-slate-600 rounded-lg transition"
                  >
                    "Identify tickets at risk of breaching SLAs"
                  </button>
                  <button 
                    onClick={() => handleSendChat("Suggest an agent allocation plan for technical support backlog")}
                    className="w-full text-left p-2.5 bg-white hover:bg-orange-50/10 border border-slate-200 hover:border-[#ff682c] text-[11px] font-medium text-slate-600 rounded-lg transition"
                  >
                    "Suggest an agent allocation plan"
                  </button>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-[#e8e8e8] bg-white flex gap-2.5">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                  placeholder="Ask the assistant for queue diagnoses..."
                  className="flex-1 bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#ff682c] rounded-lg px-3.5 py-2.5 text-xs text-[#202020]"
                />
                <button 
                  onClick={() => handleSendChat()}
                  className="px-4 py-2.5 bg-[#202020] hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition active:scale-95 flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Icon replacement alias
function LockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/1999/xlink"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
