-- CreateTable
CREATE TABLE "user_activity_log" (
    "id" SERIAL NOT NULL,
    "ma_nguoi_dung" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" TEXT,

    CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "stt" SERIAL NOT NULL,
    "ma_nguoi_dung" VARCHAR NOT NULL,
    "ten_dang_nhap" VARCHAR NOT NULL,
    "mat_khau" VARCHAR NOT NULL,
    "ho_va_ten" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "so_dien_thoai" VARCHAR NOT NULL,
    "vai_tro" VARCHAR,
    "ngay_tao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("ma_nguoi_dung")
);

-- CreateTable
CREATE TABLE "product_type" (
    "stt" SERIAL NOT NULL,
    "ma_loai_hang" VARCHAR NOT NULL,
    "ten_loai_hang" VARCHAR NOT NULL,
    "trang_thai" VARCHAR,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "mo_ta" TEXT,

    CONSTRAINT "product_type_pkey" PRIMARY KEY ("ma_loai_hang")
);

-- CreateTable
CREATE TABLE "role" (
    "stt" SERIAL NOT NULL,
    "ma_vai_tro" VARCHAR NOT NULL,
    "vai_tro" VARCHAR NOT NULL,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ghi_chu" TEXT,

    CONSTRAINT "role_pkey" PRIMARY KEY ("ma_vai_tro")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "stt" SERIAL NOT NULL,
    "ma_nha_cung_cap" VARCHAR NOT NULL,
    "ten_nha_cung_cap" VARCHAR NOT NULL,
    "so_dien_thoai" VARCHAR,
    "email" VARCHAR,
    "dia_chi" VARCHAR,
    "quoc_gia" VARCHAR,
    "ma_so_thue" VARCHAR,
    "trang_website" TEXT,
    "trang_thai" VARCHAR,
    "ngay_them_vao" DATE,
    "tong_no_phai_tra" DOUBLE PRECISION DEFAULT 0,
    "ghi_chu" TEXT,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("ma_nha_cung_cap")
);

-- CreateTable
CREATE TABLE "competitors" (
    "stt" SERIAL NOT NULL,
    "ma_doi_thu" VARCHAR NOT NULL,
    "ten_doi_thu" VARCHAR NOT NULL,
    "san_pham_canh_tranh" VARCHAR,
    "chien_luoc_gia_ca" VARCHAR,
    "danh_gia_muc_do_canh_tranh" VARCHAR,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ghi_chu" TEXT,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("ma_doi_thu")
);

-- CreateTable
CREATE TABLE "product_images" (
    "stt" SERIAL NOT NULL,
    "ma_hang" VARCHAR,
    "ten_anh" VARCHAR,
    "duong_dan_anh" TEXT,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("stt")
);

-- CreateTable
CREATE TABLE "products" (
    "stt" SERIAL NOT NULL,
    "ma_hang" VARCHAR NOT NULL,
    "ten_hang" VARCHAR,
    "ten_loai_hang" VARCHAR,
    "ten_nha_cung_cap" VARCHAR,
    "nuoc_xuat_xu" VARCHAR NOT NULL,
    "trong_luong_tinh" DOUBLE PRECISION,
    "gia_thuc" DOUBLE PRECISION NOT NULL,
    "don_vi_ban_hang" VARCHAR NOT NULL,
    "tinh_trang_hang_hoa" VARCHAR,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "mo_ta" TEXT,
    "price_list" VARCHAR,
    "ngay_gia" DATE,

    CONSTRAINT "products_pkey" PRIMARY KEY ("stt")
);

-- CreateTable
CREATE TABLE "bills" (
    "stt" SERIAL NOT NULL,
    "ma_bill" VARCHAR NOT NULL,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ghi_chu" TEXT,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("ma_bill")
);

-- CreateTable
CREATE TABLE "business_tasks" (
    "stt" SERIAL NOT NULL,
    "ma_cong_viec_kinh_doanh" VARCHAR NOT NULL,
    "ten_cong_viec" VARCHAR NOT NULL,
    "noi_dung_cong_viec" TEXT,
    "khach_hang_lien_quan" VARCHAR,
    "trang_thai_cong_viec" VARCHAR,
    "do_uu_tien" VARCHAR,
    "ngay_bat_dau" DATE NOT NULL,
    "ngay_ket_thuc" DATE NOT NULL,
    "ngay_hoan_thanh" DATE,
    "so_ngay_con_lai" INTEGER NOT NULL,
    "tep_dinh_kem" VARCHAR,
    "ghi_chu" TEXT,

    CONSTRAINT "business_tasks_pkey" PRIMARY KEY ("ma_cong_viec_kinh_doanh")
);

-- CreateTable
CREATE TABLE "contract_type" (
    "stt" SERIAL NOT NULL,
    "ma_loai_hop_dong" VARCHAR NOT NULL,
    "ten_loai_hop_dong" VARCHAR NOT NULL,
    "tinh_trang" VARCHAR,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "mo_ta" TEXT,

    CONSTRAINT "contract_type_pkey" PRIMARY KEY ("ma_loai_hop_dong")
);

-- CreateTable
CREATE TABLE "contracts" (
    "stt" SERIAL NOT NULL,
    "so_hop_dong" VARCHAR NOT NULL,
    "loai_hop_dong" VARCHAR,
    "ngay_ky_hop_dong" DATE,
    "ngay_bat_dau" DATE,
    "ngay_ket_thuc" DATE,
    "gia_tri_hop_dong" DOUBLE PRECISION DEFAULT 0,
    "trang_thai_hop_dong" VARCHAR,
    "doi_tac_lien_quan" VARCHAR,
    "dieu_khoan_thanh_toan" VARCHAR,
    "tep_dinh_kem" VARCHAR,
    "vi_tri_luu_tru" TEXT,
    "nguoi_tao" VARCHAR,
    "ghi_chu" TEXT,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("so_hop_dong")
);

-- CreateTable
CREATE TABLE "customer_group" (
    "stt" SERIAL NOT NULL,
    "ma_nhom_khach_hang" VARCHAR NOT NULL,
    "nhom_khach_hang" VARCHAR NOT NULL,
    "mo_ta" TEXT,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_group_pkey" PRIMARY KEY ("ma_nhom_khach_hang")
);

-- CreateTable
CREATE TABLE "customer_interactions" (
    "stt" SERIAL NOT NULL,
    "ma_tuong_tac_khach_hang" VARCHAR NOT NULL,
    "ten_khach_hang" VARCHAR,
    "nguoi_phu_trach" VARCHAR,
    "loai_tuong_tac" VARCHAR,
    "hinh_thuc_goi" VARCHAR,
    "thoi_gian" TIMESTAMP(6) NOT NULL,
    "noi_dung_tuong_tac" TEXT,

    CONSTRAINT "customer_interactions_pkey" PRIMARY KEY ("ma_tuong_tac_khach_hang")
);

-- CreateTable
CREATE TABLE "customers" (
    "stt" SERIAL NOT NULL,
    "ma_khach_hang" VARCHAR NOT NULL,
    "ten_khach_hang" VARCHAR NOT NULL,
    "nguoi_phu_trach" VARCHAR,
    "ma_so_thue" VARCHAR,
    "dia_chi_cu_the" TEXT,
    "tinh_thanh" VARCHAR,
    "so_dien_thoai" VARCHAR,
    "email" VARCHAR,
    "nguoi_lien_he" TEXT,
    "ngay_them_vao" DATE,
    "tong_no_phai_thu" DOUBLE PRECISION DEFAULT 0,
    "ghi_chu" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("ma_khach_hang")
);

-- CreateTable
CREATE TABLE "dx_activity_logs" (
    "stt" SERIAL NOT NULL,
    "ma_hoat_dong_dx" VARCHAR NOT NULL,
    "ten_nguoi_dung" VARCHAR,
    "ngay_hoat_dong" VARCHAR NOT NULL,
    "loai_hoat_dong" VARCHAR NOT NULL,
    "mo_ta_ngan" VARCHAR,
    "noi_dung_chi_tiet" VARCHAR,

    CONSTRAINT "dx_activity_logs_pkey" PRIMARY KEY ("ma_hoat_dong_dx")
);

-- CreateTable
CREATE TABLE "interaction_type" (
    "stt" SERIAL NOT NULL,
    "ma_loai_tuong_tac" VARCHAR NOT NULL,
    "loai_tuong_tac" VARCHAR NOT NULL,
    "trang_thai" VARCHAR,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_type_pkey" PRIMARY KEY ("ma_loai_tuong_tac")
);

-- CreateTable
CREATE TABLE "inventory" (
    "nam" INTEGER NOT NULL,
    "stt" SERIAL NOT NULL,
    "ma_inventory" VARCHAR NOT NULL,
    "ma_hang" VARCHAR,
    "ten_kho" VARCHAR,
    "ton_truoc_do" INTEGER NOT NULL,
    "tong_nhap" INTEGER NOT NULL,
    "tong_xuat" INTEGER NOT NULL,
    "ton_hien_tai" INTEGER NOT NULL,
    "muc_ton_toi_thieu" INTEGER NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("ma_inventory")
);

-- CreateTable
CREATE TABLE "inventory_check" (
    "nam" INTEGER NOT NULL,
    "stt" SERIAL NOT NULL,
    "ma_kiem_ke" VARCHAR NOT NULL,
    "ma_hang" VARCHAR,
    "ten_kho" VARCHAR,
    "so_luong_he_thong_ghi_nhan" VARCHAR,
    "so_luong_thuc_te" INTEGER NOT NULL,
    "chenh_lech" INTEGER NOT NULL,
    "ngay_thuc_hien_kiem_ke" DATE NOT NULL,
    "nguoi_kiem_ke" VARCHAR,
    "ghi_chu" TEXT,

    CONSTRAINT "inventory_check_pkey" PRIMARY KEY ("ma_kiem_ke")
);

-- CreateTable
CREATE TABLE "opportunity_source" (
    "stt" SERIAL NOT NULL,
    "ma_nguon" VARCHAR NOT NULL,
    "nguon" VARCHAR NOT NULL,
    "trang_thai" VARCHAR,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_source_pkey" PRIMARY KEY ("ma_nguon")
);

-- CreateTable
CREATE TABLE "order_details" (
    "stt" SERIAL NOT NULL,
    "ma_chi_tiet_don_hang" VARCHAR NOT NULL,
    "ma_hang" VARCHAR,
    "so_luong" INTEGER NOT NULL,
    "ngay_dat_hang" DATE NOT NULL,
    "ma_hop_dong" VARCHAR,
    "so_xac_nhan_don_hang" VARCHAR,
    "ten_khach_hang" VARCHAR,
    "nguoi_phu_trach" VARCHAR,
    "ngay_tam_ung" DATE,
    "tu_ngay" DATE,
    "den_ngay" DATE,
    "tinh_trang_don_hang" VARCHAR,
    "hang_bao_ngay_du_kien_lan_1" DATE,
    "hang_bao_ngay_du_kien_lan_2" DATE,
    "invoice_1" VARCHAR,
    "packing_list_1" VARCHAR,
    "so_luong_lo_1" INTEGER,
    "hawb_1" VARCHAR,
    "invoice_2" VARCHAR,
    "packing_list_2" VARCHAR,
    "so_luong_lo_2" INTEGER,
    "hawb_2" VARCHAR,
    "invoice_3" VARCHAR,
    "packing_list_3" VARCHAR,
    "so_luong_lo_3" INTEGER,
    "hawb_3" VARCHAR,
    "invoice_4" VARCHAR,
    "packing_list_4" VARCHAR,
    "so_luong_lo_4" INTEGER,
    "hawb_4" VARCHAR,
    "invoice_5" VARCHAR,
    "packing_list_5" VARCHAR,
    "so_luong_lo_5" INTEGER,
    "hawb_5" VARCHAR,
    "so_luong_hang_chua_ve" INTEGER,
    "ghi_chu" TEXT,

    CONSTRAINT "order_details_pkey" PRIMARY KEY ("ma_chi_tiet_don_hang")
);

-- CreateTable
CREATE TABLE "orders" (
    "stt" SERIAL NOT NULL,
    "so_don_hang" VARCHAR NOT NULL,
    "tong_gia_tri_don_hang" DOUBLE PRECISION DEFAULT 0,
    "nguoi_lap_don" VARCHAR,
    "ngay_tao_don" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ghi_chu" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("so_don_hang")
);

-- CreateTable
CREATE TABLE "potential_customer" (
    "stt" SERIAL NOT NULL,
    "ma_khach_hang_tiem_nang" VARCHAR NOT NULL,
    "ten_khach_hang" VARCHAR NOT NULL,
    "nguoi_phu_trach" VARCHAR,
    "hanh_dong_tiep_theo" VARCHAR,
    "ngay_lien_lac_tiep_theo" DATE,
    "so_lan_da_lien_lac" INTEGER NOT NULL,
    "muc_dich" VARCHAR,
    "nhom_khach_hang" VARCHAR,
    "nguon_tiep_can" VARCHAR,
    "tinh_trang" VARCHAR,
    "ngay_them_vao" DATE,
    "email" VARCHAR,
    "so_dien_thoai" VARCHAR,
    "website" VARCHAR,
    "dia_chi_cu_the" TEXT,
    "tinh_thanh" VARCHAR,
    "ghi_chu" TEXT,

    CONSTRAINT "potential_customer_pkey" PRIMARY KEY ("ma_khach_hang_tiem_nang")
);

-- CreateTable
CREATE TABLE "priority_level" (
    "stt" SERIAL NOT NULL,
    "ma_do_uu_tien" VARCHAR NOT NULL,
    "do_uu_tien" VARCHAR NOT NULL,
    "mau_nhan" VARCHAR,
    "mo_ta" TEXT,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "priority_level_pkey" PRIMARY KEY ("ma_do_uu_tien")
);

-- CreateTable
CREATE TABLE "quotation_status" (
    "stt" SERIAL NOT NULL,
    "ma_trang_thai_bao_gia" VARCHAR NOT NULL,
    "trang_thai_bao_gia" VARCHAR NOT NULL,
    "mo_ta" TEXT,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_status_pkey" PRIMARY KEY ("ma_trang_thai_bao_gia")
);

-- CreateTable
CREATE TABLE "quotation_type" (
    "stt" SERIAL NOT NULL,
    "ma_loai_bao_gia" VARCHAR NOT NULL,
    "loai_bao_gia" VARCHAR NOT NULL,
    "trang_thai" VARCHAR,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_type_pkey" PRIMARY KEY ("ma_loai_bao_gia")
);

-- CreateTable
CREATE TABLE "quotations" (
    "stt" SERIAL NOT NULL,
    "so_bao_gia" VARCHAR NOT NULL,
    "tinh_trang" VARCHAR,
    "tieu_de" VARCHAR,
    "ten_khach_hang" VARCHAR NOT NULL,
    "loai_bao_gia" VARCHAR,
    "ngay_bao_gia" DATE NOT NULL,
    "price_list" VARCHAR NOT NULL,
    "so_dien_thoai" VARCHAR,
    "nguoi_lien_he" VARCHAR,
    "nguoi_phu_trach" VARCHAR,
    "tong_tri_gia" DOUBLE PRECISION DEFAULT 0,
    "ghi_chu" TEXT,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("so_bao_gia")
);

-- CreateTable
CREATE TABLE "stock_in" (
    "stt" SERIAL NOT NULL,
    "ma_stock_in" VARCHAR NOT NULL,
    "ma_hang" VARCHAR,
    "ngay_nhap_hang" DATE NOT NULL,
    "so_luong_nhap" INTEGER NOT NULL,
    "ten_nha_cung_cap" VARCHAR,
    "ten_kho" VARCHAR,
    "ma_bill" VARCHAR,
    "ma_hop_dong" VARCHAR,

    CONSTRAINT "stock_in_pkey" PRIMARY KEY ("ma_stock_in")
);

-- CreateTable
CREATE TABLE "stock_out" (
    "stt" SERIAL NOT NULL,
    "ma_stock_out" VARCHAR NOT NULL,
    "ma_hang" VARCHAR,
    "ngay_xuat_hang" DATE NOT NULL,
    "so_luong_xuat" INTEGER NOT NULL,
    "ten_kho" VARCHAR,
    "ten_khach_hang" VARCHAR,
    "nguoi_phu_trach" VARCHAR,

    CONSTRAINT "stock_out_pkey" PRIMARY KEY ("ma_stock_out")
);

-- CreateTable
CREATE TABLE "task_status" (
    "stt" SERIAL NOT NULL,
    "ma_trang_thai_cong_viec" VARCHAR NOT NULL,
    "trang_thai_cong_viec" VARCHAR NOT NULL,
    "nguoi_cap_nhat" VARCHAR,
    "ngay_cap_nhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_status_pkey" PRIMARY KEY ("ma_trang_thai_cong_viec")
);

-- CreateTable
CREATE TABLE "warehouse" (
    "stt" SERIAL NOT NULL,
    "ma_kho" VARCHAR NOT NULL,
    "ten_kho" VARCHAR NOT NULL,
    "vi_tri_kho" VARCHAR NOT NULL,
    "tinh_trang" VARCHAR,
    "nguoi_tao" VARCHAR,
    "ngay_tao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "quan_ly_kho" VARCHAR,
    "ngay_kiem_ke_gan_nhat" DATE,
    "tong_gia_tri_nhap" DOUBLE PRECISION DEFAULT 0,
    "tong_gia_tri_xuat" DOUBLE PRECISION DEFAULT 0,
    "tong_gia_tri_ton_kho" DOUBLE PRECISION DEFAULT 0,
    "ghi_chu" TEXT,

    CONSTRAINT "warehouse_pkey" PRIMARY KEY ("ma_kho")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_stt_key" ON "accounts"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_ten_dang_nhap_key" ON "accounts"("ten_dang_nhap");

-- CreateIndex
CREATE UNIQUE INDEX "product_type_stt_key" ON "product_type"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_ten_loai_hang" ON "product_type"("ten_loai_hang");

-- CreateIndex
CREATE UNIQUE INDEX "role_stt_key" ON "role"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_vai_tro" ON "role"("vai_tro");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_stt_key" ON "suppliers"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_ten_nha_cung_cap" ON "suppliers"("ten_nha_cung_cap");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_stt_key" ON "competitors"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_ten_doi_thu" ON "competitors"("ten_doi_thu");

-- CreateIndex
CREATE UNIQUE INDEX "products_stt_key" ON "products"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "bills_stt_key" ON "bills"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "business_tasks_stt_key" ON "business_tasks"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "contract_type_stt_key" ON "contract_type"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_ten_loai_hop_dong" ON "contract_type"("ten_loai_hop_dong");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_stt_key" ON "contracts"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "customer_group_stt_key" ON "customer_group"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_nhom_khach_hang" ON "customer_group"("nhom_khach_hang");

-- CreateIndex
CREATE UNIQUE INDEX "customer_interactions_stt_key" ON "customer_interactions"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "customers_stt_key" ON "customers"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_ten_khach_hang2" ON "customers"("ten_khach_hang");

-- CreateIndex
CREATE UNIQUE INDEX "dx_activity_logs_stt_key" ON "dx_activity_logs"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "interaction_type_stt_key" ON "interaction_type"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_check_stt_key" ON "inventory_check"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_source_stt_key" ON "opportunity_source"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_nguon" ON "opportunity_source"("nguon");

-- CreateIndex
CREATE UNIQUE INDEX "order_details_stt_key" ON "order_details"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_stt_key" ON "orders"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "potential_customer_stt_key" ON "potential_customer"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_ten_khach_hang1" ON "potential_customer"("ten_khach_hang");

-- CreateIndex
CREATE UNIQUE INDEX "priority_level_stt_key" ON "priority_level"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_do_uu_tien" ON "priority_level"("do_uu_tien");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_status_stt_key" ON "quotation_status"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_trang_thai_bao_gia" ON "quotation_status"("trang_thai_bao_gia");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_type_stt_key" ON "quotation_type"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_loai_bao_gia" ON "quotation_type"("loai_bao_gia");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_stt_key" ON "quotations"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "stock_in_stt_key" ON "stock_in"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "stock_out_stt_key" ON "stock_out"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "task_status_stt_key" ON "task_status"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_trang_thai_cong_viec" ON "task_status"("trang_thai_cong_viec");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_stt_key" ON "warehouse"("stt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_ten_kho" ON "warehouse"("ten_kho");

-- AddForeignKey
ALTER TABLE "user_activity_log" ADD CONSTRAINT "user_activity_log_ma_nguoi_dung_fkey" FOREIGN KEY ("ma_nguoi_dung") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_vai_tro_fkey" FOREIGN KEY ("vai_tro") REFERENCES "role"("ma_vai_tro") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_type" ADD CONSTRAINT "product_type_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_ten_loai_hang_fkey" FOREIGN KEY ("ten_loai_hang") REFERENCES "product_type"("ma_loai_hang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_ten_nha_cung_cap_fkey" FOREIGN KEY ("ten_nha_cung_cap") REFERENCES "suppliers"("ma_nha_cung_cap") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_tasks" ADD CONSTRAINT "business_tasks_do_uu_tien_fkey" FOREIGN KEY ("do_uu_tien") REFERENCES "priority_level"("ma_do_uu_tien") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_tasks" ADD CONSTRAINT "business_tasks_trang_thai_cong_viec_fkey" FOREIGN KEY ("trang_thai_cong_viec") REFERENCES "task_status"("ma_trang_thai_cong_viec") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contract_type" ADD CONSTRAINT "contract_type_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_loai_hop_dong_fkey" FOREIGN KEY ("loai_hop_dong") REFERENCES "contract_type"("ma_loai_hop_dong") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_nguoi_tao_fkey" FOREIGN KEY ("nguoi_tao") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_group" ADD CONSTRAINT "customer_group_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_loai_tuong_tac_fkey" FOREIGN KEY ("loai_tuong_tac") REFERENCES "interaction_type"("ma_loai_tuong_tac") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_nguoi_phu_trach_fkey" FOREIGN KEY ("nguoi_phu_trach") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_nguoi_phu_trach_fkey" FOREIGN KEY ("nguoi_phu_trach") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dx_activity_logs" ADD CONSTRAINT "dx_activity_logs_ten_nguoi_dung_fkey" FOREIGN KEY ("ten_nguoi_dung") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "interaction_type" ADD CONSTRAINT "interaction_type_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_ten_kho_fkey" FOREIGN KEY ("ten_kho") REFERENCES "warehouse"("ma_kho") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_check" ADD CONSTRAINT "inventory_check_nguoi_kiem_ke_fkey" FOREIGN KEY ("nguoi_kiem_ke") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_check" ADD CONSTRAINT "inventory_check_so_luong_he_thong_ghi_nhan_fkey" FOREIGN KEY ("so_luong_he_thong_ghi_nhan") REFERENCES "inventory"("ma_inventory") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_check" ADD CONSTRAINT "inventory_check_ten_kho_fkey" FOREIGN KEY ("ten_kho") REFERENCES "warehouse"("ma_kho") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "opportunity_source" ADD CONSTRAINT "opportunity_source_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_hawb_1_fkey" FOREIGN KEY ("hawb_1") REFERENCES "bills"("ma_bill") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_hawb_2_fkey" FOREIGN KEY ("hawb_2") REFERENCES "bills"("ma_bill") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_hawb_3_fkey" FOREIGN KEY ("hawb_3") REFERENCES "bills"("ma_bill") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_hawb_4_fkey" FOREIGN KEY ("hawb_4") REFERENCES "bills"("ma_bill") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_hawb_5_fkey" FOREIGN KEY ("hawb_5") REFERENCES "bills"("ma_bill") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_ma_hop_dong_fkey" FOREIGN KEY ("ma_hop_dong") REFERENCES "contracts"("so_hop_dong") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_nguoi_phu_trach_fkey" FOREIGN KEY ("nguoi_phu_trach") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_so_xac_nhan_don_hang_fkey" FOREIGN KEY ("so_xac_nhan_don_hang") REFERENCES "orders"("so_don_hang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_ten_khach_hang_fkey" FOREIGN KEY ("ten_khach_hang") REFERENCES "customers"("ma_khach_hang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_nguoi_lap_don_fkey" FOREIGN KEY ("nguoi_lap_don") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "potential_customer" ADD CONSTRAINT "potential_customer_nguoi_phu_trach_fkey" FOREIGN KEY ("nguoi_phu_trach") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "potential_customer" ADD CONSTRAINT "potential_customer_nguon_tiep_can_fkey" FOREIGN KEY ("nguon_tiep_can") REFERENCES "opportunity_source"("ma_nguon") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "potential_customer" ADD CONSTRAINT "potential_customer_nhom_khach_hang_fkey" FOREIGN KEY ("nhom_khach_hang") REFERENCES "customer_group"("ma_nhom_khach_hang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "priority_level" ADD CONSTRAINT "priority_level_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation_status" ADD CONSTRAINT "quotation_status_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation_type" ADD CONSTRAINT "quotation_type_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_loai_bao_gia_fkey" FOREIGN KEY ("loai_bao_gia") REFERENCES "quotation_type"("ma_loai_bao_gia") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_nguoi_phu_trach_fkey" FOREIGN KEY ("nguoi_phu_trach") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_tinh_trang_fkey" FOREIGN KEY ("tinh_trang") REFERENCES "quotation_status"("ma_trang_thai_bao_gia") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_in" ADD CONSTRAINT "stock_in_ma_bill_fkey" FOREIGN KEY ("ma_bill") REFERENCES "bills"("ma_bill") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_in" ADD CONSTRAINT "stock_in_ma_hop_dong_fkey" FOREIGN KEY ("ma_hop_dong") REFERENCES "contracts"("so_hop_dong") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_in" ADD CONSTRAINT "stock_in_ten_kho_fkey" FOREIGN KEY ("ten_kho") REFERENCES "warehouse"("ma_kho") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_in" ADD CONSTRAINT "stock_in_ten_nha_cung_cap_fkey" FOREIGN KEY ("ten_nha_cung_cap") REFERENCES "suppliers"("ma_nha_cung_cap") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_out" ADD CONSTRAINT "stock_out_nguoi_phu_trach_fkey" FOREIGN KEY ("nguoi_phu_trach") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_out" ADD CONSTRAINT "stock_out_ten_khach_hang_fkey" FOREIGN KEY ("ten_khach_hang") REFERENCES "customers"("ma_khach_hang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_out" ADD CONSTRAINT "stock_out_ten_kho_fkey" FOREIGN KEY ("ten_kho") REFERENCES "warehouse"("ma_kho") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_status" ADD CONSTRAINT "task_status_nguoi_cap_nhat_fkey" FOREIGN KEY ("nguoi_cap_nhat") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "warehouse" ADD CONSTRAINT "warehouse_nguoi_tao_fkey" FOREIGN KEY ("nguoi_tao") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "warehouse" ADD CONSTRAINT "warehouse_quan_ly_kho_fkey" FOREIGN KEY ("quan_ly_kho") REFERENCES "accounts"("ma_nguoi_dung") ON DELETE NO ACTION ON UPDATE NO ACTION;
