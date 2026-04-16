export interface RetellWebhookDto {
  event?: string;
  call_id: string;
  agent_id: string;
  call_status?: string;
  call_direction?: 'inbound' | 'outbound';
  from_number?: string;
  to_number?: string;
  duration_ms?: number;
  duration?: number;
  transcript?: string;
  recording_url?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  custom_analysis_data?: {
    interest_level?: 'high' | 'medium' | 'low';
    is_serious_buyer?: boolean;
    sentiment?: 'positive' | 'neutral' | 'negative';
    notes?: string;
    name?: string;
    [key: string]: unknown;
  };
}
