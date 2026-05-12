export type Sub = {
  _id: string;
  source: string;
  ingestKey: string;
  callbackUrl?: string;
  active: boolean;
  cancelledAt?: string;
  signingEnabled?: boolean;
};

export type FeedEvent = {
  _id: string;
  source: string;
  eventType: string;
  externalId?: string;
  payload: unknown;
  processingTags?: string[];
  createdAt?: string;
};

export type SubscribeFields = {
  source: string;
  callbackUrl?: string;
  enableSigning?: boolean;
};

export function buildFeedSearchParams(opts: {
  limit: number;
  eventType?: string;
  source?: string;
  before?: string;
}): string {
  const p = new URLSearchParams();
  p.set('limit', String(opts.limit));
  const et = opts.eventType?.trim();
  const src = opts.source?.trim();
  if (et) p.set('eventType', et);
  if (src) p.set('source', src);
  if (opts.before) p.set('before', opts.before);
  return p.toString();
}

export function mergePoll(prev: FeedEvent[], incoming: FeedEvent[]): FeedEvent[] {
  if (incoming.length === 0) return prev;
  const oldestIncoming = String(incoming[incoming.length - 1]._id);
  const keptOlder = prev.filter((p) => String(p._id) < oldestIncoming);
  return [...incoming, ...keptOlder];
}
