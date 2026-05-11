import { SearchOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

type Sub = {
  _id: string;
  source: string;
  ingestKey: string;
  callbackUrl?: string;
  active: boolean;
  cancelledAt?: string;
  signingEnabled?: boolean;
};

type FeedEvent = {
  _id: string;
  source: string;
  eventType: string;
  externalId?: string;
  payload: unknown;
  processingTags?: string[];
  createdAt?: string;
};

type SubscribeFields = {
  source: string;
  callbackUrl?: string;
  enableSigning?: boolean;
};

function buildFeedSearchParams(opts: {
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

function mergePoll(prev: FeedEvent[], incoming: FeedEvent[]): FeedEvent[] {
  if (incoming.length === 0) return prev;
  const oldestIncoming = String(incoming[incoming.length - 1]._id);
  const keptOlder = prev.filter((p) => String(p._id) < oldestIncoming);
  return [...incoming, ...keptOlder];
}

export function DashboardPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [subscribeForm] = Form.useForm();

  const [filterEventType, setFilterEventType] = useState('');
  const [filterSource, setFilterSource] = useState('');

  const [feedItems, setFeedItems] = useState<FeedEvent[]>([]);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);

  const [signingNotice, setSigningNotice] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

  const loadSubs = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch('/api/webhooks/subscriptions', token);
    const data = (await res.json()) as { items?: Sub[]; error?: string };
    if (!res.ok) {
      throw new Error(data.error ?? 'Failed to load subscriptions');
    }
    setSubs(data.items ?? []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadSubs().catch((e) => setSubsError(String(e)));
  }, [token, loadSubs]);

  useEffect(() => {
    setFeedItems([]);
  }, [filterEventType, filterSource]);

  async function onSubscribe(values: SubscribeFields) {
    if (!token) return;
    setFormBusy(true);
    setSubsError(null);
    setSigningNotice(null);
    try {
      const body: Record<string, unknown> = { source: values.source.trim() };
      if (values.callbackUrl?.trim()) body.callbackUrl = values.callbackUrl.trim();
      if (values.enableSigning) body.enableSigning = true;
      const res = await apiFetch('/api/webhooks/subscriptions', token, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        signingSecret?: string;
        signingSecretNote?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? `Subscribe failed (${res.status})`);
      }
      if (data.signingSecret) {
        setSigningNotice(
          `${data.signingSecretNote ?? 'New signing secret'} Secret: ${data.signingSecret}`
        );
        try {
          await navigator.clipboard.writeText(data.signingSecret);
        } catch {}
      }
      subscribeForm.resetFields();
      await loadSubs();
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
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error ?? 'Cancel failed');
    }
    await loadSubs();
  }

  async function signingAction(src: string, action: 'rotate' | 'disable') {
    if (!token) return;
    setSubsError(null);
    setSigningNotice(null);
    const enc = encodeURIComponent(src);
    const res = await apiFetch(`/api/webhooks/subscriptions/${enc}/signing`, token, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    const data = (await res.json()) as {
      error?: string;
      signingSecret?: string;
      signingSecretNote?: string;
    };
    if (!res.ok) {
      throw new Error(data.error ?? 'Signing update failed');
    }
    if (data.signingSecret) {
      setSigningNotice(
        `${data.signingSecretNote ?? 'Rotated secret'} Secret: ${data.signingSecret}`
      );
      try {
        await navigator.clipboard.writeText(data.signingSecret);
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
        const data = (await res.json()) as { items?: FeedEvent[] };
        if (!res.ok || cancelled) return;
        recordNewEvents(data.items ?? []);
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
      const data = (await res.json()) as { items?: FeedEvent[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to load more');
      }
      const newItems = data.items ?? [];
      setFeedItems((prev) => {
        const ids = new Set(prev.map((e) => String(e._id)));
        const extra = newItems.filter((e) => !ids.has(String(e._id)));
        return [...prev, ...extra];
      });
    } finally {
      setFeedLoadingMore(false);
    }
  }

  const subsColumns: ColumnsType<Sub> = [
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Ingest key',
      key: 'ingestKey',
      width: 200,
      render: (_: unknown, s) => (
        <Typography.Text code copyable={{ text: s.ingestKey }} style={{ fontSize: 12 }}>
          {s.ingestKey.slice(0, 10)}…
        </Typography.Text>
      ),
    },
    {
      title: 'Signing',
      key: 'signing',
      width: 96,
      render: (_: unknown, s) =>
        s.signingEnabled ? <Tag color="success">HMAC</Tag> : <Tag>Off</Tag>,
    },
    {
      title: 'Callback',
      key: 'callback',
      ellipsis: true,
      render: (_: unknown, s) =>
        s.callbackUrl ? (
          <Typography.Text type="secondary" ellipsis={{ tooltip: s.callbackUrl }}>
            {s.callbackUrl}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 96,
      render: (_: unknown, s) =>
        s.active ? <Tag color="processing">Active</Tag> : <Tag>Cancelled</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, s) =>
        s.active ? (
          <Space size={0} wrap>
            <Button
              type="link"
              size="small"
              onClick={() =>
                void signingAction(s.source, 'rotate').catch((e) =>
                  setSubsError(e instanceof Error ? e.message : String(e))
                )
              }
            >
              Rotate secret
            </Button>
            {s.signingEnabled ? (
              <Button
                type="link"
                size="small"
                onClick={() =>
                  void signingAction(s.source, 'disable').catch((e) =>
                    setSubsError(e instanceof Error ? e.message : String(e))
                  )
                }
              >
                Disable HMAC
              </Button>
            ) : null}
            <Button
              type="link"
              size="small"
              danger
              onClick={() =>
                void cancelSub(s.source).catch((e) =>
                  setSubsError(e instanceof Error ? e.message : String(e))
                )
              }
            >
              Cancel sub
            </Button>
          </Space>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
  ];

  const eventColumns: ColumnsType<FeedEvent> = useMemo(
    () => [
      {
        title: 'When',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (v: string | undefined) => (v ? new Date(v).toLocaleString() : '—'),
      },
      {
        title: 'Type',
        dataIndex: 'eventType',
        key: 'eventType',
        filterDropdown: ({ confirm, clearFilters }) => (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input.Search
              allowClear
              placeholder="Exact match"
              defaultValue={filterEventType}
              key={`et-${filterEventType || 'x'}`}
              onSearch={(val) => {
                setFilterEventType(val.trim());
                confirm();
              }}
              onClear={() => {
                setFilterEventType('');
                clearFilters?.();
                confirm();
              }}
            />
          </div>
        ),
        filterIcon: (
          <SearchOutlined style={{ color: filterEventType ? '#1677ff' : undefined }} />
        ),
        filteredValue: filterEventType ? [filterEventType] : null,
      },
      {
        title: 'Source',
        dataIndex: 'source',
        key: 'source',
        filterDropdown: ({ confirm, clearFilters }) => (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input.Search
              allowClear
              placeholder="Exact match"
              defaultValue={filterSource}
              key={`src-${filterSource || 'x'}`}
              onSearch={(val) => {
                setFilterSource(val.trim());
                confirm();
              }}
              onClear={() => {
                setFilterSource('');
                clearFilters?.();
                confirm();
              }}
            />
          </div>
        ),
        filterIcon: (
          <SearchOutlined style={{ color: filterSource ? '#1677ff' : undefined }} />
        ),
        filteredValue: filterSource ? [filterSource] : null,
      },
      {
        title: 'Tags',
        key: 'tags',
        width: 140,
        render: (_: unknown, row) => {
          const t = row.processingTags ?? [];
          const s = t.slice(0, 2).join(', ');
          return (
            <span className="mono small">
              {s}
              {t.length > 2 ? '…' : ''}
            </span>
          );
        },
      },
    ],
    [filterEventType, filterSource]
  );

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout">
      <header className="bar">
        <div>
          <strong>Webhooks</strong>
          <span className="muted small"> · {user.email}</span>
        </div>
        <button
          type="button"
          className="linkish"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Log out
        </button>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-stack">
          <Card
            className="dashboard-card"
            title="Subscribe to a webhook"
            variant="borderless"
          >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              <strong>Source</strong> names your provider (for example <code>stripe</code>
              ). <strong>Callback URL</strong> is optional — if you set it, received
              events are POSTed there, with automatic retries on failure.
            </Typography.Paragraph>
            {subsError ? (
              <Alert
                type="error"
                showIcon
                closable
                onClose={() => setSubsError(null)}
                message={subsError}
                style={{ marginTop: 16 }}
              />
            ) : null}
            {signingNotice ? (
              <Alert
                type="info"
                showIcon
                className="mono break"
                message="Signing secret"
                description={signingNotice}
                style={{ marginTop: 16 }}
              />
            ) : null}
            <Form<SubscribeFields>
              className="dashboard-subscribe-form"
              form={subscribeForm}
              layout="vertical"
              requiredMark={false}
              onFinish={(v) => void onSubscribe(v)}
              initialValues={{ enableSigning: false }}
              style={{ marginTop: 16, maxWidth: 520 }}
            >
              <Form.Item
                name="source"
                label="Source name"
                rules={[{ required: true, message: 'Enter a source name' }]}
              >
                <Input placeholder="stripe" autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="callbackUrl"
                label="Callback URL (optional)"
                rules={[
                  {
                    validator: (_, value) => {
                      const s = typeof value === 'string' ? value.trim() : '';
                      if (!s) return Promise.resolve();
                      try {
                        const parsed = new URL(s);
                        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                          return Promise.reject(
                            new Error('Enter a valid HTTP or HTTPS URL')
                          );
                        }
                        return Promise.resolve();
                      } catch {
                        return Promise.reject(new Error('Enter a valid URL'));
                      }
                    },
                  },
                ]}
              >
                <Input type="url" placeholder="https://example.com/webhook" />
              </Form.Item>
              <Form.Item
                name="enableSigning"
                valuePropName="checked"
                style={{ marginBottom: 8 }}
              >
                <Checkbox>
                  Enable HMAC signing — inbound requests must send{' '}
                  <Typography.Text code>
                    X-Webhook-Signature: sha256=&lt;hex&gt;
                  </Typography.Text>{' '}
                  over the <strong>raw JSON body</strong> (secret shown once after save).
                </Checkbox>
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={formBusy}>
                    Subscribe
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          <Card
            className="dashboard-card"
            title="Your subscriptions"
            variant="borderless"
          >
            <Table<Sub>
              size="small"
              rowKey={(r) => r._id}
              columns={subsColumns}
              dataSource={subs}
              pagination={false}
              scroll={{ x: 900 }}
              locale={{ emptyText: 'No subscriptions yet.' }}
            />
            <Typography.Paragraph
              type="secondary"
              className="small"
              style={{ marginTop: 16, marginBottom: 0 }}
            >
              Inbound URL:{' '}
              <Typography.Text code>{apiBase}/api/webhooks/events</Typography.Text>. Send
              header <Typography.Text code>X-Ingest-Key</Typography.Text> (or JSON field{' '}
              <Typography.Text code>ingestKey</Typography.Text>). Optional{' '}
              <Typography.Text code>X-Webhook-Source</Typography.Text> overrides the
              stored source label. When signing is on, the provider must compute
              HMAC-SHA256 over the exact request body bytes and send{' '}
              <Typography.Text code>
                X-Webhook-Signature: sha256=&lt;hex&gt;
              </Typography.Text>
              .
            </Typography.Paragraph>
          </Card>

          <Card className="dashboard-card" title="Event history" variant="borderless">
            <Typography.Paragraph
              type="secondary"
              className="small"
              style={{ marginBottom: 16 }}
            >
              Live updates (SSE) with periodic refresh. Use the filter icons on Type and
              Source columns (exact match). Expand a row for full payload.
            </Typography.Paragraph>
            <Table<FeedEvent>
              size="small"
              rowKey={(r) => String(r._id)}
              columns={eventColumns}
              dataSource={feedItems}
              pagination={false}
              locale={{ emptyText: 'No events yet.' }}
              expandable={{
                expandedRowRender: (row) => (
                  <pre
                    style={{
                      margin: 0,
                      maxHeight: 320,
                      overflow: 'auto',
                      fontSize: 12,
                      background: '#f8fafc',
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    {JSON.stringify(
                      {
                        id: row._id,
                        source: row.source,
                        type: row.eventType,
                        externalId: row.externalId,
                        processingTags: row.processingTags ?? [],
                        createdAt: row.createdAt,
                        payload: row.payload,
                      },
                      null,
                      2
                    )}
                  </pre>
                ),
              }}
            />
            <div className="row-inline" style={{ marginTop: 12 }}>
              <Button
                type="default"
                disabled={feedLoadingMore || feedItems.length === 0}
                loading={feedLoadingMore}
                onClick={() => void loadMoreFeed()}
              >
                Load older events
              </Button>
              <Typography.Text type="secondary" className="small">
                {feedItems.length} row{feedItems.length === 1 ? '' : 's'} (max {feedLimit}{' '}
                per request)
              </Typography.Text>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
