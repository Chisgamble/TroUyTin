# Thiết kế thay dữ liệu địa chỉ hành chính Việt Nam 3 cấp

## Bối cảnh

Cơ sở dữ liệu hiện chỉ có 6 tỉnh/thành, 11 quận/huyện và 13 phường/xã. Toàn bộ 13 phường/xã đều thuộc `Quận Mẫu 1`, khiến 215 phòng hiển thị cùng một quận giả và bộ lọc địa chỉ chỉ có vài lựa chọn.

Ứng dụng đang dùng mô hình ba cấp `tỉnh/thành -> quận/huyện -> phường/xã`. Theo yêu cầu sản phẩm, mô hình này được giữ dưới dạng snapshot lịch sử 63 tỉnh/thành, thay vì chuyển sang hệ thống hành chính hai cấp áp dụng từ ngày 01/07/2025.

## Phạm vi

Đây là thay đổi database-only:

- thêm một migration SQL để thay dữ liệu trong `provinces`, `districts` và `wards`;
- remap địa chỉ của 215 phòng mẫu và 1 bài tìm bạn ở ghép đang dùng phường giả;
- bảo toàn lựa chọn quận của 27 hồ sơ ở ghép khi thay khóa danh mục;
- xóa hoàn toàn `Quận Mẫu 1` và các phường giả trực thuộc;
- giữ nguyên cấu trúc bảng, kiểu dữ liệu và API hiện có;
- không sửa source code backend hoặc frontend nếu kiểm thử không phát hiện lỗi tương thích.

Tài liệu nguồn và giấy phép được lưu kèm migration, nhưng không tham gia vào runtime của ứng dụng.

## Ngoài phạm vi

- Không thêm cột `code` hoặc bảng mới vào schema ứng dụng.
- Không chuyển ứng dụng sang mô hình hành chính hai cấp 34 tỉnh/thành hiện hành.
- Không tạo danh mục toàn bộ đường phố Việt Nam; `address_detail` tiếp tục là trường văn bản tự do.
- Không thay đổi giá, nội dung, chủ phòng, hình ảnh hoặc trạng thái của phòng.
- Không refactor giao diện bộ lọc.

## Nguồn dữ liệu

Danh mục được lấy từ [release `v2.4.1`](https://github.com/thanglequoc/vietnamese-provinces-database/releases/tag/v2.4.1), commit `fc33b74`, của repository [`thanglequoc/vietnamese-provinces-database`](https://github.com/thanglequoc/vietnamese-provinces-database/tree/v2.4.1). Đây là bản cắt cuối của mô hình 63 tỉnh/thành trước thay đổi lớn sang 34 tỉnh/thành. Dữ liệu dựa trên API danh mục hành chính của Tổng cục Thống kê và được phát hành theo [giấy phép MIT](https://github.com/thanglequoc/vietnamese-provinces-database/blob/v2.4.1/LICENSE).

Snapshot kỳ vọng chứa chính xác:

- 63 tỉnh/thành;
- 696 đơn vị cấp huyện;
- 10.035 đơn vị cấp xã.

Migration chứa dữ liệu đã chuẩn hóa từ đúng tag và commit nêu trên. Deployment không tải dữ liệu qua mạng.

## Cách lưu dữ liệu mà không đổi schema

Ba bảng tiếp tục dùng cấu trúc hiện tại:

- `provinces(id, name)`;
- `districts(id, province_id, name)`;
- `wards(id, district_id, name)`.

Giá trị `id` số nguyên sẽ dùng biểu diễn số của mã hành chính chính thức:

- mã tỉnh `01` được lưu thành `id = 1`;
- mã huyện `001` được lưu thành `id = 1`;
- mã xã `00001` được lưu thành `id = 1`.

Số 0 ở đầu không cần lưu vì `id` chỉ là khóa nội bộ và không được hiển thị. Mã hành chính là duy nhất trong từng cấp, phù hợp với ba khóa chính độc lập. Kiểu dữ liệu vẫn là số nguyên nên backend, frontend và các khóa ngoại không phải thay đổi.

Cột `name` lưu tên đầy đủ có loại đơn vị, ví dụ `Thành phố Hà Nội`, `Quận Ba Đình`, `Phường Phúc Xá`, để nhãn bộ lọc và địa chỉ phòng rõ nghĩa.

## Migration database

Migration chạy trong một transaction duy nhất:

1. Nạp snapshot vào các bảng staging tạm thời có mã hành chính dạng chuỗi.
2. Xác nhận staging có đúng 63 tỉnh/thành, 696 quận/huyện và 10.035 phường/xã; sai số lượng sẽ làm transaction thất bại.
3. Tạo bảng ánh xạ tạm cho 215 phòng và 1 bài tìm bạn ở ghép thuộc cây `Quận Mẫu 1`, gồm id bản ghi, mã phường/xã đích và địa chỉ đường mới.
4. Tạo bảng ánh xạ tạm cho 27 `roommate_profiles.preferred_district_id`: giữ quận tương ứng theo tên, đổi `Quận 2` sang `Thành phố Thủ Đức`, và phân bổ các lựa chọn `Quận Mẫu 1` sang quận thật tại Thành phố Hồ Chí Minh.
5. Xác nhận mọi tham chiếu tới `wards` và `districts` từ `room_listings`, `roommate_posts` và `roommate_profiles` đã có ánh xạ. Nếu có tham chiếu ngoài phạm vi này, migration dừng để không xóa dữ liệu thật ngoài dự kiến.
6. Tạm đặt các khóa ngoại địa chỉ đã lưu ánh xạ thành null.
7. Xóa danh mục cũ theo thứ tự `wards -> districts -> provinces`. Bước này loại bỏ cả `Quận Mẫu 1` và các phường giả.
8. Chèn lại đủ danh mục thật, dùng mã hành chính chuyển sang số nguyên làm `id` và thiết lập khóa ngoại theo mã cha.
9. Khôi phục các khóa ngoại và địa chỉ mới cho phòng, bài tìm bạn ở ghép và hồ sơ ở ghép từ các bảng ánh xạ tạm.
10. Đồng bộ lại sequence của ba khóa `serial` tới giá trị lớn nhất để các insert về sau không va chạm.
11. Chạy các assertion cuối về số lượng, khóa ngoại và tên giả rồi commit transaction.

Migration không phụ thuộc vào việc `Quận Mẫu 1` có `id = 1`; nó nhận diện dữ liệu giả bằng tên chính xác và quan hệ cha-con. Khi chạy trên database mới không có phòng mẫu, các bước remap không cập nhật dòng nào nhưng danh mục địa chỉ vẫn được nạp đầy đủ.

## Phân bổ phòng mẫu

Các phòng bị ảnh hưởng được phân bổ có tính quyết định theo `room_listings.id`:

- 33% tại Thành phố Hồ Chí Minh;
- 27% tại Thành phố Hà Nội;
- 25% chia cho Đà Nẵng, Cần Thơ, Hải Phòng, Bình Dương và Đồng Nai;
- 15% rải qua một nhóm tỉnh ở cả ba miền.

Trong mỗi khu vực, migration luân phiên qua nhiều quận/huyện và phường/xã. Danh sách đích chứa mã phường/xã và tên đường có thật, đã kiểm tra thuộc đúng khu vực. Số nhà mẫu được tạo có tính quyết định từ id phòng.

`address_detail` chỉ chứa `số nhà + tên đường`; tỉnh, huyện và xã được backend ghép từ `ward_id` như hiện tại.

## Ảnh hưởng tới ứng dụng

Không có thay đổi source code dự kiến. Frontend hiện truy vấn tỉnh, huyện theo tỉnh và xã theo huyện trực tiếp từ Supabase, nên sau migration:

- trang đăng tin nhận đủ danh mục 63 tỉnh/thành;
- trang tìm kiếm nhận đủ các lựa chọn tỉnh và huyện;
- homepage và kết quả tìm kiếm hiển thị địa chỉ thật qua join backend hiện có.

Danh mục vẫn được tải theo từng cấp, nên giới hạn mặc định 1.000 dòng của Supabase không ảnh hưởng: ứng dụng không tải đồng thời cả 10.035 phường/xã.

Nếu kiểm thử phát hiện code ứng dụng không tương thích với dữ liệu đầy đủ, việc sửa code phải được báo lại và thống nhất riêng; migration database không mặc nhiên mở rộng sang thay đổi ứng dụng.

## An toàn dữ liệu

- Transaction rollback toàn bộ nếu bất kỳ assertion nào thất bại.
- Chỉ các phòng dưới `Quận Mẫu 1` được remap.
- Hai phòng hiện có `ward_id = null` được giữ nguyên.
- Bài tìm bạn ở ghép đang thuộc `Quận Mẫu 1` được remap theo cùng quy tắc địa chỉ thật.
- Lựa chọn quận của hồ sơ ở ghép được chuyển sang mã quận thật tương ứng; `Quận 2` chuyển sang `Thành phố Thủ Đức`.
- Migration dừng nếu phát hiện khóa ngoại địa chỉ không có ánh xạ an toàn.
- `Quận Mẫu 1` và phường giả chỉ bị xóa sau khi ánh xạ của các phòng đã được lưu trong bảng tạm.
- Dữ liệu không được tải từ API trong lúc migration chạy.

## Tiêu chí hoàn thành

- Schema database không thay đổi.
- Có đúng 63 tỉnh/thành, 696 quận/huyện và 10.035 phường/xã.
- Mọi huyện tham chiếu tỉnh hợp lệ và mọi xã tham chiếu huyện hợp lệ.
- Không còn `Quận Mẫu 1` hoặc các phường giả trực thuộc.
- 215 phòng cũ có tỉnh-huyện-xã thật và `address_detail` mới.
- 1 bài tìm bạn ở ghép cũ có tỉnh-huyện-xã thật và `address_detail` mới.
- 27 hồ sơ ở ghép vẫn có `preferred_district_id` hợp lệ sau khi thay danh mục.
- Hai phòng có `ward_id = null` vẫn giữ nguyên.
- API danh sách phòng trả đúng địa chỉ sau join.
- Bộ lọc đăng tin và tìm kiếm hiển thị danh mục đầy đủ.
- Homepage và trang tìm kiếm không còn hiển thị `Quận Mẫu 1`.
- Các test hiện có vượt qua và browser QA xác nhận homepage, tìm kiếm, đăng tin hoạt động với dữ liệu mới.

## Tài liệu và giấy phép

PR kèm đường dẫn release `v2.4.1`, commit `fc33b74`, giấy phép MIT và checksum của đầu vào. Phần dữ liệu dẫn xuất giữ copyright notice theo điều kiện giấy phép.
