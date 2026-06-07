import { Button, Card, Form, Input, Space, Typography, message } from "antd";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;

const zh = {
  title: "\u767b\u5f55",
  subtitle: "\u4f7f\u7528\u8d26\u53f7\u767b\u5f55\u540e\u9884\u7ea6\u56fe\u4e66\u9986\u5ea7\u4f4d\u3002",
  username: "\u7528\u6237\u540d",
  password: "\u5bc6\u7801",
  usernameRequired: "\u8bf7\u8f93\u5165\u7528\u6237\u540d\u3002",
  passwordRequired: "\u8bf7\u8f93\u5165\u5bc6\u7801\u3002",
  login: "\u767b\u5f55",
  register: "\u6ce8\u518c\u65b0\u8d26\u53f7",
};

function LoginPage({ onLogin, onShowRegister }) {
  async function handleSubmit(values) {
    try {
      const response = await api.post("/auth/login", values);
      onLogin(response.data.data);
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

          <Form layout="vertical" onFinish={handleSubmit}>
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
              <Input.Password autoComplete="current-password" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block>
              {zh.login}
            </Button>
          </Form>

          <Button type="link" onClick={onShowRegister} className="link-button">
            {zh.register}
          </Button>
        </Space>
      </Card>
    </div>
  );
}

export default LoginPage;
