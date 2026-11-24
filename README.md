# TLU Lịch Học — Ứng dụng Android độc lập

Ứng dụng xem thời khóa biểu sinh viên Đại học Thủy lợi (`sinhvien1.tlu.edu.vn`) chạy **độc lập 100% trên Android** (đóng gói bằng Capacitor 8):
- **Không cần hosting / không cần server trung gian:** Điện thoại kết nối trực tiếp tới cổng `sinhvien1.tlu.edu.vn` bằng Native HTTP (`CapacitorHttp`) kèm chứng chỉ trung gian `sectigo_dv_ca.pem` trong `network_security_config.xml`.
- **Không có thanh địa chỉ web:** Chạy toàn màn hình như ứng dụng Android bản địa, hỗ trợ nút Back vật lý, thanh trạng thái đổi màu theo giao diện Sáng/Tối, và chia sẻ trực tiếp file `.ics` sang Google Calendar.
- **Xem lịch ngoại tuyến hoàn toàn:** Tải 1 lần trọn học kỳ, lưu trong máy cùng ghi chú từng môn và bé đồng hành chibi.
- **Build file `.apk` tự động trên mây bằng GitHub Actions** — không cần cài Android Studio trên máy tính cá nhân.

## Cách lấy file `.apk` bằng GitHub Actions (Miễn phí, không cần Android Studio)

1. Tạo một repository mới trên GitHub (ví dụ `tlu-lich-hoc-android`, nên để **Public** để GitHub Actions miễn phí không giới hạn).
2. Mở terminal trong thư mục dự án này và đẩy code lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: standalone Capacitor Android app for TLU scheduler"
   git branch -M main
   git remote add origin https://github.com/<ten-github-cua-ban>/tlu-lich-hoc-android.git
   git push -u origin main
   ```
3. Mở repository trên trình duyệt → chọn tab **Actions** → chọn workflow **Build Android APK** (nó sẽ tự chạy ngay sau khi push, hoặc bấm nút **Run workflow**).
4. Đợi khoảng 3–5 phút cho tới khi hiện dấu tích xanh ✅ → kéo xuống mục **Artifacts** → bấm tải **`TLU-Lich-Hoc-APK`**.
5. Giải nén file zip lấy **`TLU-Lich-Hoc.apk`**, chuyển sang điện thoại Android (hoặc tải thẳng trên điện thoại) rồi bấm cài đặt (bật cho phép cài đặt từ nguồn không xác định nếu Android hỏi).

## Phát triển / kiểm tra giao diện nhanh trên máy tính

```bash
npm install
npm run dev
```

Mở `http://localhost:3000` để xem trước giao diện web. Khi chỉnh sửa giao diện xong, chỉ cần `git push` lên GitHub là GitHub Actions tự động build bản `.apk` mới.
