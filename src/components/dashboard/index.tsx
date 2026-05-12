import { Alert, Form } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { validatePlainObject } from '../../lib/utils';

import { AddSubscriptionModal } from './AddSubscriptionModal';
import { DashboardHeader } from './DashboardHeader';
import { EventHistoryCard } from './EventHistoryCard';
import { SigningSecretModal } from './SigningSecretModal';
import { SubscriptionsCard } from './SubscriptionsCard';
import {
  buildFeedSearchParams,
  mergePoll,
  type FeedEvent,
  type Sub,
  type SubscribeFields,
} from './types';

export function Dashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [subscribeForm] = Form.useForm<SubscribeFields>();

  const [filterEventType, setFilterEventType] = useState('');
  const [filterSource, setFilterSource] = useState('');

  const [feedItems, setFeedItems] = useState<FeedEvent[]>([]);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);

  const [signingSecret, setSigningSecret] = useState<string | null>(null);

  const [addSubscriptionOpen, setAddSubscriptionOpen] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

  const loadSubs = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch('/api/webhooks/subscriptions', token);
    const data = validatePlainObject(await res.json());
    if (!res.ok) {
      throw new Error(
        typeof data.error === 'string' ? data.error : 'Failed to load subscriptions'
      );
    }
    const items = data.items;
    setSubs(Array.isArray(items) ? (items as Sub[]) : []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadSubs().catch((e) => setSubsError(String(e)));
  }, [token, loadSubs]);

  useEffect(() => {
    setFeedItems([]);
  }, [filterEventType, filterSource]);

  function openAddSubscriptionModal() {
    setSubsError(null);
    subscribeForm.resetFields();
    setAddSubscriptionOpen(true);
  }

  function closeAddSubscriptionModal() {
    subscribeForm.resetFields();
    setAddSubscriptionOpen(false);
  }

  async function onSubscribe(values: SubscribeFields) {
    if (!token) return;
    setFormBusy(true);
    setSubsError(null);
    setSigningSecret(null);
    try {
      const body: Record<string, unknown> = { source: values.source.trim() };
      if (values.callbackUrl?.trim()) body.callbackUrl = values.callbackUrl.trim();
      if (values.enableSigning) body.enableSigning = true;
      const res = await apiFetch('/api/webhooks/subscriptions', token, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = validatePlainObject(await res.json());
      if (!res.ok) {
        throw new Error(
          (typeof data.error === 'string' ? data.error : null) ??
            `Subscribe failed (${res.status})`
        );
      }
      const secret =
        typeof data.signingSecret === 'string' ? data.signingSecret : undefined;
      if (secret) {
        setSigningSecret(secret);
        try {
          await navigator.clipboard.writeText(secret);
        } catch {}
      }
      subscribeForm.resetFields();
      await loadSubs();
      setAddSubscriptionOpen(false);
    } catch (err) {
      setSubsError(err instanceof Error ? err.message : String(err));
    } finally {
      setFormBusy(false);
    }
  }

  async function cancelSub(src: string) {
    if (!token) return;
    const enc = encodeURIComponent(src);
    const res = await apiFetch(`/api/webhooks/subscriptions/${enc}`, token, {
      method: 'DELETE',
    });
    const data = validatePlainObject(await res.json());
    if (!res.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Cancel failed');
    }
    await loadSubs();
  }

  async function signingAction(src: string, action: 'rotate' | 'disable') {
    if (!token) return;
    setSubsError(null);
    setSigningSecret(null);
    const enc = encodeURIComponent(src);
    const res = await apiFetch(`/api/webhooks/subscriptions/${enc}/signing`, token, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    const data = validatePlainObject(await res.json());
    if (!res.ok) {
      throw new Error(
        typeof data.error === 'string' ? data.error : 'Signing update failed'
      );
    }
    const secret =
      typeof data.signingSecret === 'string' ? data.signingSecret : undefined;
    if (secret) {
      setSigningSecret(secret);
      try {
        await navigator.clipboard.writeText(secret);
      } catch {}
    }
    await loadSubs();
  }

  const feedLimit = 50;

  const recordNewEvents = useCallback((items: FeedEvent[]) => {
    setFeedItems((prev) => mergePoll(prev, items));
  }, []);

  useEffect(() => {
    if (!token) return;
    const authToken = token;
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | undefined;
    let es: EventSource | null = null;

    async function pollTick() {
      try {
        const qs = buildFeedSearchParams({
          limit: feedLimit,
          eventType: filterEventType,
          source: filterSource,
        });
        const res = await apiFetch(`/api/webhooks/feed?${qs}`, authToken);
        const data = validatePlainObject(await res.json());
        if (!res.ok || cancelled) return;
        const items = data.items;
        recordNewEvents(Array.isArray(items) ? (items as FeedEvent[]) : []);
      } catch {}
    }

    void pollTick();
    pollId = setInterval(pollTick, 4000);

    const streamUrl = `${apiBase}/api/webhooks/feed/stream?access_token=${encodeURIComponent(authToken)}`;
    try {
      es = new EventSource(streamUrl, { withCredentials: true });
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as { type?: string; payload?: FeedEvent };
          if (msg.type === 'event' && msg.payload) {
            recordNewEvents([msg.payload]);
          }
        } catch {}
      };
    } catch {}

    return () => {
      cancelled = true;
      es?.close();
      if (pollId != null) clearInterval(pollId);
    };
  }, [token, feedLimit, filterEventType, filterSource, apiBase, recordNewEvents]);

  async function loadMoreFeed() {
    if (!token || feedItems.length === 0) return;
    const oldest = feedItems[feedItems.length - 1]?._id;
    if (!oldest) return;
    setFeedLoadingMore(true);
    try {
      const qs = buildFeedSearchParams({
        limit: feedLimit,
        eventType: filterEventType,
        source: filterSource,
        before: String(oldest),
      });
      const res = await apiFetch(`/api/webhooks/feed?${qs}`, token);
      const data = validatePlainObject(await res.json());
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Failed to load more'
        );
      }
      const items = data.items;
      const newItems = Array.isArray(items) ? (items as FeedEvent[]) : [];
      setFeedItems((prev) => {
        const ids = new Set(prev.map((e) => String(e._id)));
        const extra = newItems.filter((e) => !ids.has(String(e._id)));
        return [...prev, ...extra];
      });
    } finally {
      setFeedLoadingMore(false);
    }
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout">
      <DashboardHeader
        email={user.email}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      <main className="dashboard-main">
        <div className="dashboard-stack">
          {subsError ? (
            <Alert
              type="error"
              showIcon
              closable
              onClose={() => setSubsError(null)}
              message={subsError}
              className="dashboard-banner-alert"
            />
          ) : null}
          <SubscriptionsCard
            subs={subs}
            onAddSubscription={openAddSubscriptionModal}
            onSigningAction={signingAction}
            onCancelSub={cancelSub}
            onActionError={(msg) => setSubsError(msg)}
          />

          <EventHistoryCard
            feedItems={feedItems}
            feedLimit={feedLimit}
            feedLoadingMore={feedLoadingMore}
            filterEventType={filterEventType}
            filterSource={filterSource}
            onFilterEventType={setFilterEventType}
            onFilterSource={setFilterSource}
            onLoadMore={() => void loadMoreFeed()}
          />
        </div>
      </main>

      <AddSubscriptionModal
        open={addSubscriptionOpen}
        onCancel={closeAddSubscriptionModal}
        form={subscribeForm}
        formBusy={formBusy}
        onSubmit={(v) => void onSubscribe(v)}
      />

      <SigningSecretModal
        open={signingSecret !== null}
        secret={signingSecret ?? ''}
        onClose={() => setSigningSecret(null)}
      />
    </div>
  );
}
