import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
// Updated date formatting functions to prevent timezone issues

// Updated helper function to properly handle dates without timezone issues
function formatDateOnly(dateString) {
    if (!dateString) return null;
    
    // Parse the date string directly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    
    // Create a UTC date with time set to 00:00:00.000Z
    return new Date(Date.UTC(year, month - 1, day));
}

// Updated helper function for formatting dates in responses - now returns ISO format
function formatDateForResponse(date) {
    if (!date) return null;
    
    // Return the full ISO string with time set to midnight UTC
    // This will give the format: "2025-05-26T00:00:00.000Z"
    return date.toISOString();
}
// Set up multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `products-${Date.now()}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
        }
    }
}).single('file');

// Get all products
// Get all products without pagination limits
export const getAllProducts = async (req, res) => {
    try {
        const { 
            sortBy = 'stt', 
            sortDir = 'asc',
            search = '',
            type = '',
            supplier = '',
            status = '',
            manager = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (search) {
            where.OR = [
                { ma_hang: { contains: search, mode: 'insensitive' } },
                { ten_hang: { contains: search, mode: 'insensitive' } },
                { mo_ta: { contains: search, mode: 'insensitive' } },
                { nuoc_xuat_xu: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (type) where.ten_loai_hang = type;
        if (supplier) where.ten_nha_cung_cap = supplier;
        if (status) where.tinh_trang_hang_hoa = status;
        if (manager) where.nguoi_cap_nhat = manager;
        
        // Get total count for metadata
        const totalCount = await prisma.products.count({ where });
        
        // Get ALL products without pagination limits
        const products = await prisma.products.findMany({
            where,
            orderBy,
            include: {
                product_type: {
                    select: {
                        ma_loai_hang: true,
                        ten_loai_hang: true
                    }
                },
                suppliers: {
                    select: {
                        ma_nha_cung_cap: true,
                        ten_nha_cung_cap: true
                    }
                },
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true
                    }
                }
            }
        });
        
        // Format dates in response
        const formattedProducts = products.map(product => ({
            ...product,
            ngay_gia: product.ngay_gia ? formatDateForResponse(product.ngay_gia) : null
        }));
        
        res.json({
            success: true,
            message: "Lấy danh sách sản phẩm thành công",
            data: formattedProducts,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách sản phẩm",
            error: error.message
        });
    }
};

// Get product by ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await prisma.products.findUnique({
            where: { ma_hang: id },
            include: {
                product_type: {
                    select: {
                        ma_loai_hang: true,
                        ten_loai_hang: true
                    }
                },
                suppliers: {
                    select: {
                        ma_nha_cung_cap: true,
                        ten_nha_cung_cap: true
                    }
                },
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                }
            }
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }
        
            // In getProductById function:
            const formattedProduct = {
                ...product,
                ngay_gia: product.ngay_gia ? formatDateForResponse(product.ngay_gia) : null
            };
        
        res.json({
            success: true,
            message: "Lấy thông tin sản phẩm thành công",
            data: formattedProduct
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin sản phẩm",
            error: error.message
        });
    }
};

// Updated createProduct function that allows duplicate ma_hang values
export const createProduct = async (req, res) => {
    try {
        const { 
            ma_hang, 
            ten_hang, 
            ten_loai_hang, 
            ten_nha_cung_cap, 
            nuoc_xuat_xu = "", // Default value if not provided
            trong_luong_tinh, 
            gia_thuc = 0, // Default value if not provided
            don_vi_ban_hang = "", // Default value if not provided
            tinh_trang_hang_hoa, 
            nguoi_cap_nhat, 
            mo_ta,
            price_list,
            ngay_gia   
        } = req.body;
        
        // Only validate that we have a product code and name
        if (!ma_hang || !ten_hang) {
            return res.status(400).json({
                success: false,
                message: "Mã hàng và tên hàng là bắt buộc"
            });
        }
        
        const normalizedMaHang = ma_hang.toString().trim();

        // Validate foreign keys if provided
        if (ten_loai_hang) {
            const productType = await prisma.product_type.findFirst({
                where: { ma_loai_hang: ten_loai_hang }
            });
            
            if (!productType) {
                return res.status(400).json({
                    success: false,
                    message: `Loại hàng ${ten_loai_hang} không tồn tại`
                });
            }
        }
        
        if (ten_nha_cung_cap) {
            const supplier = await prisma.suppliers.findFirst({
                where: { ma_nha_cung_cap: ten_nha_cung_cap }
            });
            
            if (!supplier) {
                return res.status(400).json({
                    success: false,
                    message: `Nhà cung cấp ${ten_nha_cung_cap} không tồn tại`
                });
            }
        }
        
        if (nguoi_cap_nhat) {
            const user = await prisma.accounts.findFirst({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người cập nhật ${nguoi_cap_nhat} không tồn tại`
                });
            }
        }
        
        // Get next sequence number
        const maxStt = await prisma.products.findFirst({
            orderBy: { stt: 'desc' },
            select: { stt: true }
        });
        
        const nextStt = maxStt ? maxStt.stt + 1 : 1;
        
        // Format date for database
        const formattedDate = ngay_gia ? formatDateOnly(ngay_gia) : null;
        
        // Create product with default values for required fields
        try {
            const product = await prisma.products.create({
                data: {
                    stt: nextStt,
                    ma_hang: normalizedMaHang,
                    ten_hang: ten_hang ? ten_hang.toString().trim() : "",
                    ten_loai_hang: ten_loai_hang ? ten_loai_hang.toString() : null,
                    ten_nha_cung_cap: ten_nha_cung_cap ? ten_nha_cung_cap.toString() : null,
                    nuoc_xuat_xu: nuoc_xuat_xu ? nuoc_xuat_xu.toString() : "", // Ensure default value
                    trong_luong_tinh: trong_luong_tinh ? parseFloat(trong_luong_tinh) : null,
                    gia_thuc: gia_thuc !== undefined ? parseFloat(gia_thuc) : 0, // Ensure default value
                    don_vi_ban_hang: don_vi_ban_hang ? don_vi_ban_hang.toString() : "", // Ensure default value
                    tinh_trang_hang_hoa: tinh_trang_hang_hoa ? tinh_trang_hang_hoa.toString() : null,
                    nguoi_cap_nhat: nguoi_cap_nhat ? nguoi_cap_nhat.toString() : null,
                    mo_ta: mo_ta ? mo_ta.toString() : null,
                    price_list: price_list ? price_list.toString() : "",
                    ngay_gia: formattedDate,
                    ngay_cap_nhat: new Date() // Always set current time
                },
                include: {
                    product_type: {
                        select: {
                            ma_loai_hang: true,
                            ten_loai_hang: true
                        }
                    },
                    suppliers: {
                        select: {
                            ma_nha_cung_cap: true,
                            ten_nha_cung_cap: true
                        }
                    },
                    accounts: {
                        select: {
                            ma_nguoi_dung: true,
                            ho_va_ten: true
                        }
                    }
                }
            });
            
            // Format date in response
            const responseData = {
                ...product,
                ngay_gia: product.ngay_gia ? formatDateForResponse(product.ngay_gia) : null
            };
            
            res.status(201).json({
                success: true,
                message: "Tạo sản phẩm thành công",
                data: responseData
            });
        } catch (dbError) {
            // If the database still rejects the product, log details and return error
            console.error('Database error creating product:', dbError);
            
            // Return more useful error information
            res.status(500).json({
                success: false,
                message: "Lỗi khi tạo sản phẩm trong cơ sở dữ liệu",
                error: dbError.message,
                details: "Kiểm tra các ràng buộc của cơ sở dữ liệu cho bảng sản phẩm"
            });
        }
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo sản phẩm",
            error: error.message
        });
    }
};
// Updated updateProduct function to use stt as unique identifier
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return null;
    
    // Parse the ISO string directly into a Date object
    return new Date(dateTimeString);
}
// Add this new function to update product by both code and stt

export const updateProductByCodeAndStt = async (req, res) => {
    try {
        const { code, stt } = req.params;
        const {
            ten_hang, 
            ten_loai_hang, 
            ten_nha_cung_cap, 
            nuoc_xuat_xu, 
            trong_luong_tinh, 
            gia_thuc, 
            don_vi_ban_hang, 
            tinh_trang_hang_hoa, 
            nguoi_cap_nhat, 
            mo_ta,
            price_list,
            ngay_gia,
            ngay_cap_nhat
        } = req.body;
        
        // Parse stt to integer
        const sttNum = parseInt(stt);
        
        if (isNaN(sttNum)) {
            return res.status(400).json({
                success: false,
                message: "STT phải là một số"
            });
        }
        
        // Find product by both ma_hang and stt
        const existingProduct = await prisma.products.findFirst({
            where: { 
                ma_hang: code,
                stt: sttNum
            }
        });
        
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy sản phẩm với mã hàng ${code} và STT ${stt}`
            });
        }
        
        // Validate foreign keys if provided
        if (ten_loai_hang) {
            const productType = await prisma.product_type.findFirst({
                where: { ma_loai_hang: ten_loai_hang }
            });
            
            if (!productType) {
                return res.status(400).json({
                    success: false,
                    message: `Loại hàng ${ten_loai_hang} không tồn tại`
                });
            }
        }
        
        if (ten_nha_cung_cap) {
            const supplier = await prisma.suppliers.findFirst({
                where: { ma_nha_cung_cap: ten_nha_cung_cap }
            });
            
            if (!supplier) {
                return res.status(400).json({
                    success: false,
                    message: `Nhà cung cấp ${ten_nha_cung_cap} không tồn tại`
                });
            }
        }
        
        if (nguoi_cap_nhat) {
            const user = await prisma.accounts.findFirst({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người cập nhật ${nguoi_cap_nhat} không tồn tại`
                });
            }
        }
        
        // Prepare update data
        const updateData = {};
        
        if (ten_hang !== undefined) updateData.ten_hang = ten_hang;
        if (ten_loai_hang !== undefined) updateData.ten_loai_hang = ten_loai_hang;
        if (ten_nha_cung_cap !== undefined) updateData.ten_nha_cung_cap = ten_nha_cung_cap;
        if (nuoc_xuat_xu !== undefined) updateData.nuoc_xuat_xu = nuoc_xuat_xu;
        if (trong_luong_tinh !== undefined) updateData.trong_luong_tinh = trong_luong_tinh ? parseFloat(trong_luong_tinh) : null;
        if (gia_thuc !== undefined) updateData.gia_thuc = gia_thuc ? parseFloat(gia_thuc) : null;
        if (don_vi_ban_hang !== undefined) updateData.don_vi_ban_hang = don_vi_ban_hang;
        if (tinh_trang_hang_hoa !== undefined) updateData.tinh_trang_hang_hoa = tinh_trang_hang_hoa;
        if (nguoi_cap_nhat !== undefined) updateData.nguoi_cap_nhat = nguoi_cap_nhat;
        if (mo_ta !== undefined) updateData.mo_ta = mo_ta;
        
        // Use provided price_list or keep existing
        if (price_list !== undefined) {
            updateData.price_list = price_list ? price_list.toString() : "";
        }
        
        // Format date properly when provided
        if (ngay_gia !== undefined) {
            updateData.ngay_gia = ngay_gia ? formatDateOnly(ngay_gia) : null;
        }
        
        // Handle ngay_cap_nhat correctly
        if (ngay_cap_nhat !== undefined == null) {
            updateData.ngay_cap_nhat = ngay_cap_nhat ? formatDateTime(ngay_cap_nhat) : new Date();
        } else {
            // Auto-update timestamp if not explicitly provided
            updateData.ngay_cap_nhat = new Date();
        }
        
        // Update product using stt
        const product = await prisma.products.update({
            where: { stt: sttNum },
            data: updateData,
            include: {
                product_type: {
                    select: {
                        ma_loai_hang: true,
                        ten_loai_hang: true
                    }
                },
                suppliers: {
                    select: {
                        ma_nha_cung_cap: true,
                        ten_nha_cung_cap: true
                    }
                },
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true
                    }
                }
            }
        });
        
        // Format dates in response
        const responseData = {
            ...product,
            ngay_gia: product.ngay_gia ? formatDateForResponse(product.ngay_gia) : null
        };
        
        res.json({
            success: true,
            message: "Cập nhật sản phẩm thành công",
            data: responseData
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật sản phẩm",
            error: error.message
        });
    }
};
// Updated deleteProduct function

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        // First find the product by ma_hang
        const product = await prisma.products.findFirst({
            where: { ma_hang: id }
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }
        
        // Then delete it by stt
        await prisma.products.delete({
            where: { stt: product.stt }
        });
        
        res.json({
            success: true,
            message: "Xóa sản phẩm thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa sản phẩm",
            error: error.message
        });
    }
};
// Import products from Excel
export const importProductsFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng tải lên file Excel'
            });
        }

        const filePath = req.file.path;

        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            return res.status(400).json({
                success: false,
                message: 'File Excel không có dữ liệu'
            });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Process each row
// Update in importProductsFromExcel function

// Update import function to handle required fields better

// Process each row in importProductsFromExcel
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
        // Map Excel columns to database fields
        const productData = {
            ma_hang: row['Mã hàng'] || row['ma_hang'],
            ten_hang: row['Tên hàng'] || row['ten_hang'],
            ten_loai_hang: row['Loại hàng'] || row['ten_loai_hang'],
            ten_nha_cung_cap: row['Nhà cung cấp'] || row['ten_nha_cung_cap'],
            nuoc_xuat_xu: row['Nước xuất xứ'] || row['nuoc_xuat_xu'] || "N/A", // Default value
            trong_luong_tinh: row['Trọng lượng tịnh'] || row['trong_luong_tinh'],
            gia_thuc: row['Giá thực'] || row['gia_thuc'] || 0, // Default value
            don_vi_ban_hang: row['Đơn vị bán hàng'] || row['don_vi_ban_hang'] || "cái", // Default value
            tinh_trang_hang_hoa: row['Tình trạng hàng hóa'] || row['tinh_trang_hang_hoa'],
            nguoi_cap_nhat: row['Người cập nhật'] || row['nguoi_cap_nhat'],
            mo_ta: row['Mô tả'] || row['mo_ta'],
            ngay_gia: row['Ngày giá'] || row['ngay_gia'],
            price_list: row['Price List'] || row['price_list'] || ""
        };

        // Validate required fields
        if (!productData.ma_hang || !productData.ten_hang) {
            results.failed++;
            results.errors.push(`Dòng ${i + 1}: Thiếu mã hàng hoặc tên hàng`);
            continue;
        }

        // Get next sequence number
        const maxStt = await prisma.products.findFirst({
            orderBy: { stt: 'desc' },
            select: { stt: true }
        });

        const nextStt = maxStt ? maxStt.stt + 1 : 1;
        
        // Format date for database
        const formattedDate = productData.ngay_gia ? formatDateOnly(productData.ngay_gia) : null;

        // Create product
        await prisma.products.create({
            data: {
                stt: nextStt + i,
                ma_hang: productData.ma_hang.toString().trim(),
                ten_hang: productData.ten_hang,
                ten_loai_hang: productData.ten_loai_hang,
                ten_nha_cung_cap: productData.ten_nha_cung_cap,
                nuoc_xuat_xu: productData.nuoc_xuat_xu, // Uses default if not provided
                trong_luong_tinh: productData.trong_luong_tinh ? parseFloat(productData.trong_luong_tinh) : null,
                gia_thuc: productData.gia_thuc ? parseFloat(productData.gia_thuc) : 0, // Uses default if not provided
                don_vi_ban_hang: productData.don_vi_ban_hang, // Uses default if not provided
                tinh_trang_hang_hoa: productData.tinh_trang_hang_hoa,
                nguoi_cap_nhat: productData.nguoi_cap_nhat,
                mo_ta: productData.mo_ta,
                price_list: productData.price_list ? productData.price_list.toString() : "",
                ngay_gia: formattedDate,
                ngay_cap_nhat: new Date() // Always set current time
            }
        });

        results.success++;
    } catch (error) {
        results.failed++;
        results.errors.push(`Dòng ${i + 1}: ${error.message}`);
    }
}
        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: `Import hoàn thành. Thành công: ${results.success}, Thất bại: ${results.failed}`,
            data: results
        });

    } catch (error) {
        // Clean up uploaded file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Error importing products:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi import sản phẩm từ Excel',
            error: error.message
        });
    }
};

// Generate Excel template for product import
export const generateProductTemplate = async (req, res) => {
    try {
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        
        // Define template headers
        const headers = [
            'Mã hàng',
            'Tên hàng', 
            'Loại hàng',
            'Nhà cung cấp',
            'Nước xuất xứ',
            'Trọng lượng tịnh',
            'Giá thực',
            'Đơn vị bán hàng',
            'Tình trạng hàng hóa',
            'Người cập nhật',
            'Mô tả',
            'Ngày giá'
        ];

        // Create sample data
        const sampleData = [
            [
                'SP001',
                'Sản phẩm mẫu 1',
                'LH001',
                'NCC001', 
                'VN',
                '1000',
                '150000',
                'cái',
                'O',
                'user001',
                'Mô tả sản phẩm mẫu',
                '2025-01-01'
            ]
        ];

        // Combine headers and sample data
        const wsData = [headers, ...sampleData];

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = headers.map(() => ({ wch: 20 }));
        worksheet['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Template');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=products_template.xlsx');

        // Send file
        res.send(buffer);

    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo template Excel',
            error: error.message
        });
    }
};

// Updated deleteProductByCodeAndDate function

export const deleteProductByCodeAndDate = async (req, res) => {
    try {
        const { code, date } = req.params;
        
        if (!code || !date) {
            return res.status(400).json({
                success: false,
                message: "Cần cung cấp cả mã hàng và ngày cập nhật"
            });
        }
        
        // Convert the date string to a Date object
        const updateDate = new Date(date);
        
        // Check if the date is valid
        if (isNaN(updateDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Định dạng ngày không hợp lệ"
            });
        }
        
        // Find products with matching code - use findMany instead of findUnique
        const matchingProducts = await prisma.products.findMany({
            where: {
                ma_hang: code
            }
        });
        
        if (matchingProducts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm với mã hàng này"
            });
        }
        
        // Find the specific product with matching update date
        let productToDelete = null;
        
        for (const product of matchingProducts) {
            const productDate = new Date(product.ngay_cap_nhat);
            
            // For logging/debugging
            console.log(`Comparing dates: ${productDate.toISOString()} vs ${updateDate.toISOString()}`);
            console.log(`Product STT: ${product.stt}`);
            
            // Check if year, month, day, hour, minute match
            if (productDate.getFullYear() === updateDate.getFullYear() &&
                productDate.getMonth() === updateDate.getMonth() &&
                productDate.getDate() === updateDate.getDate() &&
                productDate.getHours() === updateDate.getHours() &&
                productDate.getMinutes() === updateDate.getMinutes()) {
                
                productToDelete = product;
                break;
            }
        }
        
        if (!productToDelete) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm với mã hàng và thời gian cập nhật này"
            });
        }
        
        // Delete the specific product using its stt (sequence number)
        await prisma.products.delete({
            where: { 
                stt: productToDelete.stt // CRITICAL: Use stt as the unique identifier
            }
        });
        
        res.json({
            success: true,
            message: "Xóa sản phẩm thành công",
            data: {
                ma_hang: code,
                ngay_cap_nhat: productToDelete.ngay_cap_nhat,
                stt: productToDelete.stt
            }
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa sản phẩm",
            error: error.message
        });
    }
};
// Get product statistics
export const getProductStats = async (req, res) => {
    try {
        const totalCount = await prisma.products.count();
        
        const countByType = await prisma.$queryRaw`
            SELECT pt."ten_loai_hang", COUNT(p.*) as "count"
            FROM "products" p
            LEFT JOIN "product_type" pt ON p."ten_loai_hang" = pt."ma_loai_hang"
            GROUP BY pt."ten_loai_hang"
            ORDER BY "count" DESC
        `;
        
        const countBySupplier = await prisma.$queryRaw`
            SELECT s."ten_nha_cung_cap", COUNT(p.*) as "count"
            FROM "products" p
            LEFT JOIN "suppliers" s ON p."ten_nha_cung_cap" = s."ma_nha_cung_cap"
            GROUP BY s."ten_nha_cung_cap"
            ORDER BY "count" DESC
            LIMIT 10
        `;
        
        const countByStatus = await prisma.$queryRaw`
            SELECT "tinh_trang_hang_hoa", COUNT(*) as "count"
            FROM "products"
            WHERE "tinh_trang_hang_hoa" IS NOT NULL
            GROUP BY "tinh_trang_hang_hoa"
            ORDER BY "count" DESC
        `;
        
        const recentProducts = await prisma.products.findMany({
            take: 5,
            orderBy: { ngay_cap_nhat: 'desc' },
            include: {
                product_type: {
                    select: {
                        ten_loai_hang: true
                    }
                },
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
            // In getProductStats function:
            const formattedRecentProducts = recentProducts.map(product => ({
                ...product,
                ngay_gia: product.ngay_gia ? formatDateForResponse(product.ngay_gia) : null
            }));
        res.json({
            success: true,
            message: "Lấy thống kê sản phẩm thành công",
            data: {
                totalCount,
                countByType,
                countBySupplier,
                countByStatus,
                recentProducts: formattedRecentProducts
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê sản phẩm",
            error: error.message
        });
    }
};