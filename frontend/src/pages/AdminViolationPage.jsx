import { useEffect, useState } from "react";
import { Button, Space, Table, Tag, Typography, message } from "antd";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;

const zh = {
  title: "\u8fdd\u7ea6\u7ba1\u7406",
  subtitle: "\u67e5\u770b\u8fdd\u7ea6\u8bb0\u5f55\u5e76\u6807\u8bb0\u5904\u7406\u72b6\u6001\u3002",
  handledSuccess: "\u8fdd\u7ea6\u8bb0\u5f55\u5df2\u6807\u8bb0\u5904\u7406\u3002",
  id: "ID",
  user: "\u7528\u6237",
  seat: "\u5ea7\u4f4d",
  type: "\u7c7b\u578b",
  description: "\u8bf4\u660e",
  status: "\u5904\u7406\u72b6\u6001",
  createdAt: "\u521b\u5efa\u65f6\u95f4",
  actions: "\u64cd\u4f5c",
  markHandled: "\u6807\u8bb0\u5df2\u5904\u7406",
  statusText: {
    handled: "\u5df2\u5904\u7406",
    unhandled: "\u672a\u5904\u7406",
  },
  typeText: {
    reservation_timeout: "\u9884\u7ea6\u8d85\u65f6",
    leave_timeout: "\u6682\u79bb\u8d85\u65f6",
    demo: "\u6f14\u793a\u8bb0\u5f55",
  },
};

function AdminViolationPage() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadViolations() {
    setLoading(true);
    try {
      const response = await api.get("/admin/violations");
      setViolations(response.data.data || []);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadViolations();
  }, []);

  async function handleViolation(violation) {
    try {
      await api.patch(`/admin/violations/${violation.id}/handle`);
      message.success(zh.handledSuccess);
      await loadViolations();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  const columns = [
    { title: zh.id, dataIndex: "id", width: 80 },
    { title: zh.user, dataIndex: "username" },
    { title: zh.seat, dataIndex: "seat_no" },
    {
      title: zh.type,
      dataIndex: "violation_type",
      render: (type) => zh.typeText[type] || type,
    },
    { title: zh.description, dataIndex: "description" },
    {
      title: zh.status,
      dataIndex: "handle_status",
      render: (status) => (
        <Tag color={status === "handled" ? "green" : "gold"}>{zh.statusText[status] || status}</Tag>
      ),
    },
    { title: zh.createdAt, dataIndex: "created_at" },
    {
      title: zh.actions,
      width: 160,
      render: (_, violation) => (
        <Button
          size="small"
          type="primary"
          disabled={violation.handle_status === "handled"}
          onClick={() => handleViolation(violation)}
        >
          {zh.markHandled}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" className="full-width">
      <div className="page-heading">
        <div>
          <Title level={3}>{zh.title}</Title>
          <Text type="secondary">{zh.subtitle}</Text>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={violations}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 1100 }}
      />
    </Space>
  );
}

export default AdminViolationPage;
