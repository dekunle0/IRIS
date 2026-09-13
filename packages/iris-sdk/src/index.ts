export class IRISError extends Error {
  type: string;
  title?: string;
  detail?: string;

  constructor(data: any) {
    super(data.detail || data.title || 'IRIS API Error');
    this.type = data.type || 'unknown_error';
    this.title = data.title;
    this.detail = data.detail;
  }
}

export class IRISClient {
  private baseUrl: string;
  private localToken: string;

  constructor(config: { baseUrl: string; localToken: string }) {
    this.baseUrl = config.baseUrl;
    this.localToken = config.localToken;
  }

  private async request(method: string, endpoint: string, body?: any) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.localToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json();
    if (!res.ok) throw new IRISError(data);
    return data;
  }

  public patients = {
    sync: (payload: { externalPatientId: string; name: string; dob: string; gender: string; testRequests: Array<{testType: string}> }) => 
      this.request('POST', '/v1/patients/sync', payload)
  };

  public results = {
    list: (externalPatientId: string) => 
      this.request('GET', `/v1/results/${externalPatientId}`)
  };
}