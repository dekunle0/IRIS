export class TokenBucket {
  private capacity: number;
  private tokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(capacity: number, tokensPerSecond: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = tokensPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  public async consume(tokensToConsume: number = 1): Promise<boolean> {
    this.refill();
    if (this.tokens >= tokensToConsume) {
      this.tokens -= tokensToConsume;
      return true;
    }
    return false;
  }
}

