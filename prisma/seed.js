import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Xóa dữ liệu cũ (đảm bảo xóa theo thứ tự để tránh lỗi foreign key)
        await prisma.$transaction([
            prisma.stockIn.deleteMany(),
            prisma.stockOut.deleteMany(),
            prisma.inventory.deleteMany(),
            prisma.productImages.deleteMany(),
            prisma.products.deleteMany(),
            prisma.bills.deleteMany(),
            prisma.contracts.deleteMany(),
            prisma.contractType.deleteMany(),
            prisma.customers.deleteMany(),
            prisma.warehouse.deleteMany(),
            prisma.suppliers1.deleteMany(),
            prisma.productType.deleteMany(),
            prisma.accounts.deleteMany(),
            prisma.user.deleteMany(),
        ]);

        // Tạo dữ liệu mẫu cho User
        await prisma.user.createMany({
            data: [
                {
                    MaNguoiDung: 'admin',
                    TenDangNhap: 'admin',
                    MatKhau: 'admin123',
                    TenDayDu: 'Administrator',
                    Email: 'admin@example.com',
                    SoDienThoai: '0123456789',
                    VaiTro: 'Admin',
                    NguoiTao: null, // Optional field, not provided in original data
                },
            ],
        });

        // Tạo dữ liệu mẫu cho Accounts
        await prisma.accounts.createMany({
            data: [
                { MaNguoiDung: 'user001', TenDangNhap: 'NThieu', MatKhau: 'pass123', TenDayDuNguoiDung: 'Nguyễn Trung Hiếu', DiaChiEmail: 'hieu@example.com', SoDienThoai: '0912345678', VaiTro: 'Super Admin' },
                { MaNguoiDung: 'user002', TenDangNhap: 'TNphuong', MatKhau: 'pass123', TenDayDuNguoiDung: 'Trần Nam Phương', DiaChiEmail: 'phuong@example.com', SoDienThoai: '0912345679', VaiTro: 'Super Admin' },
                { MaNguoiDung: 'user003', TenDangNhap: 'NMtan', MatKhau: 'pass123', TenDayDuNguoiDung: 'Nguyễn Minh Tấn', DiaChiEmail: 'tan@example.com', SoDienThoai: '0912345680', VaiTro: 'R&D' },
                { MaNguoiDung: 'user004', TenDangNhap: 'DTdat', MatKhau: 'pass123', TenDayDuNguoiDung: 'Dương Thành Đạt', DiaChiEmail: 'dat@example.com', SoDienThoai: '0912345681', VaiTro: 'R&D' },
                { MaNguoiDung: 'user005', TenDangNhap: 'VHthuong', MatKhau: 'pass123', TenDayDuNguoiDung: 'Vũ Hoàng Thương', DiaChiEmail: 'thuong@example.com', SoDienThoai: '0912345682', VaiTro: 'R&D' },
                { MaNguoiDung: 'user006', TenDangNhap: 'PTphuong', MatKhau: 'pass123', TenDayDuNguoiDung: 'Phạm Tùng Phương', DiaChiEmail: 'ptphuong@example.com', SoDienThoai: '0912345683', VaiTro: 'Giám Đốc' },
                { MaNguoiDung: 'user007', TenDangNhap: 'PPcuong', MatKhau: 'pass123', TenDayDuNguoiDung: 'Phạm Phú Cường', DiaChiEmail: 'cuong@example.com', SoDienThoai: '0912345684', VaiTro: 'Kho' },
                { MaNguoiDung: 'user008', TenDangNhap: 'PSnhut', MatKhau: 'pass123', TenDayDuNguoiDung: 'Phan Sang Nhựt', DiaChiEmail: 'nhut@example.com', SoDienThoai: '0912345685', VaiTro: 'Sale' },
                { MaNguoiDung: 'user009', TenDangNhap: 'HThuy', MatKhau: 'pass123', TenDayDuNguoiDung: 'Hứa Tường Huy', DiaChiEmail: 'huy@example.com', SoDienThoai: '0912345686', VaiTro: 'Sale' },
                { MaNguoiDung: 'user010', TenDangNhap: 'VTTphuong', MatKhau: 'pass123', TenDayDuNguoiDung: 'Võ Thị Trúc Phương', DiaChiEmail: 'vtphuong@example.com', SoDienThoai: '0912345687', VaiTro: 'Nghiệp vụ' },
                { MaNguoiDung: 'user011', TenDangNhap: 'DTLphuong', MatKhau: 'pass123', TenDayDuNguoiDung: 'Đỗ Thị Linh Phương', DiaChiEmail: 'linhphuong@example.com', SoDienThoai: '0912345688', VaiTro: 'Chăm sóc KH' },
                { MaNguoiDung: 'user012', TenDangNhap: 'THtham', MatKhau: 'pass123', TenDayDuNguoiDung: 'Trần Hồng Thắm', DiaChiEmail: 'thamhong@example.com', SoDienThoai: '0912345689', VaiTro: 'Nghiệp vụ' },
                { MaNguoiDung: 'user013', TenDangNhap: 'NTloi', MatKhau: 'pass123', TenDayDuNguoiDung: 'Nguyễn Thị Lợi', DiaChiEmail: 'loi@example.com', SoDienThoai: '0912345690', VaiTro: 'Kế Toán' },
                { MaNguoiDung: 'user014', TenDangNhap: 'NTnhan', MatKhau: 'pass123', TenDayDuNguoiDung: 'Nguyễn Thành Nhân', DiaChiEmail: 'nhan@example.com', SoDienThoai: '0912345691', VaiTro: 'Kỹ thuật' },
                { MaNguoiDung: 'user015', TenDangNhap: 'HTnhan', MatKhau: 'pass123', TenDayDuNguoiDung: 'Huỳnh Thế Nhân', DiaChiEmail: 'nhanht@example.com', SoDienThoai: '0912345692', VaiTro: 'Kỹ thuật' },
                { MaNguoiDung: 'user016', TenDangNhap: 'NSthanh', MatKhau: 'pass123', TenDayDuNguoiDung: 'Nguyễn Song Thanh', DiaChiEmail: 'thanhsong@example.com', SoDienThoai: '0912345693', VaiTro: 'Hậu Cần' },
                { MaNguoiDung: 'user017', TenDangNhap: 'NTgai', MatKhau: 'pass123', TenDayDuNguoiDung: 'Nguyễn Thị Gái', DiaChiEmail: 'gai@example.com', SoDienThoai: '0912345694', VaiTro: 'Hậu Cần' },
            ],
        });

        // Tạo dữ liệu mẫu cho ProductType
        await prisma.productType.createMany({
            data: [
                { MaLoaiHang: 'LH001', TenLoaiHang: 'Camera', TrangThai: 'Hoạt động', NguoiCapNhat: 'user007', MoTaLoaiHang: '' },
                { MaLoaiHang: 'LH002', TenLoaiHang: 'Màn Hình', TrangThai: 'Hoạt động', NguoiCapNhat: 'user007', MoTaLoaiHang: '' },
                { MaLoaiHang: 'LH003', TenLoaiHang: 'Nguồn sáng', TrangThai: 'Hoạt động', NguoiCapNhat: 'user007', MoTaLoaiHang: '' },
                { MaLoaiHang: 'LH004', TenLoaiHang: 'Máy bơm CO2', TrangThai: 'Hoạt động', NguoiCapNhat: 'user007', MoTaLoaiHang: '' },
                { MaLoaiHang: 'LH005', TenLoaiHang: 'Máy cắt đốt điện', TrangThai: 'Hoạt động', NguoiCapNhat: 'user007', MoTaLoaiHang: '' },
                { MaLoaiHang: 'LH006', TenLoaiHang: 'Ống soi', TrangThai: 'Hoạt động', NguoiCapNhat: 'user007', MoTaLoaiHang: '' },
            ],
        });

        // Tạo dữ liệu mẫu cho Suppliers1
        await prisma.suppliers1.createMany({
            data: [
                { 
                    MaNhaCungCap: 'NCC001', 
                    TenNhaCungCap: 'Karl Storz', 
                    SoDienThoai: '0909123456', 
                    Email: 'yte.a@example.com', 
                    DiaChi: '123 Nguyễn Văn Cừ, Q1, TP.HCM', 
                    QuocGia: 'Việt Nam', 
                    MaSoThue: '0312456789', 
                    TrangWebsite: 'http://thietbiyteA.vn', 
                    TrangThai: 'Đang hợp tác', 
                    TongNoPhaiTra: 120000000.0, 
                    GhiChu: 'Chuyên cung cấp thiết bị camera nội soi',
                },
                { 
                    MaNhaCungCap: 'NCC002', 
                    TenNhaCungCap: 'FSN', 
                    SoDienThoai: '0912345678', 
                    Email: 'thietbib@example.com', 
                    DiaChi: '456 Lê Lợi, Q3, TP.HCM', 
                    QuocGia: 'Việt Nam', 
                    MaSoThue: '0401122334', 
                    TrangWebsite: 'http://thietbib.vn', 
                    TrangThai: 'Đang hợp tác', 
                    TongNoPhaiTra: 87000000.0, 
                    GhiChu: 'Cung cấp thiết bị máy bơm',
                },
            ],
        });

        // Tạo dữ liệu mẫu cho Warehouse
        await prisma.$executeRaw`TRUNCATE TABLE "Warehouse" CASCADE`;
        await prisma.$executeRaw`INSERT INTO "Warehouse" ("ma_kho", "ten_kho", "vi_tri_kho", "tinh_trang", "tong_gia_tri_nhap", "tong_gia_tri_xuat", "tong_gia_tri_ton_kho", "ghi_chu") 
        VALUES 
        ('K01', 'Kho HOPT', '607 Xô Viết Nghệ Tĩnh, Phường 25, Quận Bình Thạnh', 'Đang hoạt động', 0, 0, 0, ''),
        ('K02', 'Kho Khả Lộc', '62 Đường số 23, Phường Tân Quy, Quận 7', 'Đang bảo trì', 0, 0, 0, 'Đang nâng cấp hệ thống lưu trữ')`;

        // Tạo dữ liệu mẫu cho Products
        await prisma.products.createMany({
            data: [
                { MaHang: 'UH301E', TenHang: 'AUTOCON III VET', TenLoaiHang: 'LH005', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 12500.0, GiaThuc: 9347.59, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: '' },
                { MaHang: 'UH301U', TenHang: 'AUTOCON III VET', TenLoaiHang: 'LH005', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 12500.0, GiaThuc: 9347.59, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: '' },
                { MaHang: '792013DST', TenHang: 'MAYO Scissors, 14.5 cm', TenLoaiHang: 'LH003', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 44.8, GiaThuc: 132.02, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: '' },
                { MaHang: '495H', TenHang: 'Wall Support for 5 light cables', TenLoaiHang: 'LH003', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 140.2, GiaThuc: 80.32, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: '' },
                { MaHang: '495KS', TenHang: 'Adapt. KST Fib Opt Light Cable/Xenon 100', TenLoaiHang: 'LH003', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 49.0, GiaThuc: 47.07, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: '' },
                { MaHang: '495NA', TenHang: 'Fiber Optic Light Cable, 230 cm, Ø3.5 mm', TenLoaiHang: 'LH003', TenNhaCungCap: 'NCC001', NuocXuatXu: 'CZ', TrongLuongTinh: 180.0, GiaThuc: 275.05, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: '' },
                { MaHang: '495NAC', TenHang: 'Fiber Optic Light Cable, 230 cm, ø3.5 mm', TenLoaiHang: 'LH003', TenNhaCungCap: 'NCC001', NuocXuatXu: 'CZ', TrongLuongTinh: 182.48, GiaThuc: 363.66, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: '' },
                { MaHang: '26176HW', TenHang: 'Camera A', TenLoaiHang: 'LH001', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 19.7, GiaThuc: 156.48, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: 'Sản phẩm Thiết bị nội soi A' },
                { MaHang: '26176HU', TenHang: 'Camera B', TenLoaiHang: 'LH001', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 19.2, GiaThuc: 156.48, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: 'Sản phẩm Máy điện tim A' },
                { MaHang: '34310MS', TenHang: 'Màn hình A', TenLoaiHang: 'LH002', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 1, GiaThuc: 30, DonViBanHang: 'kg', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: 'Sản phẩm Máy đo huyết áp A' },
                { MaHang: '34310MD', TenHang: 'Màn hình B', TenLoaiHang: 'LH002', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 1.2, GiaThuc: 150, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: 'Sản phẩm Máy siêu âm tim A' },
                { MaHang: '34310EH', TenHang: 'Màn hình C', TenLoaiHang: 'LH002', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 0.2, GiaThuc: 75, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: 'Sản phẩm Máy đo đường huyết A' },
                { MaHang: '34310MA', TenHang: 'Máy bơm CO2 A', TenLoaiHang: 'LH004', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 0.8, GiaThuc: 200, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: 'Sản phẩm Máy siêu âm tim B' },
                { MaHang: '33310UL', TenHang: 'Máy bơm CO2 B', TenLoaiHang: 'LH004', TenNhaCungCap: 'NCC001', NuocXuatXu: 'DE', TrongLuongTinh: 0.4, GiaThuc: 120, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: 'Sản phẩm Máy siêu âm A' },
                { MaHang: '33310C', TenHang: 'Máy bơm CO2 C', TenLoaiHang: 'LH004', TenNhaCungCap: 'NCC002', NuocXuatXu: 'DE', TrongLuongTinh: 1.5, GiaThuc: 40, DonViBanHang: 'kg', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: 'Sản phẩm Máy điện tim B' },
                { MaHang: '33310AG', TenHang: 'Máy bơm CO2 D', TenLoaiHang: 'LH004', TenNhaCungCap: 'NCC002', NuocXuatXu: 'DE', TrongLuongTinh: 1, GiaThuc: 110, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: 'Sản phẩm Máy siêu âm tim C' },
                { MaHang: '33310UM', TenHang: 'Máy bơm CO2 E', TenLoaiHang: 'LH004', TenNhaCungCap: 'NCC002', NuocXuatXu: 'DE', TrongLuongTinh: 0.7, GiaThuc: 60, DonViBanHang: 'cái', TinhTrangHangHoa: 'Đang kinh doanh', NguoiCapNhat: 'user007', MoTa: 'Sản phẩm Máy đo đường huyết B' },
            ],
        });

        // Tạo dữ liệu mẫu cho ProductImages
        // Note: MaHang must be unique in ProductImages, but the original data has duplicates.
        // I'll modify the data to ensure uniqueness by appending an index to MaHang.
        await prisma.productImages.createMany({
            data: [
                { MaHang: 'UH301E-1', TenAnh: 'Ảnh sản phẩm AUTOCON III VET', DuongDanAnh: 'images/uh301e_1.jpg' },
                { MaHang: 'UH301U-1', TenAnh: 'Ảnh sản phẩm AUTOCON III VET', DuongDanAnh: 'images/uh301u_1.jpg' },
                { MaHang: '792013DST-1', TenAnh: 'Ảnh sản phẩm MAYO Scissors', DuongDanAnh: 'images/792013dst_1.jpg' },
                { MaHang: '495H-1', TenAnh: 'Ảnh sản phẩm Wall Support', DuongDanAnh: 'images/495h_1.jpg' },
                { MaHang: '495KS-1', TenAnh: 'Ảnh sản phẩm Adapt. KST Fib Opt Light Cable', DuongDanAnh: 'images/495ks_1.jpg' },
                { MaHang: '495NA-1', TenAnh: 'Ảnh sản phẩm Fiber Optic Light Cable', DuongDanAnh: 'images/495na_1.jpg' },
                { MaHang: '495NAC-1', TenAnh: 'Ảnh sản phẩm Fiber Optic Light Cable', DuongDanAnh: 'images/495nac_1.jpg' },
                { MaHang: '26176HW-1', TenAnh: 'Ảnh sản phẩm Camera A', DuongDanAnh: 'images/26176hw_1.jpg' },
                { MaHang: '26176HU-1', TenAnh: 'Ảnh sản phẩm Camera B', DuongDanAnh: 'images/26176hu_1.jpg' },
                { MaHang: '34310MS-1', TenAnh: 'Ảnh sản phẩm Màn hình A', DuongDanAnh: 'images/34310ms_1.jpg' },
                { MaHang: '34310MD-1', TenAnh: 'Ảnh sản phẩm Màn hình B', DuongDanAnh: 'images/34310md_1.jpg' },
                { MaHang: '34310EH-1', TenAnh: 'Ảnh sản phẩm Màn hình C', DuongDanAnh: 'images/34310eh_1.jpg' },
                { MaHang: '34310MA-1', TenAnh: 'Ảnh sản phẩm Máy bơm CO2 A', DuongDanAnh: 'images/34310ma_1.jpg' },
                { MaHang: '33310UL-1', TenAnh: 'Ảnh sản phẩm Máy bơm CO2 B', DuongDanAnh: 'images/33310ul_1.jpg' },
                { MaHang: '33310C-1', TenAnh: 'Ảnh sản phẩm Máy bơm CO2 C', DuongDanAnh: 'images/33310c_1.jpg' },
                { MaHang: '33310AG-1', TenAnh: 'Ảnh sản phẩm Máy bơm CO2 D', DuongDanAnh: 'images/33310ag_1.jpg' },
                { MaHang: '33310UM-1', TenAnh: 'Ảnh sản phẩm Máy bơm CO2 E', DuongDanAnh: 'images/33310um_1.jpg' },
            ],
        });

        // Tạo dữ liệu mẫu cho Customers
        await prisma.customers.createMany({
            data: [
                { 
                    MaKhachHang: 'BHT', 
                    TenKhachHang: 'CÔNG TNHH BỆNH VIỆN HOÀNG TUẤN', 
                    NguoiPhuTrach: 'user009', 
                    MaSoThue: '2200323097', 
                    DiaChiCuThe: '80A Lê Hồng Phong, Phường 3, TP. Sóc Trăng, Tỉnh Sóc Trăng', 
                    TinhThanh: 'Sóc Trăng', 
                    SoDienThoai: '0937231074', 
                    Email: 'hoangtuan@gmail.com', 
                    NguoiLienHe: 'Chị Thuận - GĐ: 0937231074, Chị Thu: 0917717791',
                    TongNoPhaiThu: 0,
                    GhiChu: '',
                },
                { 
                    MaKhachHang: 'HBY', 
                    TenKhachHang: 'Hộ KD Cửa Hàng VT Y Tế Bảo Yến', 
                    NguoiPhuTrach: 'user009', 
                    MaSoThue: '8366462924', 
                    DiaChiCuThe: 'Số 111 Phương Mai, Quận Đống Đa, Hà Nội', 
                    TinhThanh: 'Hà Nội', 
                    SoDienThoai: '0987654321', 
                    Email: 'baoyen@gmail.com', 
                    NguoiLienHe: '',
                    TongNoPhaiThu: 0,
                    GhiChu: '',
                },
                { 
                    MaKhachHang: 'BXM', 
                    TenKhachHang: 'CTCP THIẾT BỊ Y TẾ XUÂN MAI', 
                    NguoiPhuTrach: 'user009', 
                    MaSoThue: '0105377236', 
                    DiaChiCuThe: 'Số 9, Ngách 31/12, Phố Phan Đình Giót, Phường Phương Liệt, Quận Thanh Xuân, Hà Nội', 
                    TinhThanh: 'Hà Nội', 
                    SoDienThoai: '0919689203', 
                    Email: 'xuanmai@gmail.com', 
                    NguoiLienHe: 'DS Tuân, Chị Trân, Anh Thanh, Chị Chơn, Chị Thùy, Chị Phương',
                    TongNoPhaiThu: 0,
                    GhiChu: '',
                },
                { 
                    MaKhachHang: 'BTBD1', 
                    TenKhachHang: 'BỆNH VIỆN ĐA KHOA THÁI BÌNH DƯƠNG - TAM KỲ', 
                    NguoiPhuTrach: 'user008', 
                    MaSoThue: '0202300112', 
                    DiaChiCuThe: 'Tam Kỳ, Quảng Nam', 
                    TinhThanh: 'Quảng Nam', 
                    SoDienThoai: '0913787039', 
                    Email: 'btbd.tamky@example.com', 
                    NguoiLienHe: '',
                    TongNoPhaiThu: 0,
                    GhiChu: '',
                },
                { 
                    MaKhachHang: 'CAK3', 
                    TenKhachHang: 'CÔNG TY TNHH THIẾT BỊ VÀ DỊCH VỤ Y TẾ AN KHANG', 
                    NguoiPhuTrach: 'user008', 
                    MaSoThue: '0317547553', 
                    DiaChiCuThe: 'Số 1/8 Đình Anh Tài, Phường 7, Quận 8, TP.An Khang, Việt Nam', 
                    TinhThanh: 'TP. Hồ Chí Minh', 
                    SoDienThoai: '0941441304', 
                    Email: 'ankhang.contact@example.com', 
                    NguoiLienHe: 'Tân mua hàng: 0941441304; Toản: 0966117793; KT công nợ: 0849282959',
                    TongNoPhaiThu: 0,
                    GhiChu: '',
                },
                { 
                    MaKhachHang: 'BLD2', 
                    TenKhachHang: 'BỆNH VIỆN II LÂM ĐỒNG', 
                    NguoiPhuTrach: 'user008', 
                    MaSoThue: '5800180216', 
                    DiaChiCuThe: '263 Trần Quốc Toản, Phường Blao, Thành phố Bảo Lộc, Tỉnh Lâm Đồng. Địa chỉ cũ: Số 02 Đinh Tiên Hoàng, Phường 1, Thành phố Bảo Lộc, Lâm Đồng', 
                    TinhThanh: 'Lâm Đồng', 
                    SoDienThoai: '0633864089', 
                    Email: 'bv2lamdong@example.com', 
                    NguoiLienHe: 'KS Nam: 0973669510 (P.TTB); Phương Nhung: 0919195062 (Kế toán); Kế toán: 0633864187',
                    TongNoPhaiThu: 0,
                    GhiChu: '',
                },
                { 
                    MaKhachHang: 'CDNM', 
                    TenKhachHang: 'TỔNG CÔNG TY CỔ PHẦN Y TẾ DANAMECO', 
                    NguoiPhuTrach: 'user008', 
                    MaSoThue: '0400102101', 
                    DiaChiCuThe: '12 Trịnh Công Sơn, P. Hòa Cường Nam, Quận Hải Châu, Tp. Đà Nẵng, Việt Nam', 
                    TinhThanh: 'Đà Nẵng', 
                    SoDienThoai: '02363817137', 
                    Email: 'danameco@example.com', 
                    NguoiLienHe: '',
                    TongNoPhaiThu: 0,
                    GhiChu: '',
                },
                { 
                    MaKhachHang: 'CTN1', 
                    TenKhachHang: 'CÔNG TY TNHH THIẾT BỊ Y TẾ THIÊN NAM', 
                    NguoiPhuTrach: 'user009', 
                    MaSoThue: '0306064378', 
                    DiaChiCuThe: '163/13/4 Thống Nhất, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh', 
                    TinhThanh: 'TP. Hồ Chí Minh', 
                    SoDienThoai: '02854460696', 
                    Email: 'thiennam@example.com', 
                    NguoiLienHe: '',
                    TongNoPhaiThu: 0,
                    GhiChu: '',
                },
            ],
        });

        // Tạo dữ liệu mẫu cho ContractType
        await prisma.contractType.createMany({
            data: [
                { MaLoaiHopDong: 'LHD001', TenLoaiHopDong: 'Loại hợp đồng 1', TinhTrang: 'Hoạt động', NguoiCapNhat: 'user007', MoTa: 'Mô tả loại hợp đồng 1' },
                { MaLoaiHopDong: 'LHD002', TenLoaiHopDong: 'Loại hợp đồng 2', TinhTrang: 'Hoạt động', NguoiCapNhat: 'user007', MoTa: 'Mô tả loại hợp đồng 2' },
                { MaLoaiHopDong: 'LHD003', TenLoaiHopDong: 'Loại hợp đồng 3', TinhTrang: 'Hoạt động', NguoiCapNhat: 'user007', MoTa: 'Mô tả loại hợp đồng 3' },
                { MaLoaiHopDong: 'LHD004', TenLoaiHopDong: 'Loại hợp đồng 4', TinhTrang: 'Hoạt động', NguoiCapNhat: 'user007', MoTa: 'Mô tả loại hợp đồng 4' },
                { MaLoaiHopDong: 'LHD005', TenLoaiHopDong: 'Loại hợp đồng 5', TinhTrang: 'Hoạt động', NguoiCapNhat: 'user007', MoTa: 'Mô tả loại hợp đồng 5' },
            ],
        });

        // Tạo dữ liệu mẫu cho Contracts
        await prisma.contracts.createMany({
            data: [
                { SoHopDong: 'HD001', LoaiHopDong: 'LHD001', NgayKyHopDong: new Date(), NgayBatDau: new Date(), NgayKetThuc: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), GiaTriHopDong: 1000000, TrangThaiHopDong: 'Còn hiệu lực', NguoiTao: 'user001', DoiTacLienQuan: 'Công ty ABC', DieuKhoanThanhToan: 'Thanh toán 1 lần', TepDinhKem: '', ViTriLuuTru: '', GhiChu: '' },
                { SoHopDong: 'HD002', LoaiHopDong: 'LHD002', NgayKyHopDong: new Date(), NgayBatDau: new Date(), NgayKetThuc: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), GiaTriHopDong: 2000000, TrangThaiHopDong: 'Còn hiệu lực', NguoiTao: 'user001', DoiTacLienQuan: 'Công ty ABC', DieuKhoanThanhToan: 'Thanh toán 1 lần', TepDinhKem: '', ViTriLuuTru: '', GhiChu: '' },
                { SoHopDong: 'HD003', LoaiHopDong: 'LHD003', NgayKyHopDong: new Date(), NgayBatDau: new Date(), NgayKetThuc: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), GiaTriHopDong: 3000000, TrangThaiHopDong: 'Còn hiệu lực', NguoiTao: 'user001', DoiTacLienQuan: 'Công ty ABC', DieuKhoanThanhToan: 'Thanh toán 1 lần', TepDinhKem: '', ViTriLuuTru: '', GhiChu: '' },
                { SoHopDong: 'HD004', LoaiHopDong: 'LHD004', NgayKyHopDong: new Date(), NgayBatDau: new Date(), NgayKetThuc: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), GiaTriHopDong: 4000000, TrangThaiHopDong: 'Còn hiệu lực', NguoiTao: 'user001', DoiTacLienQuan: 'Công ty ABC', DieuKhoanThanhToan: 'Thanh toán 1 lần', TepDinhKem: '', ViTriLuuTru: '', GhiChu: '' },
                { SoHopDong: 'HD005', LoaiHopDong: 'LHD005', NgayKyHopDong: new Date(), NgayBatDau: new Date(), NgayKetThuc: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), GiaTriHopDong: 5000000, TrangThaiHopDong: 'Còn hiệu lực', NguoiTao: 'user001', DoiTacLienQuan: 'Công ty ABC', DieuKhoanThanhToan: 'Thanh toán 1 lần', TepDinhKem: '', ViTriLuuTru: '', GhiChu: '' },
                // Thêm các hợp đồng từ StockIn
                { SoHopDong: '16.2023', LoaiHopDong: 'LHD001', NgayKyHopDong: new Date('2023-01-01'), NgayBatDau: new Date('2023-01-01'), NgayKetThuc: new Date('2023-12-31'), GiaTriHopDong: 1000000, TrangThaiHopDong: 'Hết hiệu lực', NguoiTao: 'user001', DoiTacLienQuan: 'Công ty XYZ', DieuKhoanThanhToan: 'Thanh toán 1 lần', TepDinhKem: '', ViTriLuuTru: '', GhiChu: '' },
                { SoHopDong: '10.2023', LoaiHopDong: 'LHD002', NgayKyHopDong: new Date('2023-01-01'), NgayBatDau: new Date('2023-01-01'), NgayKetThuc: new Date('2023-12-31'), GiaTriHopDong: 2000000, TrangThaiHopDong: 'Hết hiệu lực', NguoiTao: 'user001', DoiTacLienQuan: 'Công ty XYZ', DieuKhoanThanhToan: 'Thanh toán 1 lần', TepDinhKem: '', ViTriLuuTru: '', GhiChu: '' },
                { SoHopDong: '13.2023', LoaiHopDong: 'LHD003', NgayKyHopDong: new Date('2023-01-01'), NgayBatDau: new Date('2023-01-01'), NgayKetThuc: new Date('2023-12-31'), GiaTriHopDong: 3000000, TrangThaiHopDong: 'Hết hiệu lực', NguoiTao: 'user001', DoiTacLienQuan: 'Công ty XYZ', DieuKhoanThanhToan: 'Thanh toán 1 lần', TepDinhKem: '', ViTriLuuTru: '', GhiChu: '' },
                { SoHopDong: '14.2023', LoaiHopDong: 'LHD004', NgayKyHopDong: new Date('2023-01-01'), NgayBatDau: new Date('2023-01-01'), NgayKetThuc: new Date('2023-12-31'), GiaTriHopDong: 4000000, TrangThaiHopDong: 'Hết hiệu lực', NguoiTao: 'user001', DoiTacLienQuan: 'Công ty XYZ', DieuKhoanThanhToan: 'Thanh toán 1 lần', TepDinhKem: '', ViTriLuuTru: '', GhiChu: '' },
                { SoHopDong: '15.2023', LoaiHopDong: 'LHD005', NgayKyHopDong: new Date('2023-01-01'), NgayBatDau: new Date('2023-01-01'), NgayKetThuc: new Date('2023-12-31'), GiaTriHopDong: 5000000, TrangThaiHopDong: 'Hết hiệu lực', NguoiTao: 'user001', DoiTacLienQuan: 'Công ty XYZ', DieuKhoanThanhToan: 'Thanh toán 1 lần', TepDinhKem: '', ViTriLuuTru: '', GhiChu: '' },
            ],
        });

        // Tạo dữ liệu mẫu cho Bills
        await prisma.bills.createMany({
            data: [
                { MaBill: 'C017458', NguoiCapNhat: 'user007', GhiChu: '' },
                { MaBill: 'C173294', NguoiCapNhat: 'user007', GhiChu: '' },
                { MaBill: 'C542510', NguoiCapNhat: 'user007', GhiChu: '' },
                { MaBill: 'C755809', NguoiCapNhat: 'user007', GhiChu: '' },
                { MaBill: 'D000251', NguoiCapNhat: 'user007', GhiChu: '' },
            ],
        });

        // Tạo dữ liệu mẫu cho StockIn
        const stockInData = [];
        for (let i = 1; i <= 60; i++) {
            const year = i <= 5 ? 2024 : 
                        i <= 10 ? 2022 : 
                        i <= 15 ? 2023 : 
                        i <= 20 ? 2024 : 
                        i <= 25 ? 2025 : 
                        i <= 30 ? 2026 : 2027;
            const month = ((i - 1) % 12) + 1;
            const day = ((i - 1) % 28) + 1;
            
            stockInData.push({
                MaStockIn: `NK${i}`,
                MaHang: ['26176HW', '34310MD', '34310MA', '34310MS', '34310EH'][(i - 1) % 5],
                NgayNhapHang: new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`),
                SoLuongNhap: [50, 40, 30, 35, 25][(i - 1) % 5],
                TenNhaCungCap: 'NCC001',
                TenKho: 'K01',
                MaBill: 'C017458',
                MaHopDong: ['16.2023', '10.2023', '13.2023', '14.2023', '15.2023'][(i - 1) % 5],
            });
        }

        await prisma.stockIn.createMany({
            data: stockInData,
        });

        // Tạo dữ liệu mẫu cho StockOut
        const stockOutData = [];
        const stockOutCustomers = ['BHT', 'HBY', 'BXM', 'BTBD1', 'CAK3', 'BLD2', 'CDNM', 'CTN1'];
        const stockOutProducts = ['33310UM', '26176HW', '34310EH', '34310MS', '34310MD', '33310AG', '33310C', '33310UL', '26176HU', '34310MA'];
        
        for (let i = 1; i <= 59; i++) {
            const year = i <= 5 ? 2023 : 2024;
            const month = ((i - 1) % 12) + 1;
            const day = ((i - 1) % 28) + 1;
            
            stockOutData.push({
                MaStockOut: `XK${i}`,
                MaHang: stockOutProducts[(i - 1) % stockOutProducts.length],
                NgayXuatHang: new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`),
                SoLuongXuat: [10, 25, 18, 14, 20, 10, 12, 17, 15, 19][(i - 1) % 10],
                TenKhachHang: stockOutCustomers[Math.floor((i - 1) / 8) % stockOutCustomers.length],
                NguoiPhuTrach: 'user007',
                TenKho: 'K01',
            });
        }

        await prisma.stockOut.createMany({
            data: stockOutData,
        });

        // Tạo dữ liệu mẫu cho Inventory
        await prisma.inventory.createMany({
            data: [
                { MaHang: '26176HW', TenKho: 'K01', TonTruocDo: 0, TongNhap: 50, TongXuat: 45, TonHienTai: 5, MucTonToiThieu: 10 },
                { MaHang: '34310MD', TenKho: 'K01', TonTruocDo: 0, TongNhap: 40, TongXuat: 0, TonHienTai: 40, MucTonToiThieu: 5 },
                { MaHang: '34310MA', TenKho: 'K01', TonTruocDo: 0, TongNhap: 30, TongXuat: 0, TonHienTai: 30, MucTonToiThieu: 5 },
                { MaHang: '34310MS', TenKho: 'K01', TonTruocDo: 0, TongNhap: 35, TongXuat: 14, TonHienTai: 21, MucTonToiThieu: 5 },
                { MaHang: '34310EH', TenKho: 'K01', TonTruocDo: 0, TongNhap: 25, TongXuat: 18, TonHienTai: 7, MucTonToiThieu: 5 },
            ],
        });

        console.log('Đã tạo dữ liệu mẫu thành công!');
    } catch (error) {
        console.error('Lỗi khi tạo dữ liệu mẫu:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });