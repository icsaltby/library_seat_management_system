# Backend API Test Guide

Run these commands in PowerShell.

## 1. Initialize database

```powershell
cd /d "F:\3d\Information System Analysis and Design\lab\code\backend"
.\.venv\Scripts\python.exe init_db.py
```

## 2. Start backend

```powershell
cd /d "F:\3d\Information System Analysis and Design\lab\code\backend"
.\.venv\Scripts\python.exe app.py
```

The backend runs at:

```text
http://127.0.0.1:5000
```

## 3. Register

```powershell
$registerBody = @{
  username = "alice"
  password = "123456"
  real_name = "Alice"
  student_no = "S001"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:5000/api/auth/register" `
  -ContentType "application/json" `
  -Body $registerBody
```

## 4. Login

```powershell
$loginBody = @{
  username = "alice"
  password = "123456"
} | ConvertTo-Json

$loginResult = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:5000/api/auth/login" `
  -ContentType "application/json" `
  -Body $loginBody

$token = $loginResult.data.token
$headers = @{ Authorization = "Bearer $token" }
```

## 5. Get Seat List

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://127.0.0.1:5000/api/seats"
```

## 6. Reserve Seat

```powershell
$reserveBody = @{
  seat_id = 1
} | ConvertTo-Json

$reservationResult = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:5000/api/reservations" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $reserveBody

$reservationId = $reservationResult.data.id
```

## 7. Check Duplicate Reservation Error

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:5000/api/reservations" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $reserveBody
```

This should fail because one user can have only one active reservation.

## 8. Check In

```powershell
$checkinResult = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:5000/api/reservations/$reservationId/checkin" `
  -Headers $headers

$studySessionId = $checkinResult.data.id
```

After check-in, the seat status changes from `reserved` to `using`.

## 9. Release Seat

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:5000/api/study-sessions/$studySessionId/release" `
  -Headers $headers
```

After release, the seat status changes from `using` to `free`.
