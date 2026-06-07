import { useEffect, useMemo, useState } from "react";
import { Button, Card, Descriptions, Empty, Space, Spin, Statistic, Typography, message } from "antd";

import api, { getErrorMessage } from "../api/client.js";

const { Title, Text } = Typography;

const zh = {
  title: "\u5f53\u524d\u5ea7\u4f4d",
  subtitle: "\u7ba1\u7406\u5f53\u524d\u6b63\u5728\u8fdb\u884c\u7684\u5b66\u4e60\u4f1a\u8bdd\u3002",
  minutes: "\u5206",
  seconds: "\u79d2",
  releaseSuccess: "\u5ea7\u4f4d\u5df2\u91ca\u653e\u3002",
  noSession: "\u6682\u65e0\u6b63\u5728\u8fdb\u884c\u7684\u5b66\u4e60\u4f1a\u8bdd\u3002",
  goSeatMap: "\u53bb\u5ea7\u4f4d\u5730\u56fe",
  seat: "\u5ea7\u4f4d",
  area: "\u533a\u57df",
  status: "\u72b6\u6001",
  startAt: "\u5f00\u59cb\u65f6\u95f4",
  leaveStart: "\u6682\u79bb\u5f00\u59cb\u65f6\u95f4",
  leaveDeadline: "\u6682\u79bb\u622a\u6b62\u65f6\u95f4",
  remainingLeave: "\u6682\u79bb\u5269\u4f59\u65f6\u95f4",
  leave: "\u6682\u79bb",
  leaveStarted: "\u5df2\u5f00\u59cb\u6682\u79bb\u3002",
  returnSeat: "\u8fd4\u56de\u5ea7\u4f4d",
  returned: "\u5df2\u8fd4\u56de\u5ea7\u4f4d\u3002",
  release: "\u91ca\u653e\u5ea7\u4f4d",
  statusMap: {
    using: "\u4f7f\u7528\u4e2d",
    leaving: "\u6682\u79bb\u4e2d",
    released: "\u5df2\u91ca\u653e",
  },
};

function formatRemaining(seconds) {
  const safeSeconds = Math.max(0, seconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  return `${minutes}${zh.minutes} ${restSeconds}${zh.seconds}`;
}

function CurrentSeatPage({ refreshFlag, onSessionChanged, onOpenSeatMap }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  async function loadSession() {
    try {
      const response = await api.get("/study-sessions/me");
      setSession(response.data.data);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
  }, [refreshFlag]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingSeconds = useMemo(() => {
    const expireAt = session?.leave_record?.expire_at;
    if (!expireAt) {
      return 0;
    }
    return Math.max(0, Math.floor((new Date(expireAt).getTime() - nowTick) / 1000));
  }, [session, nowTick]);

  async function runAction(action, successText) {
    if (!session) {
      return;
    }
    setActionLoading(action);
    try {
      await api.post(`/study-sessions/${session.id}/${action}`);
      message.success(successText);
      await loadSession();
      onSessionChanged();
    } catch (error) {
      message.error(getErrorMessage(error));
      await loadSession();
      onSessionChanged();
    } finally {
      setActionLoading("");
    }
  }

  async function releaseSeat() {
    if (!session) {
      return;
    }
    setActionLoading("release");
    try {
      await api.post(`/study-sessions/${session.id}/release`);
      message.success(zh.releaseSuccess);
      setSession(null);
      onSessionChanged();
    } catch (error) {
      message.error(getErrorMessage(error));
      await loadSession();
    } finally {
      setActionLoading("");
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

      {!session ? (
        <Card className="section-card">
          <Empty description={zh.noSession}>
            <Button type="primary" onClick={onOpenSeatMap}>
              {zh.goSeatMap}
            </Button>
          </Empty>
        </Card>
      ) : (
        <Card className="section-card">
          <Descriptions bordered column={1}>
            <Descriptions.Item label={zh.seat}>{session.seat?.name}</Descriptions.Item>
            <Descriptions.Item label={zh.area}>{session.seat?.area}</Descriptions.Item>
            <Descriptions.Item label={zh.status}>{zh.statusMap[session.status] || session.status}</Descriptions.Item>
            <Descriptions.Item label={zh.startAt}>{session.start_at}</Descriptions.Item>
            {session.leave_record && (
              <>
                <Descriptions.Item label={zh.leaveStart}>
                  {session.leave_record.leave_at}
                </Descriptions.Item>
                <Descriptions.Item label={zh.leaveDeadline}>
                  {session.leave_record.expire_at}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>

          {session.status === "leaving" && (
            <div className="stat-row">
              <Statistic title={zh.remainingLeave} value={formatRemaining(remainingSeconds)} />
            </div>
          )}

          <div className="form-actions">
            {session.status === "using" && (
              <Button
                loading={actionLoading === "leave"}
                onClick={() => runAction("leave", zh.leaveStarted)}
              >
                {zh.leave}
              </Button>
            )}
            {session.status === "leaving" && (
              <Button
                type="primary"
                loading={actionLoading === "return"}
                onClick={() => runAction("return", zh.returned)}
              >
                {zh.returnSeat}
              </Button>
            )}
            <Button danger loading={actionLoading === "release"} onClick={releaseSeat}>
              {zh.release}
            </Button>
          </div>
        </Card>
      )}
    </Space>
  );
}

export default CurrentSeatPage;
