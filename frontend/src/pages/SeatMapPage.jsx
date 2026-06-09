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
const DEFAULT_OPEN_TIME_CONFIG = {
  open_time: "08:00",
  close_time: "22:00",
};

const zh = {
  title: "\u5ea7\u4f4d\u5730\u56fe",
  subtitle: "\u5ea7\u4f4d\u72b6\u6001\u6bcf 10 \u79d2\u81ea\u52a8\u5237\u65b0\u3002",
  lastUpdate: "\u6700\u540e\u66f4\u65b0",
  notice: "\u975e\u505c\u7528\u5ea7\u4f4d\u90fd\u53ef\u4ee5\u9009\u62e9\u9884\u7ea6\u65f6\u95f4\uff0c\u7cfb\u7edf\u4f1a\u81ea\u52a8\u68c0\u67e5\u65f6\u95f4\u6bb5\u662f\u5426\u51b2\u7a81\u3002",
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
  endAfterStart: "\u7ed3\u675f\u65f6\u95f4\u5fc5\u987b\u665a\u4e8e\u5f00\u59cb\u65f6\u95f4\u3002",
  todayPeriods: "\u4eca\u65e5\u5df2\u9884\u7ea6\u65f6\u95f4\u6bb5",
  noTodayPeriods: "\u4eca\u65e5\u6682\u65e0\u5df2\u9884\u7ea6\u65f6\u95f4\u6bb5\u3002",
};

const statusInfo = {
  free: { label: zh.free, className: "seat-free", badge: "green" },
  reserved: { label: zh.reserved, className: "seat-reserved", badge: "gold" },
  using: { label: zh.using, className: "seat-using", badge: "red" },
  leaving: { label: zh.leaving, className: "seat-leaving", badge: "orange" },
  disabled: { label: zh.disabled, className: "seat-disabled", badge: "default", badgeClassName: "status-disabled-badge" },
};

function toTodayTime(value) {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return dayjs().hour(hour).minute(minute).second(0).millisecond(0);
}

function SeatMapPage({ refreshFlag, onReservationChanged, onOpenReservation }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservingSeatId, setReservingSeatId] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [openTimeConfig, setOpenTimeConfig] = useState(DEFAULT_OPEN_TIME_CONFIG);
  const [reservationPeriods, setReservationPeriods] = useState([]);
  const [loadingReservationPeriods, setLoadingReservationPeriods] = useState(false);
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

  async function loadOpenTimeConfig() {
    try {
      const response = await api.get("/open-time-config");
      setOpenTimeConfig(response.data.data || DEFAULT_OPEN_TIME_CONFIG);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  async function loadSeatReservationPeriods(seatId) {
    setLoadingReservationPeriods(true);
    try {
      const response = await api.get(`/seats/${seatId}/reservations`, {
        params: { date: dayjs().format("YYYY-MM-DD") },
      });
      setReservationPeriods(response.data.data || []);
    } catch (error) {
      setReservationPeriods([]);
      message.error(getErrorMessage(error));
    } finally {
      setLoadingReservationPeriods(false);
    }
  }

  useEffect(() => {
    loadSeats();
    loadOpenTimeConfig();
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
    const closeTime = toTodayTime(openTimeConfig.close_time) || toTodayTime(DEFAULT_OPEN_TIME_CONFIG.close_time);
    const defaultEndTime = startTime.add(2, "hour");
    const endTime = defaultEndTime.isAfter(closeTime) ? closeTime : defaultEndTime;
    setSelectedSeat(seat);
    form.setFieldsValue({
      start_time: startTime,
      end_time: endTime,
    });
    loadSeatReservationPeriods(seat.id);
  }

  function closeReserveModal() {
    setSelectedSeat(null);
    setReservationPeriods([]);
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
          <Badge key={key} className={item.badgeClassName} color={item.badge} text={item.label} />
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
                const canReserve = seat.status !== "disabled" && seat.is_enabled;

                return (
                  <div key={seat.id} className={`seat-tile ${info.className}`}>
                    <div>
                      <Text strong>{seat.name}</Text>
                      <div>
                        <Badge className={info.badgeClassName} color={info.badge} text={info.label} />
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
        cancelText="取消"
        destroyOnHidden
      >
        <Space direction="vertical" size="small" className="full-width">
          <Text strong>{zh.todayPeriods}</Text>
          {loadingReservationPeriods ? (
            <Spin size="small" />
          ) : reservationPeriods.length > 0 ? (
            <Space wrap>
              {reservationPeriods.map((reservation) => (
                <Badge
                  key={reservation.reservation_id}
                  status="processing"
                  text={`${reservation.start_time} - ${reservation.end_time}（${reservation.status}）`}
                />
              ))}
            </Space>
          ) : (
            <Text type="secondary">{zh.noTodayPeriods}</Text>
          )}
        </Space>

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
            dependencies={["start_time"]}
            rules={[
              { required: true, message: zh.endRequired },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startTime = getFieldValue("start_time");
                  if (!value || !startTime || value.isAfter(startTime)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(zh.endAfterStart));
                },
              }),
            ]}
          >
            <TimePicker format={TIME_FORMAT} minuteStep={5} className="full-width" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default SeatMapPage;
