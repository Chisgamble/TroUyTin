# Thiết kế dữ liệu địa chỉ hành chính Việt Nam 3 cấp

## Bối cảnh

Cơ sở dữ liệu hiện chỉ có 6 tỉnh/thành, 11 quận/huyện và 13 phường/xã. Toàn bộ 13 phường/xã đều thuộc `Quận Mẫu 1`, khiến 215 phòng đang hiển thị cùng một quận giả và khiến bộ lọc địa chỉ chỉ có vài lựa chọn.

Ứng dụng hiện dùng mô hình địa chỉ ba cấp `tỉnh/thành -> quận/huyện -> phường/xã`. Theo yêu cầu sản phẩm, mô hình này được giữ lại dưới dạng snapshot lịch sử 63 tỉnh/thành, thay vì chuyển sang hệ thống hành chính hai cấp áp dụng từ ngày 01/07/2025.

## Mục tiêu

- Thay danh mục địa chỉ thiếu và giả bằng dữ liệu hành chính ba cấp đầy đủ của 63 tỉnh/thành.
- Giữ nguyên các khóa chính số nguyên hiện tại để không làm vỡ khóa ngoại của ứng dụng.
- Bổ sung mã hành chính chính thức, ổn định cho từng cấp.
- Remap 215 phòng đang thuộc `Quận Mẫu 1` sang các địa chỉ thật, nhất quán từ tỉnh đến tên đường.
- Xóa hoàn toàn `Quận Mẫu 1` và các phường giả trực thuộc.
- Làm cho bộ lọc đăng tin và tìm kiếm tự động sử dụng danh mục đầy đủ.
- Triển khai bằng migration có tính quyết định, không gọi API bên ngoài khi chạy.

## Ngoài phạm vi

- Không chuyển ứng dụng sang mô hình hành chính hai cấp 34 tỉnh/thành hiện hành.
- Không tạo danh mục toàn bộ đường phố Việt Nam; `address_detail` tiếp tục là trường văn bản tự do.
- Không thay đổi giá, nội dung, chủ phòng, hình ảnh hoặc trạng thái của phòng.
- Không refactor giao diện bộ lọc nếu luồng chọn liên hoàn hiện tại hoạt động đúng với dữ liệu mới.

## Nguồn dữ liệu

Danh mục được lấy từ [release `v2.4.1`](https://github.com/thanglequoc/vietnamese-provinces-database/releases/tag/v2.4.1), commit `fc33b74`, của repository [`thanglequoc/vietnamese-provinces-database`](https://github.com/thanglequoc/vietnamese-provinces-database/tree/v2.4.1). Đây là bản cắt cuối của mô hình 63 tỉnh/thành trước thay đổi lớn sang 34 tỉnh/thành. Dữ liệu của release này dựa trên API danh mục hành chính của Tổng cục Thống kê và được phát hành theo [giấy phép MIT](https://github.com/thanglequoc/vietnamese-provinces-database/blob/v2.4.1/LICENSE).

Snapshot kỳ vọng chứa chính xác:

- 63 tỉnh/thành;
- 705 đơn vị cấp huyện;
- 10.599 đơn vị cấp xã.

Migration được sinh từ đúng tag và commit nêu trên. Repository ứng dụng lưu thông tin nguồn, phiên bản, giấy phép và checksum của đầu vào bên cạnh migration để có thể kiểm tra lại nguồn gốc. Deployment không tải dữ liệu qua mạng.

## Thiết kế dữ liệu

Ba bảng hiện tại tiếp tục dùng khóa chính `serial`:

- `provinces.id`;
- `districts.id`, tham chiếu `provinces.id`;
- `wards.id`, tham chiếu `districts.id`.

Mỗi bảng được bổ sung cột `code` dạng chuỗi và unique index. Dạng chuỗi giữ nguyên số 0 ở đầu của mã hành chính:

- tỉnh/thành: 2 ký tự;
- quận/huyện: 3 ký tự;
- phường/xã: 5 ký tự.

Cột `name` lưu tên đầy đủ có loại đơn vị, ví dụ `Thành phố Hà Nội`, `Quận Ba Đình`, `Phường Phúc Xá`. Cách lưu này giúp nhãn bộ lọc và địa chỉ phòng rõ nghĩa mà không cần thêm cột loại đơn vị.

Mã hành chính là định danh nghiệp vụ dùng để nhập lại dữ liệu và remap; khóa `id` nội bộ vẫn là định danh mà các khóa ngoại của ứng dụng sử dụng.

## Cấu trúc migration

Migration chạy trong một transaction và thực hiện theo thứ tự:

1. Thêm các cột `code` tạm thời ở trạng thái nullable.
2. Nạp snapshot chính thức vào các bảng staging tạm thời.
3. Xác nhận staging có đúng 63 tỉnh/thành, 705 quận/huyện và 10.599 phường/xã; sai số lượng sẽ làm transaction thất bại.
4. Upsert danh mục thật theo mã, từ cấp tỉnh xuống cấp xã.
5. Tạo bảng ánh xạ tạm gồm mã phường/xã đích và tên đường thật đã được kiểm tra thuộc đúng khu vực.
6. Chọn tất cả phòng có ward nằm dưới district tên `Quận Mẫu 1` và remap có tính quyết định theo `room_listings.id`.
7. Cập nhật đồng thời `ward_id` và `address_detail` cho từng phòng được remap.
8. Xác nhận không còn phòng nào tham chiếu các phường giả.
9. Xóa toàn bộ phường giả dưới `Quận Mẫu 1`, sau đó xóa `Quận Mẫu 1`.
10. Loại bỏ các bản ghi danh mục cũ, không có mã và không còn được tham chiếu, vốn thuộc bộ dữ liệu mẫu thiếu hiện tại.
11. Đặt `code` thành `NOT NULL`, thêm unique index và index cho các khóa ngoại phục vụ truy vấn liên hoàn.
12. Xác nhận lại số lượng, tính duy nhất của mã, toàn vẹn khóa ngoại và việc không còn tên mẫu trước khi commit transaction.

Migration phải chạy được trên cả cơ sở dữ liệu hiện có và cơ sở dữ liệu mới khởi tạo. Nó không phụ thuộc vào giá trị `id = 1`; dữ liệu giả được nhận diện qua quan hệ cha-con và tên chính xác `Quận Mẫu 1`.

## Phân bổ phòng mẫu

Các phòng bị ảnh hưởng được phân bổ theo tỷ trọng, không chia đều cho 63 tỉnh/thành:

- 33% tại Thành phố Hồ Chí Minh;
- 27% tại Thành phố Hà Nội;
- 25% chia cho Đà Nẵng, Cần Thơ, Hải Phòng, Bình Dương và Đồng Nai;
- 15% rải có tính quyết định qua một nhóm tỉnh còn lại ở cả ba miền.

Trong mỗi khu vực, migration luân phiên qua nhiều quận/huyện và phường/xã. Cùng một `room_listings.id` luôn nhận cùng một vị trí khi tạo lại migration, giúp kết quả kiểm thử ổn định.

Danh sách địa chỉ đích là một tập được tuyển chọn, trong đó mỗi mục chứa:

- mã phường/xã từ snapshot;
- tên đường có thật;
- số nhà mẫu được tạo có tính quyết định từ id phòng.

`address_detail` có dạng `Số nhà + tên đường`. Tỉnh, huyện và xã không được lặp trong trường này vì backend đã ghép chúng qua `ward_id`.

## Luồng ứng dụng sau migration

Frontend hiện đã truy vấn danh sách tỉnh, huyện theo tỉnh và xã theo huyện trực tiếp từ Supabase. Do đó:

- trang đăng tin nhận đủ 63 tỉnh/thành và các lựa chọn con;
- trang tìm kiếm nhận đủ danh mục tỉnh/huyện;
- thẻ phòng trên homepage và kết quả tìm kiếm hiển thị địa chỉ thật thông qua join hiện có ở backend.

Các truy vấn tiếp tục tải theo từng cấp, nên giới hạn mặc định 1.000 dòng của Supabase không ảnh hưởng: không màn hình nào cần tải đồng thời cả 10.599 phường/xã.

Nếu kiểm thử cho thấy tên không được sắp xếp ổn định, service frontend sẽ thêm thứ tự theo `name`; không thay đổi API hoặc thiết kế component ngoài điều chỉnh này.

## Xử lý lỗi và an toàn dữ liệu

- Toàn bộ thay đổi dữ liệu nằm trong một transaction; mọi assertion thất bại sẽ rollback toàn bộ.
- Chỉ phòng đang tham chiếu cây `Quận Mẫu 1` bị remap.
- Hai phòng đang có `ward_id = null`, nếu vẫn tồn tại lúc chạy migration, được giữ nguyên vì không thuộc cây dữ liệu giả.
- `Quận Mẫu 1` chỉ được xóa sau assertion rằng không còn khóa ngoại trỏ tới các phường con.
- Các bản ghi danh mục không có mã chỉ bị xóa khi không còn được tham chiếu.
- Migration không dùng API runtime và không phụ thuộc thứ tự trả về không xác định.

## Kiểm thử và tiêu chí hoàn thành

### Kiểm tra migration

- Có đúng 63 tỉnh/thành, 705 quận/huyện và 10.599 phường/xã có mã chính thức.
- Không có mã trùng ở từng cấp.
- Không có huyện thiếu tỉnh hoặc xã thiếu huyện.
- Không còn district tên `Quận Mẫu 1`.
- Không còn các ward con giả của district đó.
- Không còn phòng tham chiếu ward đã xóa.
- Tất cả 215 phòng từng thuộc dữ liệu giả có địa chỉ tỉnh-huyện-xã hợp lệ và `address_detail` mới.
- Chạy migration trên dữ liệu mới hoặc chạy logic nhập lại không tạo bản ghi trùng.

### Kiểm tra backend và frontend

- API danh sách phòng trả đúng chuỗi địa chỉ sau join.
- Bộ chọn tỉnh hiển thị đủ 63 lựa chọn.
- Chọn tỉnh chỉ tải các quận/huyện thuộc tỉnh đó.
- Chọn quận/huyện chỉ tải các phường/xã thuộc quận/huyện đó.
- Homepage và trang tìm kiếm không còn hiển thị `Quận Mẫu 1`.
- Các test hiện có và test mới cho schema/dữ liệu đều vượt qua.
- Thực hiện browser QA cho homepage, tìm kiếm và luồng chọn địa chỉ khi đăng tin.

## Tài liệu và giấy phép

PR phải kèm ghi chú nguồn dữ liệu, đường dẫn release `v2.4.1`, commit `fc33b74`, giấy phép MIT và checksum của snapshot được dùng. Phần dữ liệu dẫn xuất phải giữ copyright notice theo điều kiện của giấy phép.
