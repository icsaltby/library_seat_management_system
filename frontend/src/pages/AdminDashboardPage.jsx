import { useEffect, useState } from "react";
import { Card, Col, Row, Space, Spin, Statistic, Typography, message } from "antd";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;

const zh = {
  title: "\u7ba1\u7406\u7edf\u8ba1",
  subtitle: "\u67e5\u770b\u5ea7\u4f4d\u3001\u9884\u7ea6\u3001\u5b66\u4e60\u65f6\u957f\u548c\u8fdd\u7ea6\u60c5\u51b5\u3002",
  totalSeats: "\u603b\u5ea7\u4f4d\u6570",
  freeSeats: "\u7a7a\u95f2\u5ea7\u4f4d",
  usingSeats: "\u4f7f\u7528\u4e2d\u5ea7\u4f4d",
  reservedSeats: "\u5df2\u9884\u7ea6\u5ea7\u4f4d",
  todayReservations: "\u4eca\u65e5\u9884\u7ea6\u6b21\u6570",
  todayDuration: "\u4eca\u65e5\u5b66\u4e60\u603b\u65f6\u957f",
  violations: "\u8fdd\u7ea6\u603b\u6570",
  minute: "\u5206\u949f",
};

const statisticItems = [
  { key: "total_seats", title: zh.totalSeats },
  { key: "free_seats", title: zh.freeSeats },
  { key: "using_seats", title: zh.usingSeats },
  { key: "reserved_seats", title: zh.reservedSeats },
  { key: "today_reservation_count", title: zh.todayReservations },
  { key: "today_total_duration", title: zh.todayDuration, suffix: zh.minute },
  { key: "violation_count", title: zh.violations },
];

function AdminDashboardPage({ refreshFlag }) {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadStatistics() {
    setLoading(true);
    try {
      const response = await api.get("/admin/statistics");
      setStatistics(response.data.data);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatistics();
  }, [refreshFlag]);

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
      </div>

      <Row gutter={[16, 16]}>
        {statisticItems.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.key}>
            <Card className="section-card">
              <Statistic
                title={item.title}
                value={statistics?.[item.key] ?? 0}
                suffix={item.suffix}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

export default AdminDashboardPage;
