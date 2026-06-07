import { useMemo, useState } from "react";
import { Button, Layout, Menu, Space, Typography, message } from "antd";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import SeatMapPage from "./pages/SeatMapPage.jsx";
import MyReservationPage from "./pages/MyReservationPage.jsx";
import CurrentSeatPage from "./pages/CurrentSeatPage.jsx";
import StudyReportPage from "./pages/StudyReportPage.jsx";
import AdminSeatPage from "./pages/AdminSeatPage.jsx";
import AdminOpenTimePage from "./pages/AdminOpenTimePage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminUserPage from "./pages/AdminUserPage.jsx";
import AdminViolationPage from "./pages/AdminViolationPage.jsx";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const zh = {
  appTitle: "\u56fe\u4e66\u9986\u5ea7\u4f4d\u7ba1\u7406\u7cfb\u7edf",
  currentUser: "\u5f53\u524d\u7528\u6237",
  loginSuccess: "\u767b\u5f55\u6210\u529f\u3002",
  logoutSuccess: "\u5df2\u9000\u51fa\u767b\u5f55\u3002",
  logout: "\u9000\u51fa",
  seats: "\u5ea7\u4f4d\u5730\u56fe",
  reservation: "\u6211\u7684\u9884\u7ea6",
  currentSeat: "\u5f53\u524d\u5ea7\u4f4d",
  report: "\u5b66\u4e60\u62a5\u544a",
  adminDashboard: "\u7ba1\u7406\u7edf\u8ba1",
  adminSeats: "\u5ea7\u4f4d\u7ba1\u7406",
  adminUsers: "\u7528\u6237\u7ba1\u7406",
  violations: "\u8fdd\u7ea6\u7ba1\u7406",
  openTime: "\u5f00\u653e\u65f6\u95f4",
};

function getSavedUser() {
  const rawUser = localStorage.getItem("library_user");
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    localStorage.removeItem("library_user");
    return null;
  }
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("library_token"));
  const [user, setUser] = useState(getSavedUser());
  const [page, setPage] = useState(token ? "seats" : "login");
  const [refreshFlag, setRefreshFlag] = useState(0);

  const isLoggedIn = Boolean(token && user);

  const menuItems = useMemo(
    () => [
      { key: "seats", label: zh.seats },
      { key: "reservation", label: zh.reservation },
      { key: "current-seat", label: zh.currentSeat },
      { key: "report", label: zh.report },
      ...(user?.role === "admin"
        ? [
            { key: "admin-dashboard", label: zh.adminDashboard },
            { key: "admin-seats", label: zh.adminSeats },
            { key: "admin-users", label: zh.adminUsers },
            { key: "admin-violations", label: zh.violations },
            { key: "admin-open-time", label: zh.openTime },
          ]
        : []),
    ],
    [user]
  );

  function handleLogin(loginData) {
    localStorage.setItem("library_token", loginData.token);
    localStorage.setItem("library_user", JSON.stringify(loginData.user));
    setToken(loginData.token);
    setUser(loginData.user);
    setPage("seats");
    message.success(zh.loginSuccess);
  }

  function handleLogout() {
    localStorage.removeItem("library_token");
    localStorage.removeItem("library_user");
    setToken(null);
    setUser(null);
    setPage("login");
    message.success(zh.logoutSuccess);
  }

  function handleReservationChanged() {
    setRefreshFlag((value) => value + 1);
  }

  let content;
  if (!isLoggedIn) {
    content =
      page === "register" ? (
        <RegisterPage onShowLogin={() => setPage("login")} />
      ) : (
        <LoginPage onLogin={handleLogin} onShowRegister={() => setPage("register")} />
      );
  } else if (page === "reservation") {
    content = (
      <MyReservationPage
        refreshFlag={refreshFlag}
        onReservationChanged={handleReservationChanged}
        onOpenSeatMap={() => setPage("seats")}
      />
    );
  } else if (page === "current-seat") {
    content = (
      <CurrentSeatPage
        refreshFlag={refreshFlag}
        onSessionChanged={handleReservationChanged}
        onOpenSeatMap={() => setPage("seats")}
      />
    );
  } else if (page === "report") {
    content = <StudyReportPage refreshFlag={refreshFlag} />;
  } else if (page === "admin-dashboard" && user.role === "admin") {
    content = <AdminDashboardPage refreshFlag={refreshFlag} />;
  } else if (page === "admin-seats" && user.role === "admin") {
    content = <AdminSeatPage onSeatChanged={handleReservationChanged} />;
  } else if (page === "admin-users" && user.role === "admin") {
    content = <AdminUserPage />;
  } else if (page === "admin-violations" && user.role === "admin") {
    content = <AdminViolationPage />;
  } else if (page === "admin-open-time" && user.role === "admin") {
    content = <AdminOpenTimePage />;
  } else {
    content = (
      <SeatMapPage
        refreshFlag={refreshFlag}
        onReservationChanged={handleReservationChanged}
        onOpenReservation={() => setPage("reservation")}
      />
    );
  }

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="brand-block">
          <Title level={3} className="app-title">
            {zh.appTitle}
          </Title>
          {isLoggedIn && (
            <Text type="secondary">
              {zh.currentUser}: {user.username}
            </Text>
          )}
        </div>

        {isLoggedIn && (
          <Space className="header-actions">
            <Menu
              mode="horizontal"
              selectedKeys={[page]}
              items={menuItems}
              onClick={(item) => setPage(item.key)}
              className="top-menu"
            />
            <Button onClick={handleLogout}>{zh.logout}</Button>
          </Space>
        )}
      </Header>
      <Content className="app-content">{content}</Content>
    </Layout>
  );
}

export default App;
