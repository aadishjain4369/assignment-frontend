import { Button, Checkbox, Form, Input, Modal, Space } from 'antd';
import type { FormInstance } from 'antd/es/form';

import type { SubscribeFields } from './types';

type AddSubscriptionModalProps = {
  open: boolean;
  onCancel: () => void;
  form: FormInstance<SubscribeFields>;
  formBusy: boolean;
  onSubmit: (values: SubscribeFields) => void;
};

export function AddSubscriptionModal({
  open,
  onCancel,
  form,
  formBusy,
  onSubmit,
}: AddSubscriptionModalProps) {
  return (
    <Modal
      title="New subscription"
      open={open}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" loading={formBusy} onClick={() => form.submit()}>
            Create
          </Button>
        </Space>
      }
      destroyOnClose
      width={480}
      className="dashboard-add-sub-modal"
    >
      <Form<SubscribeFields>
        className="dashboard-subscribe-form"
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(v) => onSubmit(v)}
        initialValues={{ enableSigning: false }}
        preserve={false}
      >
        <Form.Item name="source" label="Source" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. production-stripe" autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="callbackUrl"
          label="Callback URL"
          rules={[
            {
              validator: (_, value) => {
                const s = typeof value === 'string' ? value.trim() : '';
                if (!s) return Promise.resolve();
                try {
                  const parsed = new URL(s);
                  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                    return Promise.reject(new Error('Enter a valid HTTP or HTTPS URL'));
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
        <Form.Item name="enableSigning" valuePropName="checked" style={{ marginBottom: 0 }}>
          <Checkbox>HMAC verification for inbound requests</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
