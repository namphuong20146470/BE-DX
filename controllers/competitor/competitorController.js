import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all competitors
export const getAllCompetitors = async (req, res) => {
    try {
        const competitors = await prisma.competitors.findMany({
            orderBy: {
                stt: 'asc'
            },
            include: {
                products: {
                    select: {
                        ma_hang: true,
                        ten_hang: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách đối thủ cạnh tranh thành công",
            data: competitors
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách đối thủ cạnh tranh",
            error: error.message
        });
    }
};

// Get competitor by ID
export const getCompetitorById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const competitor = await prisma.competitors.findUnique({
            where: { ma_doi_thu: id },
            include: {
                products: {
                    select: {
                        ma_hang: true,
                        ten_hang: true,
                        gia_thuc: true,
                        nuoc_xuat_xu: true
                    }
                }
            }
        });
        
        if (!competitor) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đối thủ cạnh tranh"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin đối thủ cạnh tranh thành công",
            data: competitor
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin đối thủ cạnh tranh",
            error: error.message
        });
    }
};

// Create new competitor
export const createCompetitor = async (req, res) => {
    try {
        const {
            ma_doi_thu,
            ten_doi_thu,
            san_pham_canh_tranh,
            chien_luoc_gia_ca,
            danh_gia_muc_do_canh_tranh,
            ghi_chu
        } = req.body;
        
        // Validate required fields
        if (!ma_doi_thu || !ten_doi_thu) {
            return res.status(400).json({
                success: false,
                message: "Mã đối thủ và tên đối thủ là bắt buộc"
            });
        }
        
        // Check if competitor with this code already exists
        const existingCompetitor = await prisma.competitors.findUnique({
            where: { ma_doi_thu }
        });
        
        if (existingCompetitor) {
            return res.status(400).json({
                success: false,
                message: `Đối thủ với mã ${ma_doi_thu} đã tồn tại`
            });
        }
        
        // Check if referenced product exists if provided
        if (san_pham_canh_tranh) {
            const product = await prisma.products.findUnique({
                where: { ma_hang: san_pham_canh_tranh }
            });
            
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm cạnh tranh với mã ${san_pham_canh_tranh} không tồn tại`
                });
            }
        }
        
        const competitor = await prisma.competitors.create({
            data: {
                ma_doi_thu,
                ten_doi_thu,
                san_pham_canh_tranh,
                chien_luoc_gia_ca,
                danh_gia_muc_do_canh_tranh,
                ghi_chu
            },
            include: {
                products: true
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Tạo đối thủ cạnh tranh thành công",
            data: competitor
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo đối thủ cạnh tranh",
            error: error.message
        });
    }
};

// Update competitor
export const updateCompetitor = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ten_doi_thu,
            san_pham_canh_tranh,
            chien_luoc_gia_ca,
            danh_gia_muc_do_canh_tranh,
            ghi_chu
        } = req.body;
        
        // Check if competitor exists
        const existingCompetitor = await prisma.competitors.findUnique({
            where: { ma_doi_thu: id }
        });
        
        if (!existingCompetitor) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đối thủ cạnh tranh"
            });
        }
        
        // Check if referenced product exists if provided
        if (san_pham_canh_tranh) {
            const product = await prisma.products.findUnique({
                where: { ma_hang: san_pham_canh_tranh }
            });
            
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm cạnh tranh với mã ${san_pham_canh_tranh} không tồn tại`
                });
            }
        }
        
        const competitor = await prisma.competitors.update({
            where: { ma_doi_thu: id },
            data: {
                ten_doi_thu,
                san_pham_canh_tranh,
                chien_luoc_gia_ca,
                danh_gia_muc_do_canh_tranh,
                ghi_chu
            },
            include: {
                products: true
            }
        });
        
        res.json({
            success: true,
            message: "Cập nhật đối thủ cạnh tranh thành công",
            data: competitor
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật đối thủ cạnh tranh",
            error: error.message
        });
    }
};

// Delete competitor
export const deleteCompetitor = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if competitor exists
        const competitor = await prisma.competitors.findUnique({
            where: { ma_doi_thu: id }
        });
        
        if (!competitor) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đối thủ cạnh tranh"
            });
        }
        
        // Delete the competitor
        await prisma.competitors.delete({
            where: { ma_doi_thu: id }
        });
        
        res.json({
            success: true,
            message: "Xóa đối thủ cạnh tranh thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa đối thủ cạnh tranh",
            error: error.message
        });
    }
};