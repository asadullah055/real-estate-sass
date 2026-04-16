import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const RETELL_BASE_URL = 'https://api.retellai.com';

interface RetellRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  apiKey?: string; // per-workspace override
}

async function retellFetch<T>(
  path: string,
  options: RetellRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, apiKey } = options;
  const key = apiKey || env.RETELL_API_KEY;

  const res = await fetch(`${RETELL_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.error('[retell] API error', { path, status: res.status, body: text });
    throw new Error(`Retell API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export interface RetellCallAnalysis {
  call_summary?: string;
  in_voicemail?: boolean;
  /** Retell built-in: "Positive" | "Negative" | "Neutral" | "Unknown" */
  user_sentiment?: string;
  call_successful?: boolean;
  /** Your agent's custom post-call analysis output */
  custom_analysis_data?: {
    interest_level?: 'high' | 'medium' | 'low';
    is_serious_buyer?: boolean;
    /** Custom field — lowercase "positive" | "neutral" | "negative" */
    sentiment?: 'positive' | 'neutral' | 'negative';
    notes?: string;
    name?: string;
    [key: string]: unknown;
  };
}

export interface RetellCallResponse {
  call_id: string;
  call_type?: string;
  call_status: string;
  call_direction?: 'inbound' | 'outbound' | 'web_call';
  agent_id: string;
  from_number?: string;
  to_number?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  transcript?: string;
  recording_url?: string;
  call_analysis?: RetellCallAnalysis;
}

export const retellClient = {
  /** Create an outbound call */
  createCall(params: {
    from_number: string;
    to_number: string;
    agent_id: string;
    retell_llm_dynamic_variables?: Record<string, string>;
  }, apiKey?: string): Promise<RetellCallResponse> {
    return retellFetch<RetellCallResponse>('/v2/create-phone-call', {
      method: 'POST',
      body: params,
      apiKey,
    });
  },

  /** Get call details */
  getCall(callId: string, apiKey?: string): Promise<RetellCallResponse> {
    return retellFetch<RetellCallResponse>(`/v2/get-call/${callId}`, { apiKey });
  },

  /** List calls — Retell v2 POST /v2/list-calls returns a direct array */
  listCalls(
    params?: {
      limit?: number;
      pagination_key?: string;
      filter_criteria?: {
        call_status?: string[];
        agent_id?: string[];
        start_timestamp?: [number, number];
      };
      sort_order?: 'ascending' | 'descending';
    },
    apiKey?: string,
  ): Promise<RetellCallResponse[]> {
    return retellFetch<RetellCallResponse[]>('/v2/list-calls', {
      method: 'POST',
      body: params ?? {},
      apiKey,
    });
  },
};
