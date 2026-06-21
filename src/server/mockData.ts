export interface Ticket {
  id: string;
  priority: 'Urgent' | 'High' | 'Normal' | 'Low';
  queue: 'Technical Support' | 'Billing' | 'Onboarding' | 'General Inquiry';
  created_at: string;
  elapsed_time: number; // in mins
  sla_limit: number; // in mins
  predicted_wait_time: number; // in mins
  risk_level: 'Safe' | 'Warning' | 'High Risk';
  ai_recommendation: string;
  subject: string;
  assignee: string;
}

export interface KPIHistory {
  id: number;
  annee: number;
  duree_attente_moy: number; 
  duree_attente_p90: number; 
  duree_traitement_moy: number; 
  flux_par_heure: number; 
  heure_pointe: number; 
  is_special_day: number; 
  jour: string; 
  jour_semaine: string; 
  mois: number; 
  nb_guichets_actifs: number; 
  occupation_guichets: number; 
  pct10a20min: number; 
  pct5a10min: number; 
  pct_moins5min: number; 
  pct_plus20min: number; 
  productivite_agent: number; 
  service: string; 
  site: string; 
  sla_breach_count: number; 
  special_day_label: string; 
  taux_abandon: number; 
  taux_pause: number; 
  taux_redirection: number; 
  taux_service: number; 
  tickets_abandonnes: number; 
  tickets_en_pause: number; 
  tickets_par_guichet: number; 
  tickets_termines: number; 
  trimestre: number; 
  volume_heure_pointe: number; 
  volume_tickets: number;
}

export interface WaitDistributionItem {
  range: string;
  count: number;
  queue: string;
}

export interface AgentPerformance {
  id: string;
  name: string;
  status: 'Online' | 'Away' | 'Offline';
  resolvedCount: number;
  avgResolveTime: number; // in mins
  slaAdherenceRate: number; // percentage
  avatarUrl: string;
}

export const initialTickets: Ticket[] = [
  {
    id: "T-1024",
    subject: "PostgreSQL Database connection pools exhausted under load",
    priority: "Urgent",
    queue: "Technical Support",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    elapsed_time: 25,
    sla_limit: 30,
    predicted_wait_time: 8,
    risk_level: "High Risk",
    ai_recommendation: "Re-assign immediately to DB Lead. Current database load is 92%. SLA limit of 30m will be exceeded in 5m.",
    assignee: "Alex Rivera"
  },
  {
    id: "T-1025",
    subject: "SaaS Subscription downgrade request processing error",
    priority: "High",
    queue: "Billing",
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    elapsed_time: 40,
    sla_limit: 60,
    predicted_wait_time: 15,
    risk_level: "Warning",
    ai_recommendation: "Approve workflow payload in Stripe interface. Billing webhook response lag detected.",
    assignee: "Sarah Chen"
  },
  {
    id: "T-1026",
    subject: "Unable to complete onboarding workspace provisioning",
    priority: "Normal",
    queue: "Onboarding",
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    elapsed_time: 90,
    sla_limit: 120,
    predicted_wait_time: 12,
    risk_level: "Safe",
    ai_recommendation: "Ensure workspace DNS records are propagated. Auto-retry setup is active.",
    assignee: "Marcus Vance"
  },
  {
    id: "T-1027",
    subject: "Reset multi-factor authentication (MFA) token",
    priority: "Urgent",
    queue: "General Inquiry",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    elapsed_time: 5,
    sla_limit: 15,
    predicted_wait_time: 4,
    risk_level: "Safe",
    ai_recommendation: "Verify user ID via security clearance, then reset token via IAM dashboard.",
    assignee: "Elena Rostova"
  },
  {
    id: "T-1028",
    subject: "Slow site response during regional AWS outage",
    priority: "High",
    queue: "Technical Support",
    created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    elapsed_time: 50,
    sla_limit: 60,
    predicted_wait_time: 18,
    risk_level: "High Risk",
    ai_recommendation: "Failover regional traffic to east-2 region. Expected route convergence time: 8 mins.",
    assignee: "Unassigned"
  },
  {
    id: "T-1029",
    subject: "Enterprise billing invoice correction request",
    priority: "High",
    queue: "Billing",
    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    elapsed_time: 22,
    sla_limit: 60,
    predicted_wait_time: 10,
    risk_level: "Safe",
    ai_recommendation: "Regenerate CSV using custom net-45 template parameters.",
    assignee: "Sarah Chen"
  },
  {
    id: "T-1030",
    subject: "Bulk user import CSV upload failing",
    priority: "Normal",
    queue: "Onboarding",
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    elapsed_time: 110,
    sla_limit: 120,
    predicted_wait_time: 20,
    risk_level: "High Risk",
    ai_recommendation: "Escalate queue attention. The current volume of normal priority tasks is delaying onboarding SLA limits.",
    assignee: "Marcus Vance"
  }
];

export const initialKPIHistory: KPIHistory[] = [];

// Seed 30 days of real DB KPI history with entries for different sites and services
const now = new Date();
const sitesList = ["London Hub", "Paris Ops", "Berlin Center"];
const servicesList = ["Premium Billing", "Claims Adj.", "Tech Tier 2"];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let idCounter = 1;
for (let i = 30; i >= 0; i--) {
  const date = new Date();
  date.setDate(now.getDate() - i);
  const dateString = date.toISOString().split('T')[0];
  const dayOfWeek = weekdays[date.getDay()];
  
  // Create history record for each site/service combination per day to make it highly expressive
  for (const site of sitesList) {
    for (const service of servicesList) {
      const volBase = Math.floor(180 + Math.sin(i * 0.4) * 40 + Math.random() * 50);
      const waitBase = parseFloat((2.5 + Math.cos(i * 0.5) * 1.1 + Math.random() * 0.8).toFixed(2));
      const treatBase = parseFloat((8.8 + Math.sin(i * 0.3) * 2.2 + Math.random() * 1.5).toFixed(2));
      const serviceRate = parseFloat((91.5 + Math.sin(i * 0.6) * 4.5 + Math.random() * 3.0).toFixed(1));
      const abandonRate = parseFloat((3.4 + Math.cos(i * 0.8) * 1.8 + Math.random() * 1.2).toFixed(2));
      const occupation = parseFloat((64.0 + Math.sin(i * 0.5) * 12.0 + Math.random() * 8.0).toFixed(1));
      const prodAgent = parseFloat((7.8 + Math.random() * 2.1).toFixed(1));
      const activeGuichets = Math.floor(4 + Math.random() * 4);
      const isSpecial = (date.getDay() === 0 || date.getDay() === 6) ? 1 : 0;
      const slaBreaches = Math.max(0, Math.floor(Math.sin(i * 0.8) * 3 + Math.random() * 3));

      initialKPIHistory.push({
        id: idCounter++,
        annee: date.getFullYear(),
        duree_attente_moy: waitBase,
        duree_attente_p90: parseFloat((waitBase * 1.8 + Math.random()).toFixed(2)),
        duree_traitement_moy: treatBase,
        flux_par_heure: parseFloat((volBase / 8).toFixed(1)),
        heure_pointe: 10 + Math.floor(Math.random() * 4),
        is_special_day: isSpecial,
        jour: dateString,
        jour_semaine: dayOfWeek,
        mois: date.getMonth() + 1,
        nb_guichets_actifs: activeGuichets,
        occupation_guichets: Math.min(100, Math.max(20, occupation)),
        pct10a20min: parseFloat((10 + Math.random() * 8).toFixed(1)),
        pct5a10min: parseFloat((25 + Math.random() * 15).toFixed(1)),
        pct_moins5min: parseFloat((55 + Math.random() * 15).toFixed(1)),
        pct_plus20min: parseFloat((2 + Math.random() * 3).toFixed(1)),
        productivite_agent: prodAgent,
        service: service,
        site: site,
        sla_breach_count: slaBreaches,
        special_day_label: isSpecial ? "Weekend" : "Default Business Day",
        taux_abandon: Math.min(100, Math.max(0, abandonRate)),
        taux_pause: parseFloat((12.5 + Math.random() * 5).toFixed(1)),
        taux_redirection: parseFloat((8.2 + Math.random() * 4).toFixed(1)),
        taux_service: Math.min(100, Math.max(0, serviceRate)),
        tickets_abandonnes: Math.floor(volBase * (abandonRate / 100)),
        tickets_en_pause: Math.floor(volBase * 0.05),
        tickets_par_guichet: parseFloat((volBase / activeGuichets).toFixed(1)),
        tickets_termines: volBase - Math.floor(volBase * (abandonRate / 100)),
        trimestre: Math.floor(date.getMonth() / 3) + 1,
        volume_heure_pointe: Math.floor(volBase * 0.22),
        volume_tickets: volBase
      });
    }
  }
}

export const initialAgents: AgentPerformance[] = [
  {
    id: "A-1",
    name: "Alex Rivera",
    status: "Online",
    resolvedCount: 34,
    avgResolveTime: 12.5,
    slaAdherenceRate: 97.4,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "A-2",
    name: "Sarah Chen",
    status: "Online",
    resolvedCount: 29,
    avgResolveTime: 18.2,
    slaAdherenceRate: 93.1,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "A-3",
    name: "Marcus Vance",
    status: "Away",
    resolvedCount: 22,
    avgResolveTime: 22.4,
    slaAdherenceRate: 91.5,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "A-4",
    name: "Elena Rostova",
    status: "Online",
    resolvedCount: 41,
    avgResolveTime: 9.8,
    slaAdherenceRate: 98.2,
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "A-5",
    name: "David Kojo",
    status: "Offline",
    resolvedCount: 15,
    avgResolveTime: 16.5,
    slaAdherenceRate: 94.0,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
  }
];

export const initialWaitDistribution: WaitDistributionItem[] = [
  // Technical Support
  { range: "0-15m", count: 45, queue: "Technical Support" },
  { range: "15-30m", count: 32, queue: "Technical Support" },
  { range: "30m-1h", count: 18, queue: "Technical Support" },
  { range: "1h-2h", count: 12, queue: "Technical Support" },
  { range: "2h-4h", count: 8, queue: "Technical Support" },
  { range: "4h+", count: 4, queue: "Technical Support" },
  
  // Billing
  { range: "0-15m", count: 28, queue: "Billing" },
  { range: "15-30m", count: 36, queue: "Billing" },
  { range: "30m-1h", count: 22, queue: "Billing" },
  { range: "1h-2h", count: 10, queue: "Billing" },
  { range: "2h-4h", count: 5, queue: "Billing" },
  { range: "4h+", count: 1, queue: "Billing" },

  // Onboarding
  { range: "0-15m", count: 20, queue: "Onboarding" },
  { range: "15-30m", count: 25, queue: "Onboarding" },
  { range: "30m-1h", count: 30, queue: "Onboarding" },
  { range: "1h-2h", count: 15, queue: "Onboarding" },
  { range: "2h-4h", count: 11, queue: "Onboarding" },
  { range: "4h+", count: 6, queue: "Onboarding" },

  // General Inquiry
  { range: "0-15m", count: 60, queue: "General Inquiry" },
  { range: "15-30m", count: 40, queue: "General Inquiry" },
  { range: "30m-1h", count: 15, queue: "General Inquiry" },
  { range: "1h-2h", count: 5, queue: "General Inquiry" },
  { range: "2h-4h", count: 2, queue: "General Inquiry" },
  { range: "4h+", count: 0, queue: "General Inquiry" }
];
