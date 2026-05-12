import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';

import type { FeedEvent } from './types';

type EventHistoryCardProps = {
  feedItems: FeedEvent[];
  feedLimit: number;
  feedLoadingMore: boolean;
  filterEventType: string;
  filterSource: string;
  onFilterEventType: (value: string) => void;
  onFilterSource: (value: string) => void;
  onLoadMore: () => void;
};

export function EventHistoryCard({
  feedItems,
  feedLimit,
  feedLoadingMore,
  filterEventType,
  filterSource,
  onFilterEventType,
  onFilterSource,
  onLoadMore,
}: EventHistoryCardProps) {
  const columns: ColumnsType<FeedEvent> = useMemo(
    () => [
      {
        title: 'Time',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 168,
        render: (v: string | undefined) => (v ? new Date(v).toLocaleString() : '—'),
      },
      {
        title: 'Event',
        dataIndex: 'eventType',
        key: 'eventType',
        filterDropdown: ({ confirm, clearFilters }) => (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input.Search
              allowClear
              placeholder="Filter"
              defaultValue={filterEventType}
              key={`et-${filterEventType || 'x'}`}
              onSearch={(val) => {
                onFilterEventType(val.trim());
                confirm();
              }}
              onClear={() => {
                onFilterEventType('');
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
              placeholder="Filter"
              defaultValue={filterSource}
              key={`src-${filterSource || 'x'}`}
              onSearch={(val) => {
                onFilterSource(val.trim());
                confirm();
              }}
              onClear={() => {
                onFilterSource('');
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
        width: 132,
        render: (_: unknown, row: FeedEvent) => {
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
    [filterEventType, filterSource, onFilterEventType, onFilterSource]
  );

  return (
    <Card className="dashboard-card" title="Events" variant="borderless">
      <Table<FeedEvent>
        size="small"
        rowKey={(r) => String(r._id)}
        columns={columns}
        dataSource={feedItems}
        pagination={false}
        locale={{ emptyText: 'No events recorded.' }}
        expandable={{
          expandedRowRender: (row) => (
            <pre className="dashboard-event-payload">
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
      <div className="dashboard-events-footer">
        <Button
          type="default"
          disabled={feedLoadingMore || feedItems.length === 0}
          loading={feedLoadingMore}
          onClick={() => onLoadMore()}
        >
          Older
        </Button>
        <Typography.Text type="secondary" className="small">
          {feedItems.length} shown · {feedLimit} per page
        </Typography.Text>
      </div>
    </Card>
  );
}
