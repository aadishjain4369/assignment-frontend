import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';

import type { Sub } from './types';

type SubscriptionsCardProps = {
  subs: Sub[];
  onAddSubscription: () => void;
  onSigningAction: (source: string, action: 'rotate' | 'disable') => Promise<void>;
  onCancelSub: (source: string) => Promise<void>;
  onActionError: (message: string) => void;
};

export function SubscriptionsCard({
  subs,
  onAddSubscription,
  onSigningAction,
  onCancelSub,
  onActionError,
}: SubscriptionsCardProps) {
  const columns: ColumnsType<Sub> = useMemo(
    () => [
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
        render: (_: unknown, s: Sub) => (
          <Typography.Text code copyable={{ text: s.ingestKey }} style={{ fontSize: 12 }}>
            {s.ingestKey.slice(0, 10)}…
          </Typography.Text>
        ),
      },
      {
        title: 'Signing',
        key: 'signing',
        width: 88,
        render: (_: unknown, s: Sub) =>
          s.signingEnabled ? <Tag color="success">On</Tag> : <Tag>Off</Tag>,
      },
      {
        title: 'Callback',
        key: 'callback',
        ellipsis: true,
        render: (_: unknown, s: Sub) =>
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
        width: 88,
        render: (_: unknown, s: Sub) =>
          s.active ? <Tag color="processing">Active</Tag> : <Tag>Ended</Tag>,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 300,
        fixed: 'right',
        render: (_: unknown, s: Sub) =>
          s.active ? (
            <Space size="small" wrap>
              <Button
                size="small"
                onClick={() =>
                  void onSigningAction(s.source, 'rotate').catch((e) =>
                    onActionError(e instanceof Error ? e.message : String(e))
                  )
                }
              >
                Rotate secret
              </Button>
              {s.signingEnabled ? (
                <Button
                  size="small"
                  onClick={() =>
                    void onSigningAction(s.source, 'disable').catch((e) =>
                      onActionError(e instanceof Error ? e.message : String(e))
                    )
                  }
                >
                  Disable HMAC
                </Button>
              ) : null}
              <Button
                size="small"
                danger
                onClick={() =>
                  void onCancelSub(s.source).catch((e) =>
                    onActionError(e instanceof Error ? e.message : String(e))
                  )
                }
              >
                Deactivate
              </Button>
            </Space>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
    ],
    [onSigningAction, onCancelSub, onActionError]
  );

  return (
    <Card
      className="dashboard-card"
      title="Subscriptions"
      variant="borderless"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={onAddSubscription}>
          Add subscription
        </Button>
      }
    >
      <Table<Sub>
        size="small"
        rowKey={(r) => r._id}
        columns={columns}
        dataSource={subs}
        pagination={false}
        scroll={{ x: 980 }}
        locale={{ emptyText: 'No active subscriptions.' }}
      />
    </Card>
  );
}
