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
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.localToken}`
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      const text = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        errorData = { type: 'http_error', title: `HTTP Error ${res.status}`, detail: text };
      }
      throw new IRISError(errorData);
    }
    return res.json();
  }

  public patients = {
    sync: (payload: { externalPatientId: string; name: string; dob: string; gender: string; testRequests: Array<{testName: string, testCategory?: string}>, sampleType?: string, requestingClinician?: string, clinicalNotes?: string }) => 
      this.request('POST', '/v1/patients/sync', payload)
  };

  public results = {
    list: (externalPatientId: string) => 
      this.request('GET', `/v1/results/${externalPatientId}`),
    getFHIR: (externalPatientId: string) =>
      this.request('GET', `/v1/results/${externalPatientId}/fhir`)
  };

  public webhooks = {
    register: (payload: { url: string; events: string[] }) =>
      this.request('POST', '/v1/webhooks', payload),
    list: () =>
      this.request('GET', '/v1/webhooks'),
    delete: (webhookId: string) =>
      this.request('DELETE', `/v1/webhooks/${webhookId}`)
  };
}