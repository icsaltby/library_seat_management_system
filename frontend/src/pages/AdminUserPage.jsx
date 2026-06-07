import { useEffect, useState } from "react";
import { Button, Popconfirm, Space, Table, Tag, Typography, message } from "antd";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;

const zh = {
  title: "\u7528\u6237\u7ba1\u7406",
  subtitle: "\u5c01\u7981\u6216\u89e3\u5c01\u666e\u901a\u7528\u6237\u3002",
  banned: "\u7528\u6237\u5df2\u5c01\u7981\u3002",
  unbanned: "\u7528\u6237\u5df2\u89e3\u5c01\u3002",
  id: "ID",
  username: "\u7528\u6237\u540d",
  realName: "\u771f\u5b9e\u59d3\u540d",
  studentNo: "\u5b66\u53f7",
  role: "\u89d2\u8272",
  status: "\u72b6\u6001",
  actions: "\u64cd\u4f5c",
  ban: "\u5c01\u7981",
  unban: "\u89e3\u5c01",
  banTitle: "\u786e\u8ba4\u5c01\u7981\u8be5\u7528\u6237\uff1f",
  roleText: {
    user: "\u666e\u901a\u7528\u6237",
    admin: "\u7ba1\u7406\u5458",
  },
  statusText: {
    active: "\u6b63\u5e38",
    banned: "\u5df2\u5c01\u7981",
  },
};

function AdminUserPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.data || []);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUserStatus(user, action) {
    try {
      await api.patch(`/admin/users/${user.id}/${action}`);
      message.success(action === "ban" ? zh.banned : zh.unbanned);
      await loadUsers();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  const columns = [
    { title: zh.id, dataIndex: "id", width: 80 },
    { title: zh.username, dataIndex: "username" },
    { title: zh.realName, dataIndex: "real_name" },
    { title: zh.studentNo, dataIndex: "student_no" },
    {
      title: zh.role,
      dataIndex: "role",
      render: (role) => <Tag color={role === "admin" ? "blue" : "default"}>{zh.roleText[role] || role}</Tag>,
    },
    {
      title: zh.status,
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>{zh.statusText[status] || status}</Tag>
      ),
    },
    {
      title: zh.actions,
      width: 180,
      render: (_, user) =>
        user.status === "banned" ? (
          <Button size="small" onClick={() => updateUserStatus(user, "unban")}>
            {zh.unban}
          </Button>
        ) : (
          <Popconfirm
            title={zh.banTitle}
            okText={zh.ban}
            cancelText="\u53d6\u6d88"
            okButtonProps={{ danger: true }}
            onConfirm={() => updateUserStatus(user, "ban")}
          >
            <Button size="small" danger disabled={user.role === "admin"}>
              {zh.ban}
            </Button>
          </Popconfirm>
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
        dataSource={users}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 900 }}
      />
    </Space>
  );
}

export default AdminUserPage;
