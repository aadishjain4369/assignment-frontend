import { Alert, Button, Modal, Typography } from 'antd';

type SigningSecretModalProps = {
  open: boolean;
  secret: string;
  onClose: () => void;
};

export function SigningSecretModal({ open, secret, onClose }: SigningSecretModalProps) {
  return (
    <Modal
      title="Signing secret"
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          Done
        </Button>
      }
      destroyOnClose
      width={480}
      className="dashboard-secret-modal"
    >
      <Alert
        type="warning"
        showIcon
        message="Store this secret now — it won’t be shown again."
        style={{ marginBottom: 16 }}
      />
      <Typography.Paragraph
        copyable={{ text: secret }}
        className="mono break dashboard-secret-value"
        style={{ marginBottom: 0, wordBreak: 'break-all' }}
      >
        {secret}
      </Typography.Paragraph>
    </Modal>
  );
}
