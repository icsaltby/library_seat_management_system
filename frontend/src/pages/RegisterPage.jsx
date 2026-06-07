import { Button, Card, Form, Input, Select, Space, Typography, message } from "antd";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;

const zh = {
  title: "\u6ce8\u518c",
  subtitle: "\u521b\u5efa\u8bfe\u7a0b\u6f14\u793a\u7528\u7684\u7b80\u5355\u8d26\u53f7\u3002",
  success: "\u6ce8\u518c\u6210\u529f\uff0c\u8bf7\u767b\u5f55\u3002",
  username: "\u7528\u6237\u540d",
  password: "\u5bc6\u7801",
  realName: "\u771f\u5b9e\u59d3\u540d",
  studentNo: "\u5b66\u53f7",
  role: "\u89d2\u8272",
  user: "\u666e\u901a\u7528\u6237",
  admin: "\u7ba1\u7406\u5458",
  usernameRequired: "\u8bf7\u8f93\u5165\u7528\u6237\u540d\u3002",
  passwordRequired: "\u8bf7\u8f93\u5165\u5bc6\u7801\u3002",
  register: "\u6ce8\u518c",
  backToLogin: "\u8fd4\u56de\u767b\u5f55",
};

function RegisterPage({ onShowLogin }) {
  async function handleSubmit(values) {
    try {
      await api.post("/auth/register", values);
      message.success(zh.success);
      onShowLogin();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Space direction="vertical" size="large" className="full-width">
          <div>
            <Title level={3}>{zh.title}</Title>
            <Text type="secondary">{zh.subtitle}</Text>
          </div>

          <Form layout="vertical" initialValues={{ role: "user" }} onFinish={handleSubmit}>
            <Form.Item
              label={zh.username}
              name="username"
              rules={[{ required: true, message: zh.usernameRequired }]}
            >
              <Input autoComplete="username" />
            </Form.Item>

            <Form.Item
              label={zh.password}
              name="password"
              rules={[{ required: true, message: zh.passwordRequired }]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <Form.Item label={zh.realName} name="real_name">
              <Input />
            </Form.Item>

            <Form.Item label={zh.studentNo} name="student_no">
              <Input />
            </Form.Item>

            <Form.Item label={zh.role} name="role">
              <Select
                options={[
                  { value: "user", label: zh.user },
                  { value: "admin", label: zh.admin },
                ]}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" block>
              {zh.register}
            </Button>
          </Form>

          <Button type="link" onClick={onShowLogin} className="link-button">
            {zh.backToLogin}
          </Button>
        </Space>
      </Card>
    </div>
  );
}

export default RegisterPage;
