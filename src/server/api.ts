import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { 
  initialTickets, 
  initialKPIHistory, 
  initialAgents, 
  initialWaitDistribution, 
  Ticket, 
  KPIHistory, 
  AgentPerformance, 
  WaitDistributionItem 
} from "./mockData";

const DATA_DIR = path.join(process.cwd(), "src", "server");

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("[Persistence] Could not verify/create data directory:", e);
}

const serviceMapping: Record<string, string> = {
  'Service_18': 'Business Registration Update',
  'Service_16': 'Child Support Claim',
  'Service_15': 'Dependents Registration',
  'Service_20': 'Disability Assessment Scheduling',
  'Service_7': 'Disability Pension Request',
  'Service_2': 'Employee Declaration',
  'Service_19': 'Employer Contribution Adjustment',
  'Service_1': 'Employer Registration',
  'Service_Réclamation': 'Employment Status Verification',
  'Service_3': 'Family Allowance Request',
  'Service_10': 'Health Insurance Enrollment (AMO)',
  'Service_4': 'Maternity Benefit Application',
  'Service_Renseignements': 'Maternity Leave Confirmation',
  'Service_6': 'Old-Age Pension Setup',
  'Service_13': 'Online Appointment Booking',
  'Service_11': 'Retirement Benefit Inquiry',
  'Service_9': 'Short-Term Job Loss Indemnity',
  'Service_5': 'Sickness Benefit Claim',
  'Service_Paiement': 'Sickness Benefit Extension',
  'Service_14': 'Social Security Contributions Inquiry',
  'Service_12': 'Survivor Grant Request',
  'Service_Accueil': 'Survivor Pension Adjustment',
  'Service_8': 'Survivor Pension Application',
  'Service_17': 'Widow/Widower Pension'
};

export function cleanSiteName(site: string | undefined | null): string {
  if (!site) return '';
  const trimmed = site.trim();
  
  // Format standard dynamic sites like "site_1" -> "Site 1"
  if (/^site[_\-\s]?(\d+)$/i.test(trimmed)) {
    const match = trimmed.match(/^site[_\-\s]?(\d+)$/i);
    if (match) {
      return `Site ${match[1]}`;
    }
  }

  // General clean up
  return trimmed
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanServiceName(service: string | undefined | null): string {
  if (!service) return '';
  const trimmed = service.trim();
  const lower = trimmed.toLowerCase();
  
  // Match key from the mapping (case-insensitive)
  for (const [key, val] of Object.entries(serviceMapping)) {
    if (key.toLowerCase() === lower) {
      return val;
    }
  }
  
  // Check if it's "service_X"
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
}

function cleanRecord(record: any): any {
  if (!record || typeof record !== 'object') return record;
  const newRec = { ...record };
  if ('site' in newRec) {
    newRec.site = cleanSiteName(newRec.site);
  }
  if ('service' in newRec) {
    newRec.service = cleanServiceName(newRec.service);
  }
  return newRec;
}

function cleanHistoryData(data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(cleanRecord);
  }
  
  const result = { ...data };
  if (result.history && Array.isArray(result.history)) {
    result.history = result.history.map(cleanRecord);
  }
  if (result.data && Array.isArray(result.data)) {
    result.data = result.data.map(cleanRecord);
  }
  if (result.data && typeof result.data === 'object') {
    result.data = cleanHistoryData(result.data);
  }
  if (result.lastWeekRecords && Array.isArray(result.lastWeekRecords)) {
    result.lastWeekRecords = result.lastWeekRecords.map(cleanRecord);
  }
  if (result.chartRecordsRaw && Array.isArray(result.chartRecordsRaw)) {
    result.chartRecordsRaw = result.chartRecordsRaw.map(cleanRecord);
  }
  return result;
}

function getJsonFilePath(type: string): string {
  return path.join(DATA_DIR, `saved_data_${type}.json`);
}

function readSavedData(type: string): any | null {
  const filePath = getJsonFilePath(type);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (type === 'history') {
          return cleanHistoryData(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error(`[Persistence] Error reading saved_data_${type}.json:`, e);
  }
  return null;
}

function writeSavedData(type: string, data: any): void {
  const filePath = getJsonFilePath(type);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[Persistence] Successfully written new synchronized data for '${type}' to ${filePath}`);
  } catch (e) {
    console.error(`[Persistence] Error writing saved_data_${type}.json:`, e);
  }
}

function getInitialDataForType(type: string): any {
  if (type === 'overview') {
    const totalTickets = initialTickets.length;
    const breachedCount = initialTickets.filter(t => t.elapsed_time > t.sla_limit).length;
    const warningCount = initialTickets.filter(t => t.risk_level === 'Warning').length;
    const highRiskCount = initialTickets.filter(t => t.risk_level === 'High Risk').length;
    
    return {
      source: 'internal',
      overview: {
        avgWaitTime: "13.4 mins",
        slaAdherenceRate: "94.8%",
        totalTickets,
        breachedCount,
        warningCount,
        highRiskCount,
        activeAgentsCount: initialAgents.filter(a => a.status === 'Online').length,
        priorityBreakdown: {
          Urgent: initialTickets.filter(t => t.priority === 'Urgent').length,
          High: initialTickets.filter(t => t.priority === 'High').length,
          Normal: initialTickets.filter(t => t.priority === 'Normal').length,
          Low: initialTickets.filter(t => t.priority === 'Low').length
        },
        predictionsMade: 1452,
        workflowConnected: false
      }
    };
  } else if (type === 'history') {
    return {
      source: 'internal',
      history: initialKPIHistory,
      departments: [
        { name: "Claims Adj.", avgWaitTime: 2.8, slaAdherence: 93.4, volume: 450 },
        { name: "Premium Billing", avgWaitTime: 3.1, slaAdherence: 94.8, volume: 280 },
        { name: "Tech Tier 2", avgWaitTime: 4.2, slaAdherence: 92.2, volume: 320 }
      ]
    };
  } else if (type === 'prediction') {
    return {
      source: 'internal',
      tickets: initialTickets,
      waitDistributions: initialWaitDistribution,
      agents: initialAgents
    };
  }
  return {};
}

function getOrInitData(type: string): any {
  const saved = readSavedData(type);
  if (saved) return saved;
  const initial = getInitialDataForType(type);
  writeSavedData(type, initial);
  return initial;
}

function calculateOverviewFromHistory(): any {
  const historyData = readSavedData('history');
  let records: any[] = [];
  if (historyData) {
    if (Array.isArray(historyData)) {
      records = historyData;
    } else if (historyData.history && Array.isArray(historyData.history)) {
      records = historyData.history;
    } else if (historyData.data && Array.isArray(historyData.data)) {
      records = historyData.data;
    }
  }
  
  if (records.length === 0) {
    return null;
  }

  // 1. Find the 7 most recent unique days for "last week"
  const uniqueDays = Array.from(new Set(records.map((h: any) => h.jour))).filter(Boolean) as string[];
  uniqueDays.sort((a, b) => b.localeCompare(a));
  const sliceDays = uniqueDays.slice(0, 7);
  const lastWeekRecords = records.filter((h: any) => sliceDays.includes(h.jour));

  if (lastWeekRecords.length === 0) {
    return null;
  }

  // Calculate Average Wait Time (weighted by volume_tickets)
  let totalVol = lastWeekRecords.reduce((sum, r) => sum + (r.volume_tickets || 0), 0);
  if (totalVol === 0) totalVol = 1;

  const weightedWaitSum = lastWeekRecords.reduce((sum, r) => sum + ((r.duree_attente_moy || 0) * (r.volume_tickets || 0)), 0);
  const avgWaitTimeVal = weightedWaitSum / totalVol;

  // Calculate Average Service Rate (weighted by volume_tickets)
  const weightedSvcSum = lastWeekRecords.reduce((sum, r) => {
    let svc = r.taux_service || 0;
    if (svc <= 1.0 && svc > 0) {
      svc = svc * 100;
    }
    return sum + (svc * (r.volume_tickets || 0));
  }, 0);
  const avgServiceRateVal = weightedSvcSum / totalVol;

  const totalTickets = lastWeekRecords.reduce((sum, r) => sum + (r.volume_tickets || 0), 0);
  const breachedCount = lastWeekRecords.reduce((sum, r) => sum + (r.sla_breach_count || 0), 0);
  
  const activeAgentsCount = Math.round(lastWeekRecords.reduce((sum, r) => sum + (r.nb_guichets_actifs || 0), 0) / lastWeekRecords.length) || 6;

  const urgentCount = Math.round(totalTickets * 0.05) || 1;
  const highCount = Math.round(totalTickets * 0.15) || 2;
  const normalCount = Math.round(totalTickets * 0.60) || 10;
  const lowCount = Math.max(0, totalTickets - (urgentCount + highCount + normalCount));

  const warningCount = Math.max(0, Math.round(breachedCount * 0.4)) || 1;
  const highRiskCount = breachedCount;

  return {
    source: 'internal-calculated',
    overview: {
      avgWaitTime: `${avgWaitTimeVal.toFixed(1)} mins`,
      slaAdherenceRate: `${avgServiceRateVal.toFixed(1)}%`,
      totalTickets,
      breachedCount,
      warningCount,
      highRiskCount,
      activeAgentsCount,
      priorityBreakdown: {
        Urgent: urgentCount,
        High: highCount,
        Normal: normalCount,
        Low: lowCount
      },
      predictionsMade: Math.round(totalTickets * 2.8) || 1450,
      workflowConnected: true
    }
  };
}

// Keep state persistence in memory during the lifetime of the dev server process
let ticketsList: Ticket[] = [...initialTickets];
let kpiHistoryList: KPIHistory[] = [...initialKPIHistory];
let agentsList: AgentPerformance[] = [...initialAgents];
let waitDistributionList: WaitDistributionItem[] = [...initialWaitDistribution];

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

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

function findTicketsArray(obj: any): any[] | null {
  if (!obj) return null;
  if (Array.isArray(obj)) {
    if (obj.length > 0 && (
      obj[0].id || 
      obj[0].ticketId || 
      obj[0].subject || 
      obj[0].priority || 
      obj[0].queue || 
      obj[0].risk_level || 
      obj[0].predicted_wait_time !== undefined
    )) {
      return obj;
    }
  }
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (Array.isArray(val)) {
        if (val.length > 0 && (
          val[0].id || 
          val[0].ticketId || 
          val[0].subject || 
          val[0].priority || 
          val[0].queue || 
          val[0].risk_level || 
          val[0].predicted_wait_time !== undefined
        )) {
          return val;
        }
      } else if (val && typeof val === 'object') {
        const nested = findTicketsArray(val);
        if (nested) return nested;
      }
    }
  }
  return null;
}

export async function handleApiRequest(body: any, geminiApiKey?: string): Promise<any> {
  const { type, payload } = body;
  
  // 1. Check if N8N Webhook is configured in environment variables or request body
  // Real workflow integration
  const n8nWebhookUrl = body.n8nWebhookUrl || process.env.N8N_WEBHOOK_URL;
  const isSyncOrTestAction = (
    type === 'test' || 
    body.action === 'sync history' || 
    payload?.action === 'sync history' ||
    (type === 'history' && (body.action || '').includes('sync'))
  );

  if (n8nWebhookUrl && isSyncOrTestAction) {
    try {
      console.log(`[API Webhook] Attempting to proxy to N8N Webhook with pagination handling at ${n8nWebhookUrl} for type: ${type}`);
      
      let allRecords: any[] = [];
      let currentLastId: any = null;
      let hasMore = false;
      let iteration = 0;
      const maxIterations = 30; // Max batches to grab
      let firstBatchResponseData: any = null;
      let lastFetchedResponseData: any = null;

      do {
        iteration++;
        const requestBody = { ...body };
        if (currentLastId !== null) {
          requestBody.payload = {
            ...(requestBody.payload || {}),
            lastId: currentLastId
          };
          // Also set at root level if n8n expects it there
          requestBody.lastId = currentLastId;
        }

        console.log(`[API Webhook] Fetching batch #${iteration} (lastId: ${currentLastId || 'initial'})...`);
        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          console.error(`[API Webhook] Batch #${iteration} failed with status: ${response.status}`);
          break;
        }

        let data: any = {};
        try {
          data = await response.json();
        } catch (e) {
          console.warn(`[API Webhook] Batch #${iteration} response is not valid JSON. Stopping pagination.`);
          if (iteration === 1) {
            firstBatchResponseData = { message: "Webhook accepted post successfully", status: response.status };
          }
          break;
        }

        if (iteration === 1) {
          firstBatchResponseData = data;
        }
        lastFetchedResponseData = data;

        // Find records array
        let batchRecords: any[] | null = null;
        if (Array.isArray(data)) {
          batchRecords = data;
        } else if (data && typeof data === 'object') {
          if (type === 'history') {
            batchRecords = data.history || data.data?.history || null;
          } else if (type === 'prediction' || type === 'overview') {
            batchRecords = data.tickets || data.data?.tickets || null;
          }
          
          if (!batchRecords) {
            batchRecords = type === 'history' ? findKPIHistoryArray(data) : findTicketsArray(data);
          }
        }

        if (batchRecords && Array.isArray(batchRecords)) {
          allRecords.push(...batchRecords);
          console.log(`[API Webhook] Batch #${iteration} retrieved ${batchRecords.length} records. Total collected: ${allRecords.length}`);
        } else {
          console.log(`[API Webhook] Batch #${iteration} found no records. Stopping pagination.`);
          break;
        }

        // Check for pagination metadata
        let nextId: any = null;
        let batchHasMore = false;

        if (data && typeof data === 'object') {
          if ('nextId' in data && data.nextId !== undefined && data.nextId !== null) {
            nextId = data.nextId;
          } else if (data.data && typeof data.data === 'object' && 'nextId' in data.data && data.data.nextId !== undefined && data.data.nextId !== null) {
            nextId = data.data.nextId;
          } else if ('lastId' in data && data.lastId !== undefined && data.lastId !== null) {
            nextId = data.lastId;
          } else if (data.data && typeof data.data === 'object' && 'lastId' in data.data && data.data.lastId !== undefined && data.data.lastId !== null) {
            nextId = data.data.lastId;
          }

          if ('hasMore' in data) {
            batchHasMore = !!data.hasMore;
          } else if (data.data && typeof data.data === 'object' && 'hasMore' in data.data) {
            batchHasMore = !!data.data.hasMore;
          }
        }

        if (batchHasMore && nextId !== null && nextId !== undefined && nextId !== currentLastId) {
          currentLastId = nextId;
          hasMore = true;
        } else {
          hasMore = false;
        }

      } while (hasMore && iteration < maxIterations);

      console.log(`[API Webhook] Paginated sync complete. Total iterations: ${iteration}, total records collected: ${allRecords.length}`);

      if (firstBatchResponseData !== null) {
        // Construct the combined result
        const result: any = {
          source: 'n8n',
          success: true,
          status: 200,
          data: firstBatchResponseData
        };

        // Flatten top-level keys from the last fetch metadata (like columns, message, hasMore, nextId)
        if (lastFetchedResponseData && typeof lastFetchedResponseData === 'object' && !Array.isArray(lastFetchedResponseData)) {
          Object.assign(result, lastFetchedResponseData);
          // Make sure we have the updated overall hasMore and nextId flags updated to client too
          result.hasMore = false; // We fetched everything
        }

        // Put combined records where they belong
        if (type === 'history') {
          result.history = allRecords;
        } else if (type === 'prediction' || type === 'overview') {
          result.tickets = allRecords;
        }

        // Clean values before writing to file
        const cleanedResult = type === 'history' ? cleanHistoryData(result) : result;

        // PERSIST LOGIC: Store newly received webhook integration data on disk so it does not disappear
        writeSavedData(type, cleanedResult);

        return cleanedResult;
      } else {
        console.warn(`[API Webhook] Failsafe: Webhook response returned empty. Falling back to cached state...`);
      }
    } catch (error: any) {
      console.error('[API Webhook] Error proxying to N8N with pagination. Falling back to cached state/internal engine:', error);
      if (type === 'test') {
        return { success: false, error: error.message };
      }
    }
  } else if (type === 'test') {
    return { success: false, error: "No Webhook URL configured" };
  }

  // 1.5 Real-time direct proxy for general reads (overview, predictions, history)
  if (n8nWebhookUrl && !isSyncOrTestAction && type !== 'chat') {
    try {
      console.log(`[API Webhook Proxy] Proxying type: ${type} to N8N Webhook: ${n8nWebhookUrl}`);
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`[API Webhook Proxy] N8N replied successfully for type: ${type}`);
        // Persist history/prediction/overview if they match data attributes so local fallbacks are fully updated too
        if (data && typeof data === 'object') {
          writeSavedData(type, data);
        }
        return data;
      } else {
        console.warn(`[API Webhook Proxy] N8N replied with status: ${response.status}. Falling back to cached state.`);
      }
    } catch (err: any) {
      console.error(`[API Webhook Proxy] Error direct proxying to N8N:`, err.message);
    }
  }

  // 2. High-fidelity persistent & automatic fallback
  switch (type) {
    case 'test': {
      return {
        success: true,
        source: 'internal-test',
        message: "Offline test mode: Target endpoint has not been verified"
      };
    }
    
    case 'overview': {
      // First, try to compute from history
      const calculatedOverview = calculateOverviewFromHistory();
      if (calculatedOverview) {
        calculatedOverview.overview.workflowConnected = !!n8nWebhookUrl;
        return calculatedOverview;
      }

      const data = getOrInitData('overview');
      
      // Compute dynamic overrides from prediction.json if accessible so that dashboard stats match local adjustments
      try {
        const predData = getOrInitData('prediction');
        const tickets = Array.isArray(predData?.tickets) ? predData.tickets : [];
        const agents = Array.isArray(predData?.agents) ? predData.agents : [];
        
        const totalTickets = tickets.length;
        const breachedCount = tickets.filter((t: Ticket) => t.elapsed_time > t.sla_limit).length;
        const warningCount = tickets.filter((t: Ticket) => t.risk_level === 'Warning').length;
        const highRiskCount = tickets.filter((t: Ticket) => t.risk_level === 'High Risk').length;
        
        const urgentCount = tickets.filter((t: Ticket) => t.priority === 'Urgent').length;
        const highCount = tickets.filter((t: Ticket) => t.priority === 'High').length;
        const normalCount = tickets.filter((t: Ticket) => t.priority === 'Normal').length;
        const lowCount = tickets.filter((t: Ticket) => t.priority === 'Low').length;

        if (data.overview && data.source === 'internal') {
          data.overview.totalTickets = totalTickets;
          data.overview.breachedCount = breachedCount;
          data.overview.warningCount = warningCount;
          data.overview.highRiskCount = highRiskCount;
          data.overview.activeAgentsCount = agents.filter((a: any) => a.status === 'Online').length;
          data.overview.priorityBreakdown = {
            Urgent: urgentCount,
            High: highCount,
            Normal: normalCount,
            Low: lowCount
          };
        }
      } catch (e) {
        // Fallback gracefully to existing overview structure if prediction is unparseable
      }
      
      if (data.overview) {
        data.overview.workflowConnected = !!n8nWebhookUrl;
      }
      return data;
    }

    case 'history': {
      // Retrieve history from cache or fallback data
      const historyData = readSavedData('history') || getOrInitData('history');
      let baseHistory = Array.isArray(historyData) 
        ? historyData 
        : (historyData.history || historyData.data || []);

      // Get filters from payload or body
      const filterSite = payload?.site || body.site;
      const filterService = payload?.service || body.service;
      const search = payload?.search || body.search;

      const cleanFilterSite = filterSite ? cleanSiteName(filterSite) : '';
      const cleanFilterService = filterService ? cleanServiceName(filterService) : '';

      if (cleanFilterSite && cleanFilterSite !== 'All Global Sites' && cleanFilterSite.toLowerCase() !== 'all global sites') {
        baseHistory = baseHistory.filter((h: any) => cleanSiteName(h.site) === cleanFilterSite);
      }
      if (cleanFilterService && cleanFilterService !== 'All Global Sites' && cleanFilterService !== 'Premium Support' && cleanFilterService.toLowerCase() !== 'premium support' && cleanFilterService !== 'All Services' && cleanFilterService.toLowerCase() !== 'all services') {
        baseHistory = baseHistory.filter((h: any) => cleanServiceName(h.service) === cleanFilterService || (h.service && cleanServiceName(h.service).toLowerCase().includes(cleanFilterService.toLowerCase())));
      }
      if (search && typeof search === 'string' && search.trim()) {
        const query = search.toLowerCase();
        baseHistory = baseHistory.filter((h: any) => 
          (h.site && h.site.toLowerCase().includes(query)) ||
          (h.service && h.service.toLowerCase().includes(query)) ||
          (h.jour && h.jour.toLowerCase().includes(query))
        );
      }

      // Sort by date (jour) descending
      baseHistory.sort((a: any, b: any) => {
        const dateA = a.jour || '';
        const dateB = b.jour || '';
        return dateB.localeCompare(dateA);
      });

      // Pagination
      const page = parseInt(payload?.page || body.page || '1', 10);
      const limit = parseInt(payload?.limit || body.limit || '10', 10);
      const totalCount = baseHistory.length;
      const totalPages = Math.ceil(totalCount / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginatedSlice = baseHistory.slice(startIndex, startIndex + limit);

      // Extract the 7 most recent unique days for "lastWeekRecords"
      const uniqueDays = Array.from(new Set(baseHistory.map((h: any) => h.jour))).filter(Boolean) as string[];
      uniqueDays.sort((a, b) => b.localeCompare(a));
      const sliceDays = uniqueDays.slice(0, 7);
      const lastWeekRecords = baseHistory.filter((h: any) => sliceDays.includes(h.jour));

      // Extract raw chart records (last 30 unique days to prevent browser freezing)
      const chartDays = uniqueDays.slice(0, 30);
      const chartRecordsRaw = baseHistory.filter((h: any) => chartDays.includes(h.jour));

      return {
        source: 'internal-paginated',
        success: true,
        history: paginatedSlice,
        totalCount,
        totalPages,
        currentPage: page,
        lastWeekRecords,
        chartRecordsRaw
      };
    }

    case 'prediction': {
      const data = getOrInitData('prediction');
      const tickets = Array.isArray(data.tickets) ? data.tickets : [];

      if (payload?.action === 'addTicket') {
        const newTicket: Ticket = {
          id: `T-${1000 + tickets.length + 31}`,
          subject: payload.subject || "Incoming Support Query",
          priority: payload.priority || "Normal",
          queue: payload.queue || "Technical Support",
          created_at: new Date().toISOString(),
          elapsed_time: 0,
          sla_limit: payload.priority === 'Urgent' ? 15 : payload.priority === 'High' ? 60 : payload.priority === 'Normal' ? 120 : 240,
          predicted_wait_time: payload.priority === 'Urgent' ? 6 : payload.priority === 'High' ? 22 : payload.priority === 'Normal' ? 45 : 95,
          risk_level: 'Safe',
          assignee: 'Unassigned',
          ai_recommendation: "Allocating to next available team member. Auto-analyzing customer sentiment."
        };
        tickets.unshift(newTicket);
        data.tickets = tickets;
        writeSavedData('prediction', data);
      }

      if (payload?.action === 'simulateTick') {
        data.tickets = tickets.map((t: Ticket) => {
          const newElapsed = t.elapsed_time + 1;
          const isBreached = newElapsed > t.sla_limit;
          let newRisk = t.risk_level;
          
          if (isBreached) {
            newRisk = 'High Risk';
          } else if (newElapsed + t.predicted_wait_time > t.sla_limit) {
            newRisk = 'High Risk';
          } else if (newElapsed + t.predicted_wait_time > t.sla_limit * 0.85) {
            newRisk = 'Warning';
          }
          
          return {
            ...t,
            elapsed_time: newElapsed,
            risk_level: newRisk
          };
        });
        writeSavedData('prediction', data);
      }

      if (payload?.action === 'resolveTicket') {
        data.tickets = tickets.filter((t: Ticket) => t.id !== payload.ticketId);
        writeSavedData('prediction', data);
      }

      return data;
    }

    case 'chat': {
      const payloadObj = payload || {};
      const queryText = payloadObj.query || payloadObj.message || body.query || body.message || "";
      const history = payloadObj.history || [];
      
      if (!queryText.trim()) {
        return { 
          source: 'internal', 
          text: "Please enter a question to start exploring AI dashboard insights.",
          reply: "Please enter a question to start exploring AI dashboard insights."
        };
      }

      const predData = getOrInitData('prediction');
      const currentTickets = Array.isArray(predData?.tickets) ? predData.tickets : [];
      const currentAgents = Array.isArray(predData?.agents) ? predData.agents : [];

      // If N8N Webhook is configured, attempt to get response from N8N first!
      if (n8nWebhookUrl) {
        try {
          console.log(`[API Webhook Chat] Proxying chat request to N8N Webhook: ${n8nWebhookUrl}`);
          // Send request with standardized parameters so N8N receives all options
          const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'chat',
              payload: {
                query: queryText,
                message: queryText,
                history: history
              },
              query: queryText,
              message: queryText
            })
          });

          if (response.ok) {
            const rawData = await response.json();
            console.log(`[API Webhook Chat] N8N response successful:`, rawData);
            
            // Helper function to extract chat content from various possible return styles of N8N
            const extractReplyText = (data: any): string | null => {
              if (!data) return null;
              if (Array.isArray(data)) {
                if (data.length === 0) return null;
                return extractReplyText(data[0]);
              }
              if (typeof data === 'string') {
                return data;
              }
              if (typeof data === 'object') {
                // Check direct matching keys
                const commonKeys = ['reply', 'text', 'message', 'output', 'response', 'content', 'fulfillmentText'];
                for (const k of commonKeys) {
                  if (k in data && typeof data[k] === 'string' && data[k].trim()) {
                    return data[k];
                  }
                }
                // Check if nested in 'data' object
                if (data.data) {
                  const nestedRes = extractReplyText(data.data);
                  if (nestedRes) return nestedRes;
                }
                // Check if any standard string value is of decent size
                for (const v of Object.values(data)) {
                  if (typeof v === 'string' && v.trim().length > 5) {
                    return v;
                  }
                }
              }
              return null;
            };

            const n8nTextResponse = extractReplyText(rawData);
            if (n8nTextResponse) {
              return {
                source: 'n8n-workflow',
                text: n8nTextResponse,
                reply: n8nTextResponse,
                data: rawData
              };
            }
          }
          console.warn(`[API Webhook Chat] N8N did not return a valid reply field. Falling back...`);
        } catch (webhookErr: any) {
          console.error(`[API Webhook Chat] Error while proxying chat to N8N:`, webhookErr.message);
        }
      }

      // If we don't have a Gemini API Key, return smart mock insights, otherwise use the live API
      if (!geminiApiKey || geminiApiKey === "MY_GEMINI_API_KEY") {
        const mockReply = getSmartMockReply(queryText, currentTickets, currentAgents);
        return {
          source: 'internal-mock-ai',
          text: mockReply,
          reply: mockReply
        };
      }

      try {
        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        // Frame the system context grounding text about the current helpdesk state
        const openTicketsSummary = currentTickets.map((t: Ticket) => 
          `- ID: ${t.id}, Subject: "${t.subject}", Queue: ${t.queue}, Priority: ${t.priority}, Wait prediction: ${t.predicted_wait_time}m, Elapsed: ${t.elapsed_time}m, SLA limit: ${t.sla_limit}m, Risk: ${t.risk_level}`
        ).join("\n");

        const agentsSummary = currentAgents.map((a: AgentPerformance) => 
          `- Agent: ${a.name}, Status: ${a.status}, SLA Rate: ${a.slaAdherenceRate}%, Active queue: ${a.resolvedCount} resolved`
        ).join("\n");

        const systemInstruction = `You are a helpful IT Support Team Coordinator. You have access to a live wait time prediction and SLA breach forecast system.
Here is the current real-time state of the dashboard:
OPEN TICKETS IN QUEUE:
${openTicketsSummary}

AGENTS & PERFORMANCE:
${agentsSummary}

Use this data to answer queries. Be highly specific, cite exact Ticket IDs and Agent Names when discussing issues, and propose realistic re-allocation strategies to prevent SLA breaches. Give concise, actionable layout recommendations, resource distributions, and insights in markdown. Do NOT use emojis excessively. Maintain a professional Helpdesk Analyst tone.`;

        // Format Gemini chats API
        const formattedHistory = history.map((h: ChatMessage) => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            ...formattedHistory,
            { role: 'user', parts: [{ text: queryText }] }
          ],
          config: {
            systemInstruction
          }
        });

        const replyContent = response.text || "I was unable to retrieve a response from the intelligence module.";
        return {
          source: 'gemini',
          text: replyContent,
          reply: replyContent
        };
      } catch (geminiError: any) {
        console.error('[API Webhook] Gemini AI processing failure, falling back to heuristic mock:', geminiError);
        const fallbackReply = getSmartMockReply(queryText, currentTickets, currentAgents);
        return {
          source: 'internal-mock-ai-fallback',
          text: `[System Note: Offline fallback enabled due to an upstream interface error: ${geminiError.message}]\n\n${fallbackReply}`,
          reply: `[System Note: Offline fallback enabled due to an upstream interface error: ${geminiError.message}]\n\n${fallbackReply}`
        };
      }
    }

    default:
      return { error: `Unsupported body.type: ${type}` };
  }
}

function getSmartMockReply(query: string, tickets: Ticket[], agents: AgentPerformance[]): string {
  const qLower = query.toLowerCase();
  
  // Custom heuristics based on user's query
  if (qLower.includes('breach') || qLower.includes('risk') || qLower.includes('sla')) {
    const riskTickets = tickets.filter(t => t.risk_level === 'High Risk' || t.risk_level === 'Warning');
    if (riskTickets.length === 0) {
      return "All queues look exceptionally stable today. There are currently no tickets at risk of breaching their SLA targets within the forecast horizon.";
    }
    const lines = riskTickets.map(t => `↳ **Ticket ${t.id}** (${t.subject}): Priority **${t.priority}** in **${t.queue}** queue. Elapsed time: **${t.elapsed_time}m** of **${t.sla_limit}m** limit. Predicted remaining wait: **${t.predicted_wait_time}m**.`);
    return `### ⚠️ Real-time SLA Risk Insights
I've analyzed the queue pipelines. There are currently **${riskTickets.length} tickets** exceeding or close to their SLA limit:

${lines.join('\n')}

**Recommended Allocation Strategy:**
1. Reallocate **Alex Rivera** (SLA Rate: 97.4%) or **Elena Rostova** (SLA Rate: 98.2%) to handle **Ticket ${riskTickets[0].id}** in Technical Support immediately.
2. Direct **Marcus Vance** to billing backlog to support **Sarah Chen** on urgent billing downgrades.`;
  }
  
  if (qLower.includes('agent') || qLower.includes('staff') || qLower.includes('team')) {
    const onlineAgents = agents.filter(a => a.status === 'Online');
    const awayAgents = agents.filter(a => a.status === 'Away');
    return `### 👥 Helpdesk Resource Analysis
Current workforce capacity is operating at a favorable posture:
- **Online & Idle/Working:** ${onlineAgents.map(a => `**${a.name}** (${a.slaAdherenceRate}% SLA Adherence)`).join(', ')}
- **Away/On Break:** ${awayAgents.map(a => `**${a.name}**`).join(', ')}

**Task Concentration:**
- **Technical Support queue is heavily congested.** It is handling 65% of incoming ticket volumes today, with average wait times trending up to 18.2 minutes.
- **Onboarding workloads** are fully indexed. Marcus Vance is successfully managing regular accounts.

**Staffing Insight:**
We should trigger an SLA preventive shift reassigning Elena Rostova from general inquiries to Technical Support to alleviate the Urgent tier burden.`;
  }

  if (qLower.includes('billing') || qLower.includes('invoice')) {
    const billingTickets = tickets.filter(t => t.queue === 'Billing');
    return `### 💳 Billing Queue Deep-Dive
The Billing queue is currently holding **${billingTickets.length} active queries**. The average response times are holding stable at **12.5 minutes**, which remains well under the 15-minute SLA limit.

**Highlighted Issue:**
- **Ticket T-1025** is flagged as a Warning. It's an Enterprise customer request processing a subscription downgrade with a 40-minute wait in a 60-minute SLA window.
- Assignee **Sarah Chen** is active. Let's monitor her speed or delegate assistance if normal priority queries build up.`;
  }

  // General helpful response referencing state
  return `### Helpdesk Status Overview
I am your **AI Operations Assistant** connected directly to the wait time forecasting system.
Here is the high-level situation:
- You have **${tickets.length} open tickets** currently in active queues.
- **${tickets.filter(t => t.risk_level === 'High Risk').length} ticket(s)** are currently flagged as **High Risk** of breaching their designated SLA limits.
- **${agents.filter(a => a.status === 'Online').length} out of ${agents.length} agents** are actively logged on.

*Ask me about:*
- "Identify tickets at risk of breaching SLAs"
- "Suggest an agent allocation plan for technical support backlog"
- "Give me a summary of billing queue performance"`;
}
