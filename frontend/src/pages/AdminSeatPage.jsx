import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;

const zh = {
  title: "\u5ea7\u4f4d\u7ba1\u7406",
  subtitle: "\u65b0\u589e\u3001\u7f16\u8f91\u3001\u542f\u7528\u3001\u505c\u7528\u548c\u5220\u9664\u56fe\u4e66\u9986\u5ea7\u4f4d\u3002",
  addSeat: "\u65b0\u589e\u5ea7\u4f4d",
  editSeat: "\u7f16\u8f91\u5ea7\u4f4d",
  seatCreated: "\u5ea7\u4f4d\u521b\u5efa\u6210\u529f\u3002",
  seatUpdated: "\u5ea7\u4f4d\u66f4\u65b0\u6210\u529f\u3002",
  seatDeleted: "\u5ea7\u4f4d\u5220\u9664\u6210\u529f\u3002",
  seatEnabled: "\u5ea7\u4f4d\u542f\u7528\u6210\u529f\u3002",
  seatDisabled: "\u5ea7\u4f4d\u505c\u7528\u6210\u529f\u3002",
  seatNo: "\u5ea7\u4f4d\u7f16\u53f7",
  area: "\u533a\u57df",
  row: "\u6392",
  col: "\u5217",
  status: "\u72b6\u6001",
  enableStatus: "\u542f\u7528\u72b6\u6001",
  actions: "\u64cd\u4f5c",
  edit: "\u7f16\u8f91",
  enable: "\u542f\u7528",
  disable: "\u505c\u7528",
  delete: "\u5220\u9664",
  save: "\u4fdd\u5b58",
  deleteTitle: "\u786e\u8ba4\u5220\u9664\u8be5\u5ea7\u4f4d\uff1f",
  deleteDesc: "\u5df2\u9884\u7ea6\u6216\u6b63\u5728\u4f7f\u7528\u7684\u5ea7\u4f4d\u4e0d\u80fd\u5220\u9664\u3002",
  seatNoRequired: "\u8bf7\u8f93\u5165\u5ea7\u4f4d\u7f16\u53f7\u3002",
  areaRequired: "\u8bf7\u8f93\u5165\u533a\u57df\u3002",
  rowRequired: "\u8bf7\u8f93\u5165\u6392\u53f7\u3002",
  colRequired: "\u8bf7\u8f93\u5165\u5217\u53f7\u3002",
  statusText: {
    free: "\u7a7a\u95f2",
    reserved: "\u5df2\u9884\u7ea6",
    using: "\u4f7f\u7528\u4e2d",
    leaving: "\u6682\u79bb",
    disabled: "\u505c\u7528",
  },
  enableText: {
    enabled: "\u5df2\u542f\u7528",
    disabled: "\u5df2\u505c\u7528",
  },
};

const seatStatusOptions = [
  { value: "free", label: zh.statusText.free },
  { value: "reserved", label: zh.statusText.reserved },
  { value: "using", label: zh.statusText.using },
  { value: "leaving", label: zh.statusText.leaving },
  { value: "disabled", label: zh.statusText.disabled },
];

const enableStatusOptions = [
  { value: "enabled", label: zh.enableText.enabled },
  { value: "disabled", label: zh.enableText.disabled },
];

const statusColors = {
  free: "green",
  reserved: "gold",
  using: "red",
  leaving: "orange",
  disabled: "default",
};

function AdminSeatPage({ onSeatChanged }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  async function loadSeats() {
    setLoading(true);
    try {
      const response = await api.get("/admin/seats");
      setSeats(response.data.data || []);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSeats();
  }, []);

  function openCreateModal() {
    setEditingSeat(null);
    form.setFieldsValue({
      seat_no: "",
      area: "",
      row_no: 1,
      col_no: 1,
      status: "free",
      enable_status: "enabled",
    });
    setModalOpen(true);
  }

  function openEditModal(seat) {
    setEditingSeat(seat);
    form.setFieldsValue(seat);
    setModalOpen(true);
  }

  async function refreshAfterChange(messageText) {
    message.success(messageText);
    await loadSeats();
    onSeatChanged();
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editingSeat) {
        await api.put(`/admin/seats/${editingSeat.id}`, values);
        await refreshAfterChange(zh.seatUpdated);
      } else {
        await api.post("/admin/seats", values);
        await refreshAfterChange(zh.seatCreated);
      }
      setModalOpen(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(seat) {
    try {
      await api.delete(`/admin/seats/${seat.id}`);
      await refreshAfterChange(zh.seatDeleted);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  async function handleEnable(seat) {
    try {
      await api.patch(`/admin/seats/${seat.id}/enable`);
      await refreshAfterChange(zh.seatEnabled);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  async function handleDisable(seat) {
    try {
      await api.patch(`/admin/seats/${seat.id}/disable`);
      await refreshAfterChange(zh.seatDisabled);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  const columns = [
    { title: zh.seatNo, dataIndex: "seat_no", key: "seat_no" },
    { title: zh.area, dataIndex: "area", key: "area" },
    { title: zh.row, dataIndex: "row_no", key: "row_no", width: 90 },
    { title: zh.col, dataIndex: "col_no", key: "col_no", width: 90 },
    {
      title: zh.status,
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={statusColors[status]}>{zh.statusText[status] || status}</Tag>,
    },
    {
      title: zh.enableStatus,
      dataIndex: "enable_status",
      key: "enable_status",
      render: (enableStatus) => (
        <Tag color={enableStatus === "enabled" ? "green" : "default"}>
          {zh.enableText[enableStatus] || enableStatus}
        </Tag>
      ),
    },
    {
      title: zh.actions,
      key: "actions",
      width: 300,
      render: (_, seat) => (
        <Space wrap>
          <Button size="small" onClick={() => openEditModal(seat)}>
            {zh.edit}
          </Button>
          {seat.enable_status === "enabled" ? (
            <Button size="small" onClick={() => handleDisable(seat)}>
              {zh.disable}
            </Button>
          ) : (
            <Button size="small" type="primary" onClick={() => handleEnable(seat)}>
              {zh.enable}
            </Button>
          )}
          <Popconfirm
            title={zh.deleteTitle}
            description={zh.deleteDesc}
            okText={zh.delete}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(seat)}
          >
            <Button size="small" danger>
              {zh.delete}
            </Button>
          </Popconfirm>
        </Space>
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
        <Button type="primary" onClick={openCreateModal}>
          {zh.addSeat}
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={seats}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 900 }}
      />

      <Modal
        title={editingSeat ? zh.editSeat : zh.addSeat}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={zh.save}
        cancelText="\u53d6\u6d88"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={zh.seatNo}
            name="seat_no"
            rules={[{ required: true, message: zh.seatNoRequired }]}
          >
            <Input placeholder="A-001" />
          </Form.Item>
          <Form.Item
            label={zh.area}
            name="area"
            rules={[{ required: true, message: zh.areaRequired }]}
          >
            <Input placeholder="Area A" />
          </Form.Item>
          <Space className="full-width" size="middle">
            <Form.Item
              label={zh.row}
              name="row_no"
              rules={[{ required: true, message: zh.rowRequired }]}
            >
              <InputNumber min={1} precision={0} />
            </Form.Item>
            <Form.Item
              label={zh.col}
              name="col_no"
              rules={[{ required: true, message: zh.colRequired }]}
            >
              <InputNumber min={1} precision={0} />
            </Form.Item>
          </Space>
          <Form.Item label={zh.status} name="status">
            <Select options={seatStatusOptions} />
          </Form.Item>
          <Form.Item label={zh.enableStatus} name="enable_status">
            <Select options={enableStatusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default AdminSeatPage;
