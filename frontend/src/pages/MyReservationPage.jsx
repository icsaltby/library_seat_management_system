import { useEffect, useState } from "react";
import { Button, Card, Descriptions, Empty, Space, Spin, Typography, message } from "antd";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;

const zh = {
  title: "\u6211\u7684\u9884\u7ea6",
  subtitle: "\u67e5\u770b\u5f53\u524d\u6709\u6548\u9884\u7ea6\uff0c\u5e76\u5728\u622a\u6b62\u65f6\u95f4\u524d\u7b7e\u5230\u3002",
  checkinSuccess: "\u7b7e\u5230\u6210\u529f\u3002",
  noReservation: "\u6682\u65e0\u6709\u6548\u9884\u7ea6\u3002",
  goSeatMap: "\u53bb\u5ea7\u4f4d\u5730\u56fe",
  reservationId: "\u9884\u7ea6\u7f16\u53f7",
  seat: "\u5ea7\u4f4d",
  area: "\u533a\u57df",
  floor: "\u6392",
  status: "\u72b6\u6001",
  startTime: "\u5f00\u59cb\u65f6\u95f4",
  endTime: "\u7ed3\u675f\u65f6\u95f4",
  reservedAt: "\u9884\u7ea6\u521b\u5efa\u65f6\u95f4",
  signDeadline: "\u7b7e\u5230\u622a\u6b62\u65f6\u95f4",
  backSeatMap: "\u8fd4\u56de\u5ea7\u4f4d\u5730\u56fe",
  checkIn: "\u7b7e\u5230",
  statusMap: {
    active: "\u5f85\u7b7e\u5230",
    checked_in: "\u5df2\u7b7e\u5230",
    timeout: "\u5df2\u8d85\u65f6",
    canceled: "\u5df2\u53d6\u6d88",
  },
};

function MyReservationPage({ refreshFlag, onReservationChanged, onOpenSeatMap }) {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  async function loadReservation() {
    try {
      const response = await api.get("/reservations/me");
      setReservation(response.data.data);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservation();
  }, [refreshFlag]);

  async function handleCheckIn() {
    if (!reservation) {
      return;
    }

    setCheckingIn(true);
    try {
      await api.post(`/reservations/${reservation.id}/checkin`);
      message.success(zh.checkinSuccess);
      setReservation(null);
      onReservationChanged();
      onOpenSeatMap();
    } catch (error) {
      message.error(getErrorMessage(error));
      loadReservation();
    } finally {
      setCheckingIn(false);
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
      </div>

      {!reservation ? (
        <Card className="section-card">
          <Empty description={zh.noReservation}>
            <Button type="primary" onClick={onOpenSeatMap}>
              {zh.goSeatMap}
            </Button>
          </Empty>
        </Card>
      ) : (
        <Card className="section-card">
          <Descriptions bordered column={1}>
            <Descriptions.Item label={zh.reservationId}>{reservation.id}</Descriptions.Item>
            <Descriptions.Item label={zh.seat}>{reservation.seat?.name}</Descriptions.Item>
            <Descriptions.Item label={zh.area}>{reservation.seat?.area}</Descriptions.Item>
            <Descriptions.Item label={zh.floor}>{reservation.seat?.floor}</Descriptions.Item>
            <Descriptions.Item label={zh.status}>
              {zh.statusMap[reservation.status] || reservation.status}
            </Descriptions.Item>
            <Descriptions.Item label={zh.startTime}>{reservation.start_time}</Descriptions.Item>
            <Descriptions.Item label={zh.endTime}>{reservation.end_time}</Descriptions.Item>
            <Descriptions.Item label={zh.reservedAt}>{reservation.reserved_at}</Descriptions.Item>
            <Descriptions.Item label={zh.signDeadline}>{reservation.sign_deadline}</Descriptions.Item>
          </Descriptions>

          <div className="form-actions">
            <Button onClick={onOpenSeatMap}>{zh.backSeatMap}</Button>
            <Button type="primary" loading={checkingIn} onClick={handleCheckIn}>
              {zh.checkIn}
            </Button>
          </div>
        </Card>
      )}
    </Space>
  );
}

export default MyReservationPage;
