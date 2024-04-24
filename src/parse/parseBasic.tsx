

export interface UsageData {
    [model: string]: number | string | number[];
}

export interface Usage {
    [user: string]: UsageData[];
}

export interface Record {
    api_key_name?: string;
    model: string;
    n_context_tokens_total: string;
    n_generated_tokens_total: string;
    timestamp: string;
  }