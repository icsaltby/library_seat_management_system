import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  Form,
  Modal,
  Space,
  Spin,
  TimePicker,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;
const TIME_FORMAT = "HH:mm";

const zh = {
  title: "\u5ea7\u4f4d\u5730\u56fe",
  subtitle: "\u5ea7\u4f4d\u72b6\u6001\u6bcf 10 \u79d2\u81ea\u52a8\u5237\u65b0\u3002",
  lastUpdate: "\u6700\u540e\u66f4\u65b0",
  notice: "\u53ea\u6709\u7a7a\u95f2\u5ea7\u4f4d\u53ef\u4ee5\u9884\u7ea6\uff0c\u4e00\u4e2a\u7528\u6237\u540c\u65f6\u53ea\u80fd\u6709\u4e00\u4e2a\u6709\u6548\u9884\u7ea6\u3002",
  free: "\u7a7a\u95f2",
  reserved: "\u5df2\u9884\u7ea6",
  using: "\u4f7f\u7528\u4e2d",
  leaving: "\u6682\u79bb",
  disabled: "\u505c\u7528",
  guideTitle: "\u5ea7\u4f4d\u7f16\u53f7\u5bf9\u5e94\u56fe",
  row: "\u6392",
  columns: "\u5217",
  seats: "\u4e2a\u5ea7\u4f4d",
  noSeats: "\u672a\u627e\u5230\u5ea7\u4f4d\uff0c\u8bf7\u5148\u521d\u59cb\u5316\u6570\u636e\u5e93\u3002",
  reserve: "\u9884\u7ea6",
  reserveSeat: "\u9884\u7ea6\u5ea7\u4f4d",
  startTime: "\u5f00\u59cb\u65f6\u95f4",
  endTime: "\u7ed3\u675f\u65f6\u95f4",
  startRequired: "\u8bf7\u9009\u62e9\u5f00\u59cb\u65f6\u95f4\u3002",
  endRequired: "\u8bf7\u9009\u62e9\u7ed3\u675f\u65f6\u95f4\u3002",
  confirm: "\u786e\u8ba4",
  reserveSuccessPrefix: "\u5df2\u9884\u7ea6",
  signBefore: "\u8bf7\u5728\u6b64\u65f6\u95f4\u524d\u7b7e\u5230",
};

const statusInfo = {
  free: { label: zh.free, className: "seat-free", badge: "green" },
  reserved: { label: zh.reserved, className: "seat-reserved", badge: "gold" },
  using: { label: zh.using, className: "seat-using", badge: "red" },
  leaving: { label: zh.leaving, className: "seat-leaving", badge: "orange" },
  disabled: { label: zh.disabled, className: "seat-disabled", badge: "default" },
};

function SeatMapPage({ refreshFlag, onReservationChanged, onOpenReservation }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservingSeatId, setReservingSeatId] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [form] = Form.useForm();

  async function loadSeats() {
    try {
      const response = await api.get("/seats");
      setSeats(response.data.data || []);
      setLastUpdatedAt(new Date());
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSeats();
    const timer = window.setInterval(loadSeats, 10000);
    return () => window.clearInterval(timer);
  }, [refreshFlag]);

  const groupedSeats = useMemo(() => {
    return seats.reduce((groups, seat) => {
      const key = `${seat.floor}F - ${seat.area}`;
      groups[key] = groups[key] || [];
      groups[key].push(seat);
      return groups;
    }, {});
  }, [seats]);

  const seatGuide = useMemo(() => {
    const guide = {};
    seats.forEach((seat) => {
      guide[seat.area] = guide[seat.area] || {
        area: seat.area,
        row_no: seat.row_no,
        min_col: seat.col_no,
        max_col: seat.col_no,
        first_seat: seat.name,
        last_seat: seat.name,
        count: 0,
      };
      guide[seat.area].min_col = Math.min(guide[seat.area].min_col, seat.col_no);
      guide[seat.area].max_col = Math.max(guide[seat.area].max_col, seat.col_no);
      guide[seat.area].first_seat = seat.name < guide[seat.area].first_seat ? seat.name : guide[seat.area].first_seat;
      guide[seat.area].last_seat = seat.name > guide[seat.area].last_seat ? seat.name : guide[seat.area].last_seat;
      guide[seat.area].count += 1;
    });
    return Object.values(guide).sort((a, b) => a.area.localeCompare(b.area));
  }, [seats]);

  function openReserveModal(seat) {
    const startTime = dayjs().add(10, "minute");
    const endTime = startTime.add(2, "hour");
    setSelectedSeat(seat);
    form.setFieldsValue({
      start_time: startTime,
      end_time: endTime,
    });
  }

  function closeReserveModal() {
    setSelectedSeat(null);
    form.resetFields();
  }

  async function handleReserve() {
    const values = await form.validateFields();
    if (!selectedSeat) {
      return;
    }

    setReservingSeatId(selectedSeat.id);
    try {
      const response = await api.post("/reservations", {
        seat_id: selectedSeat.id,
        start_time: values.start_time.format(TIME_FORMAT),
        end_time: values.end_time.format(TIME_FORMAT),
      });
      message.success(
        `${zh.reserveSuccessPrefix} ${selectedSeat.name}。${zh.signBefore}：${response.data.data.sign_deadline}`
      );
      closeReserveModal();
      onReservationChanged();
      onOpenReservation();
    } catch (error) {
      message.error(getErrorMessage(error));
      loadSeats();
    } finally {
      setReservingSeatId(null);
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
        <Text type="secondary">
          {zh.lastUpdate}: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : "-"}
        </Text>
      </div>

      <Alert
        type="info"
        showIcon
        message={zh.notice}
      />

      <Space wrap>
        {Object.entries(statusInfo).map(([key, item]) => (
          <Badge key={key} color={item.badge} text={item.label} />
        ))}
      </Space>

      {seatGuide.length > 0 && (
        <Card title={zh.guideTitle} className="section-card">
          <div className="seat-guide-grid">
            {seatGuide.map((item) => (
              <div key={item.area} className="seat-guide-item">
                <Text strong>{item.area}</Text>
                <Text type="secondary">
                  {zh.row} {item.row_no}
                </Text>
                <Text>
                  {item.first_seat} - {item.last_seat}
                </Text>
                <Text type="secondary">
                  {zh.columns} {item.min_col} - {item.max_col}，{item.count} {zh.seats}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {seats.length === 0 ? (
        <Empty description={zh.noSeats} />
      ) : (
        Object.entries(groupedSeats).map(([groupName, groupSeats]) => (
          <Card key={groupName} title={groupName} className="section-card">
            <div className="seat-grid">
              {groupSeats.map((seat) => {
                const info = statusInfo[seat.status] || statusInfo.disabled;
                const canReserve = seat.status === "free" && seat.is_enabled;

                return (
                  <div key={seat.id} className={`seat-tile ${info.className}`}>
                    <div>
                      <Text strong>{seat.name}</Text>
                      <div>
                        <Badge color={info.badge} text={info.label} />
                      </div>
                    </div>
                    <Button
                      type={canReserve ? "primary" : "default"}
                      size="small"
                      disabled={!canReserve}
                      loading={reservingSeatId === seat.id}
                      onClick={() => openReserveModal(seat)}
                    >
                      {zh.reserve}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}

      <Modal
        title={selectedSeat ? `${zh.reserveSeat} ${selectedSeat.name}` : zh.reserveSeat}
        open={Boolean(selectedSeat)}
        onCancel={closeReserveModal}
        onOk={handleReserve}
        confirmLoading={Boolean(reservingSeatId)}
        okText={zh.confirm}
        cancelText="\u53d6\u6d88"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={zh.startTime}
            name="start_time"
            rules={[{ required: true, message: zh.startRequired }]}
          >
            <TimePicker format={TIME_FORMAT} minuteStep={5} className="full-width" />
          </Form.Item>

          <Form.Item
            label={zh.endTime}
            name="end_time"
            rules={[{ required: true, message: zh.endRequired }]}
          >
            <TimePicker format={TIME_FORMAT} minuteStep={5} className="full-width" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default SeatMapPage;
