import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all product types
export const getAllProductTypes = async (req, res) => {
    try {
        const productTypes = await prisma.product_type.findMany({
            orderBy: {
                stt: 'asc'
            },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: "Lấy danh sách loại sản phẩm thành công",
            data: productTypes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách loại sản phẩm",
            error: error.message
        });
    }
};

// Get product type by ID
export const getProductTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const productType = await prisma.product_type.findUnique({
            where: { ma_loai_hang: id },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                },
                products: true
            }
        });
        
        if (!productType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại sản phẩm"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin loại sản phẩm thành công",
            data: productType
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin loại sản phẩm",
            error: error.message
        });
    }
};

// Create product type
export const createProductType = async (req, res) => {
    try {
        const { 
            ma_loai_hang, 
            ten_loai_hang, 
            trang_thai, 
            nguoi_cap_nhat, 
            mo_ta 
        } = req.body;
        
        // Validate required fields
        if (!ma_loai_hang || !ten_loai_hang) {
            return res.status(400).json({
                success: false,
                message: "Mã loại hàng và tên loại hàng là bắt buộc"
            });
        }
        
        // Check if product type ID already exists
        const existingProductType = await prisma.product_type.findUnique({
            where: { ma_loai_hang }
        });
        
        if (existingProductType) {
            return res.status(400).json({
                success: false,
                message: `Mã loại hàng ${ma_loai_hang} đã tồn tại`
            });
        }
        
        // Check if user exists
        if (nguoi_cap_nhat) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: `Người dùng với mã ${nguoi_cap_nhat} không tồn tại`
                });
            }
        }
        
        // Get the highest stt and increment by 1
        const maxStt = await prisma.product_type.aggregate({
            _max: {
                stt: true
            }
        });
        
        const nextStt = (maxStt._max.stt || 0) + 1;
        
        // Create product type with auto-incremented stt
        const productType = await prisma.product_type.create({
            data: {
                stt: nextStt,
                ma_loai_hang,
                ten_loai_hang,
                trang_thai,
                nguoi_cap_nhat,
                ngay_cap_nhat: new Date(),
                mo_ta
            },
            include: {
                accounts: {
                    select: {
                        ho_va_ten: true
                    }
                }
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo loại sản phẩm thành công",
            data: productType
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo loại sản phẩm",
            error: error.message
        });
    }
};
// Update product type
export const updateProductType = async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_loai_hang, trang_thai, nguoi_cap_nhat, mo_ta } = req.body;
        
        // Check if product type exists
        const productType = await prisma.product_type.findUnique({
            where: { ma_loai_hang: id }
        });
        
        if (!productType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại sản phẩm"
            });
        }
        
        const updatedProductType = await prisma.product_type.update({
            where: { ma_loai_hang: id },
            data: {
                ten_loai_hang,
                trang_thai,
                nguoi_cap_nhat,
                ngay_cap_nhat: new Date(),
                mo_ta
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật loại sản phẩm thành công",
            data: updatedProductType
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật loại sản phẩm",
            error: error.message
        });
    }
};

// Delete product type
export const deleteProductType = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if the product type exists
        const productType = await prisma.product_type.findUnique({
            where: { ma_loai_hang: id },
            include: { products: true }
        });
        
        if (!productType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại sản phẩm"
            });
        }
        
        // Check if there are products using this product type
        if (productType.products.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa loại sản phẩm này vì đang được sử dụng bởi một số sản phẩm",
                products: productType.products.map(p => p.ma_hang)
            });
        }
        
        await prisma.product_type.delete({
            where: { ma_loai_hang: id }
        });
        
        res.json({
            success: true,
            message: "Xóa loại sản phẩm thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa loại sản phẩm",
            error: error.message
        });
    }
};