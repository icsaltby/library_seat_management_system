import { useEffect, useRef, useState } from "react";
import { Card, Col, Empty, Row, Space, Spin, Statistic, Typography, message } from "antd";
import * as echarts from "echarts";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;

const zh = {
  title: "\u5b66\u4e60\u62a5\u544a",
  subtitle: "\u57fa\u4e8e\u5df2\u5b8c\u6210\u5b66\u4e60\u4f1a\u8bdd\u7edf\u8ba1\u4e2a\u4eba\u5b66\u4e60\u60c5\u51b5\u3002",
  totalDuration: "\u603b\u5b66\u4e60\u65f6\u957f",
  sessionCount: "\u5b66\u4e60\u6b21\u6570",
  averageDuration: "\u5e73\u5747\u5b66\u4e60\u65f6\u957f",
  violationCount: "\u8fdd\u7ea6\u6b21\u6570",
  minute: "\u5206\u949f",
  minutesAxis: "\u5206\u949f",
  studyDuration: "\u5b66\u4e60\u65f6\u957f",
  peakHours: "\u5b66\u4e60\u65f6\u6bb5",
  noSessions: "\u6682\u65e0\u5df2\u5b8c\u6210\u7684\u5b66\u4e60\u8bb0\u5f55\u3002",
  last7Days: "\u6700\u8fd1 7 \u5929",
  noPeak: "\u6682\u65e0\u5b66\u4e60\u65f6\u6bb5\u6570\u636e\u3002",
};

function StudyReportPage({ refreshFlag }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const dailyChartRef = useRef(null);
  const peakChartRef = useRef(null);

  async function loadReport() {
    setLoading(true);
    try {
      const response = await api.get("/reports/me");
      setReport(response.data.data);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [refreshFlag]);

  useEffect(() => {
    if (!report || !dailyChartRef.current || !peakChartRef.current) {
      return undefined;
    }

    const dailyChart = echarts.init(dailyChartRef.current);
    const peakChart = echarts.init(peakChartRef.current);

    dailyChart.setOption({
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: report.daily_duration.map((item) => item.date.slice(5)),
      },
      yAxis: { type: "value", name: zh.minutesAxis },
      series: [
        {
          name: zh.studyDuration,
          type: "bar",
          data: report.daily_duration.map((item) => item.duration),
          itemStyle: { color: "#1677ff" },
        },
      ],
      grid: { left: 48, right: 20, top: 32, bottom: 36 },
    });

    peakChart.setOption({
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [
        {
          name: zh.peakHours,
          type: "pie",
          radius: ["38%", "66%"],
          center: ["50%", "44%"],
          data: report.peak_hours.map((item) => ({
            name: item.hour,
            value: item.count,
          })),
        },
      ],
    });

    function resizeCharts() {
      dailyChart.resize();
      peakChart.resize();
    }

    window.addEventListener("resize", resizeCharts);
    return () => {
      window.removeEventListener("resize", resizeCharts);
      dailyChart.dispose();
      peakChart.dispose();
    };
  }, [report]);

  if (loading) {
    return (
      <div className="center-panel">
        <Spin size="large" />
      </div>
    );
  }

  const hasSessions = report?.session_count > 0;
  const hasPeakHours = report?.peak_hours?.length > 0;

  return (
    <Space direction="vertical" size="large" className="full-width">
      <div className="page-heading">
        <div>
          <Title level={3}>{zh.title}</Title>
          <Text type="secondary">{zh.subtitle}</Text>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="section-card">
            <Statistic title={zh.totalDuration} value={report.total_duration} suffix={zh.minute} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="section-card">
            <Statistic title={zh.sessionCount} value={report.session_count} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="section-card">
            <Statistic title={zh.averageDuration} value={report.average_duration} suffix={zh.minute} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="section-card">
            <Statistic title={zh.violationCount} value={report.violation_count} />
          </Card>
        </Col>
      </Row>

      {!hasSessions ? (
        <Card className="section-card">
          <Empty description={zh.noSessions} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title={zh.last7Days} className="section-card">
              <div ref={dailyChartRef} className="chart-box" />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title={zh.peakHours} className="section-card">
              {hasPeakHours ? (
                <div ref={peakChartRef} className="chart-box" />
              ) : (
                <Empty description={zh.noPeak} />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </Space>
  );
}

export default StudyReportPage;
