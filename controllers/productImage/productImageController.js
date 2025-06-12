import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Debug code to see available models
// console.log("Available Prisma models:", Object.keys(prisma));

// Get all product images
export const getAllProductImages = async (req, res) => {
    try {
        // Fix: Use the correct model name 
        const images = await prisma.product_images.findMany({
            orderBy: {
                stt: 'asc'
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách ảnh sản phẩm thành công",
            data: images
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách ảnh sản phẩm",
            error: error.message
        });
    }
};

// Get product image by product code
export const getProductImageById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const image = await prisma.product_images.findUnique({
            where: { ma_hang: id }
        });
        
        if (!image) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy ảnh sản phẩm"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin ảnh sản phẩm thành công",
            data: image
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin ảnh sản phẩm",
            error: error.message
        });
    }
};

// Create new product image
export const createProductImage = async (req, res) => {
    try {
        const { ma_hang, ten_anh, duong_dan_anh } = req.body;
        
        // Validate required fields
        if (!ma_hang) {
            return res.status(400).json({
                success: false,
                message: "Mã hàng là bắt buộc"
            });
        }
        
        // Check if the product exists
        const product = await prisma.products.findUnique({
            where: { ma_hang }
        });
        
        if (!product) {
            return res.status(400).json({
                success: false,
                message: `Sản phẩm với mã hàng ${ma_hang} không tồn tại`
            });
        }
        
        // Check if image for this product already exists
        const existingImage = await prisma.product_images.findUnique({
            where: { ma_hang }
        });
        
        if (existingImage) {
            return res.status(400).json({
                success: false,
                message: `Ảnh cho sản phẩm với mã hàng ${ma_hang} đã tồn tại`
            });
        }
        
        const image = await prisma.product_images.create({
            data: {
                ma_hang,
                ten_anh,
                duong_dan_anh
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo ảnh sản phẩm thành công",
            data: image
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo ảnh sản phẩm",
            error: error.message
        });
    }
};

// Update product image
export const updateProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_anh, duong_dan_anh } = req.body;
        
        // Check if image exists
        const existingImage = await prisma.product_images.findUnique({
            where: { ma_hang: id }
        });
        
        if (!existingImage) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy ảnh sản phẩm"
            });
        }
        
        const updatedImage = await prisma.product_images.update({
            where: { ma_hang: id },
            data: {
                ten_anh,
                duong_dan_anh
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật ảnh sản phẩm thành công",
            data: updatedImage
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật ảnh sản phẩm",
            error: error.message
        });
    }
};

// Delete product image
export const deleteProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if image exists
        const existingImage = await prisma.product_images.findUnique({
            where: { ma_hang: id }
        });
        
        if (!existingImage) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy ảnh sản phẩm"
            });
        }
        
        await prisma.product_images.delete({
            where: { ma_hang: id }
        });
        
        res.json({
            success: true,
            message: "Xóa ảnh sản phẩm thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa ảnh sản phẩm",
            error: error.message
        });
    }
};