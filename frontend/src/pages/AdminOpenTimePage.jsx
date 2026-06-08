import { useEffect, useState } from "react";
import { Button, Card, Form, InputNumber, Space, Spin, TimePicker, Typography, message } from "antd";
import dayjs from "dayjs";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;
const TIME_FORMAT = "HH:mm";

const zh = {
  title: "\u5f00\u653e\u65f6\u95f4\u914d\u7f6e",
  subtitle: "\u7ba1\u7406\u56fe\u4e66\u9986\u5f00\u653e\u65f6\u95f4\u548c\u9884\u7ea6\u89c4\u5219\u3002",
  saveSuccess: "\u5f00\u653e\u65f6\u95f4\u914d\u7f6e\u4fdd\u5b58\u6210\u529f\u3002",
  checkedPrefix: "\u68c0\u67e5\u5b8c\u6210",
  reservationTimeouts: "\u9884\u7ea6\u8d85\u65f6",
  leaveTimeouts: "\u6682\u79bb\u8d85\u65f6",
  checkTimeouts: "\u68c0\u67e5\u8d85\u65f6",
  openTime: "\u5f00\u9986\u65f6\u95f4",
  closeTime: "\u95ed\u9986\u65f6\u95f4",
  reserveStartTime: "\u9884\u7ea6\u5f00\u59cb\u65f6\u95f4",
  reserveEndTime: "\u9884\u7ea6\u7ed3\u675f\u65f6\u95f4",
  signLimit: "\u7b7e\u5230\u65f6\u9650\uff08\u5206\u949f\uff09",
  leaveLimit: "\u6682\u79bb\u65f6\u9650\uff08\u5206\u949f\uff09",
  openRequired: "\u8bf7\u9009\u62e9\u5f00\u9986\u65f6\u95f4\u3002",
  closeRequired: "\u8bf7\u9009\u62e9\u95ed\u9986\u65f6\u95f4\u3002",
  reserveStartRequired: "\u8bf7\u9009\u62e9\u9884\u7ea6\u5f00\u59cb\u65f6\u95f4\u3002",
  reserveEndRequired: "\u8bf7\u9009\u62e9\u9884\u7ea6\u7ed3\u675f\u65f6\u95f4\u3002",
  signRequired: "\u8bf7\u8f93\u5165\u7b7e\u5230\u65f6\u9650\u3002",
  leaveRequired: "\u8bf7\u8f93\u5165\u6682\u79bb\u65f6\u9650\u3002",
  save: "\u4fdd\u5b58",
};

function toTimeValue(value) {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return dayjs().hour(hour).minute(minute).second(0).millisecond(0);
}

function AdminOpenTimePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingTimeouts, setCheckingTimeouts] = useState(false);

  async function loadConfig() {
    setLoading(true);
    try {
      const response = await api.get("/admin/open-time-config");
      const config = response.data.data;
      form.setFieldsValue({
        open_time: toTimeValue(config.open_time),
        close_time: toTimeValue(config.close_time),
        reserve_start_time: toTimeValue(config.reserve_start_time),
        reserve_end_time: toTimeValue(config.reserve_end_time),
        sign_limit: config.sign_limit,
        leave_limit: config.leave_limit,
      });
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  async function handleSave() {
    const values = await form.validateFields();
    const payload = {
      open_time: values.open_time.format(TIME_FORMAT),
      close_time: values.close_time.format(TIME_FORMAT),
      reserve_start_time: values.reserve_start_time.format(TIME_FORMAT),
      reserve_end_time: values.reserve_end_time.format(TIME_FORMAT),
      sign_limit: values.sign_limit,
      leave_limit: values.leave_limit,
    };

    setSaving(true);
    try {
      await api.put("/admin/open-time-config", payload);
      message.success(zh.saveSuccess);
      await loadConfig();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckTimeouts() {
    setCheckingTimeouts(true);
    try {
      const response = await api.post("/admin/check-timeouts");
      const data = response.data.data;
      message.success(
        `${zh.checkedPrefix}。${zh.reservationTimeouts}: ${data.reservation_timeout_count}，${zh.leaveTimeouts}: ${data.leave_timeout_count}。`
      );
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setCheckingTimeouts(false);
    }
  }

  if (loading) {
    return (
      <div className="center-panel">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" className="full-width">
      <div className="page-heading">
        <div>
          <Title level={3}>{zh.title}</Title>
          <Text type="secondary">{zh.subtitle}</Text>
        </div>
        <Button loading={checkingTimeouts} onClick={handleCheckTimeouts}>
          {zh.checkTimeouts}
        </Button>
      </div>

      <Card className="section-card config-card">
        <Form form={form} layout="vertical">
          <div className="config-grid">
            <Form.Item
              label={zh.openTime}
              name="open_time"
              rules={[{ required: true, message: zh.openRequired }]}
            >
              <TimePicker format={TIME_FORMAT} minuteStep={5} className="full-width" />
            </Form.Item>

            <Form.Item
              label={zh.closeTime}
              name="close_time"
              rules={[{ required: true, message: zh.closeRequired }]}
            >
              <TimePicker format={TIME_FORMAT} minuteStep={5} className="full-width" />
            </Form.Item>

            <Form.Item
              label={zh.reserveStartTime}
              name="reserve_start_time"
              rules={[{ required: true, message: zh.reserveStartRequired }]}
            >
              <TimePicker format={TIME_FORMAT} minuteStep={5} className="full-width" />
            </Form.Item>

            <Form.Item
              label={zh.reserveEndTime}
              name="reserve_end_time"
              rules={[{ required: true, message: zh.reserveEndRequired }]}
            >
              <TimePicker format={TIME_FORMAT} minuteStep={5} className="full-width" />
            </Form.Item>

            <Form.Item
              label={zh.signLimit}
              name="sign_limit"
              rules={[{ required: true, message: zh.signRequired }]}
            >
              <InputNumber min={1} precision={0} className="full-width" />
            </Form.Item>

            <Form.Item
              label={zh.leaveLimit}
              name="leave_limit"
              rules={[{ required: true, message: zh.leaveRequired }]}
            >
              <InputNumber min={1} precision={0} className="full-width" />
            </Form.Item>
          </div>

          <div className="form-actions">
            <Button type="primary" loading={saving} onClick={handleSave}>
              {zh.save}
            </Button>
          </div>
        </Form>
      </Card>
    </Space>
  );
}

export default AdminOpenTimePage;
