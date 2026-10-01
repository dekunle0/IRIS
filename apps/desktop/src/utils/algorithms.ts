class DLLNode {
  key: string;
  val: any;
  prev: DLLNode | null = null;
  next: DLLNode | null = null;
  constructor(key: string, val: any) { this.key = key; this.val = val; }
}

export class LRUCache {
  private capacity: number;
  private cache: Map<string, DLLNode>;
  private head: DLLNode;
  private tail: DLLNode;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = new DLLNode('', null); 
    this.tail = new DLLNode('', null); 
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private removeNode(node: DLLNode) {
    const prev = node.prev!;
    const next = node.next!;
    prev.next = next;
    next.prev = prev;
  }

  private addNodeToHead(node: DLLNode) {
    const temp = this.head.next!;
    this.head.next = node;
    node.prev = this.head;
    node.next = temp;
    temp.prev = node;
  }

  public get(key: string): any | null {
    if (this.cache.has(key)) {
      const node = this.cache.get(key)!;
      this.removeNode(node);
      this.addNodeToHead(node); 
      return node.val;
    }
    return null;
  }

  public put(key: string, value: any): void {
    if (this.cache.has(key)) {
      this.removeNode(this.cache.get(key)!);
    } else if (this.cache.size >= this.capacity) {
      const lru = this.tail.prev!;
      this.removeNode(lru);
      this.cache.delete(lru.key);
    }
    const newNode = new DLLNode(key, value);
    this.addNodeToHead(newNode);
    this.cache.set(key, newNode);
  }
}

export class WorklistPriorityQueue {
  private heap: any[] = [];

  public getWeight(item: any): number {
    let weight = 100;
    if (item.priority === 'stat') weight = 300;
    if (item.priority === 'urgent') weight = 200;
    const waitTimeMs = Date.now() - new Date(item.createdAt).getTime();
    return weight + (waitTimeMs / (1000 * 60 * 60)); 
  }

  private getParentIndex(i: number) { return Math.floor((i - 1) / 2); }
  private getLeftChildIndex(i: number) { return 2 * i + 1; }
  private getRightChildIndex(i: number) { return 2 * i + 2; }

  private swap(i1: number, i2: number) {
    const temp = this.heap[i1];
    this.heap[i1] = this.heap[i2];
    this.heap[i2] = temp;
  }

  private heapifyUp(index: number) {
    while (this.getParentIndex(index) >= 0 && this.getWeight(this.heap[this.getParentIndex(index)]) < this.getWeight(this.heap[index])) {
      this.swap(this.getParentIndex(index), index);
      index = this.getParentIndex(index);
    }
  }

  private heapifyDown(index: number) {
    let largest = index;
    const left = this.getLeftChildIndex(index);
    const right = this.getRightChildIndex(index);

    if (left < this.heap.length && this.getWeight(this.heap[left]) > this.getWeight(this.heap[largest])) largest = left;
    if (right < this.heap.length && this.getWeight(this.heap[right]) > this.getWeight(this.heap[largest])) largest = right;

    if (largest !== index) {
      this.swap(index, largest);
      this.heapifyDown(largest);
    }
  }

  public insert(item: any) {
    this.heap.push(item);
    this.heapifyUp(this.heap.length - 1);
  }

  public extractMax(): any {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return max;
  }

  public buildFromList(items: any[]) {
    this.heap = [];
    items.forEach(item => this.insert(item));
  }

  public toSortedArray(): any[] {
    const sorted = [];
    const originalHeap = [...this.heap]; 
    while (this.heap.length > 0) sorted.push(this.extractMax());
    this.heap = originalHeap; 
    return sorted;
  }
}

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  records: Set<any> = new Set(); 
}

export class SearchTrie {
  root: TrieNode = new TrieNode();
  public insert(word: string, record: any) {
    let node = this.root;
    const lowerWord = word.toLowerCase();
    for (const char of lowerWord) {
      if (!node.children.has(char)) node.children.set(char, new TrieNode());
      node = node.children.get(char)!;
      node.records.add(record); 
    }
  }
  public searchPrefix(prefix: string): any[] {
    let node = this.root;
    const lowerPrefix = prefix.toLowerCase();
    for (const char of lowerPrefix) {
      if (!node.children.has(char)) return [];
      node = node.children.get(char)!;
    }
    return Array.from(node.records);
  }
}

export function calculateEditDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // Deletion
        dp[i][j - 1] + 1,       // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  return dp[m][n];
}

export class CircularTelemetryQueue {
  private queue: number[];
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;
  private capacity: number;
  private sum: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.queue = new Array(capacity).fill(0);
  }

  public enqueue(val: number): number {
    if (this.size === this.capacity) {
      this.sum -= this.queue[this.head];
      this.head = (this.head + 1) % this.capacity;
    } else {
      this.size++;
    }
    this.queue[this.tail] = val;
    this.sum += val;
    this.tail = (this.tail + 1) % this.capacity;
    return Math.round(this.sum / this.size); 
  }
}


export function mergeSortLogs(arr: any[], order: 'asc' | 'desc'): any[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSortLogs(arr.slice(0, mid), order);
  const right = mergeSortLogs(arr.slice(mid), order);
  return merge(left, right, order);
}

function merge(left: any[], right: any[], order: 'asc' | 'desc'): any[] {
  let result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    const timeA = new Date(left[i].created_at).getTime();
    const timeB = new Date(right[j].created_at).getTime();
    if (order === 'desc' ? timeA >= timeB : timeA <= timeB) {
      result.push(left[i]); i++;
    } else {
      result.push(right[j]); j++;
    }
  }
  return result.concat(left.slice(i)).concat(right.slice(j));
}


export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const globalPatientCache = new LRUCache(50);