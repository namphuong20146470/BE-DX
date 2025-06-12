import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all customer groups without pagination limits
export const getAllCustomerGroups = async (req, res) => {
    try {
        const { 
            sortBy = 'stt', 
            sortDir = 'asc',
            search = '',
            updatedBy = ''
        } = req.query;
        
        // Build sort object
        const orderBy = {};
        orderBy[sortBy] = sortDir.toLowerCase();
        
        // Build filter object
        const where = {};
        
        if (search) {
            where.OR = [
                { ma_nhom_khach_hang: { contains: search, mode: 'insensitive' } },
                { nhom_khach_hang: { contains: search, mode: 'insensitive' } },
                { mo_ta: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        if (updatedBy) {
            where.nguoi_cap_nhat = updatedBy;
        }
        
        // Get total count for metadata
        const totalCount = await prisma.customer_group.count({ where });
        
        // Fetch ALL customer groups without pagination
        const customerGroups = await prisma.customer_group.findMany({
            where,
            orderBy,
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        potential_customer: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            message: "Lấy danh sách nhóm khách hàng thành công",
            data: customerGroups,
            metadata: {
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách nhóm khách hàng",
            error: error.message
        });
    }
};
// Get customer group by ID
export const getCustomerGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const customerGroup = await prisma.customer_group.findUnique({
            where: { ma_nhom_khach_hang: id },
            include: {
                accounts: {
                    select: {
                        ma_nguoi_dung: true,
                        ho_va_ten: true,
                        email: true
                    }
                },
                potential_customer: {
                    select: {
                        ma_khach_hang_tiem_nang: true,
                        ten_khach_hang: true,
                        nguoi_phu_trach: true,
                        tinh_trang: true
                    }
                },
                _count: {
                    select: {
                        potential_customer: true
                    }
                }
            }
        });
        
        if (!customerGroup) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhóm khách hàng"
            });
        }
        
        res.json({
            success: true,
            message: "Lấy thông tin nhóm khách hàng thành công",
            data: customerGroup
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin nhóm khách hàng",
            error: error.message
        });
    }
};

// Create customer group
export const createCustomerGroup = async (req, res) => {
    try {
        const { ma_nhom_khach_hang, nhom_khach_hang, mo_ta, nguoi_cap_nhat } = req.body;
        
        // Validate required fields
        if (!ma_nhom_khach_hang || !nhom_khach_hang) {
            return res.status(400).json({
                success: false,
                message: "Mã nhóm khách hàng và tên nhóm khách hàng là bắt buộc"
            });
        }
        
        // Check if ID already exists
        const existingGroup = await prisma.customer_group.findUnique({
            where: { ma_nhom_khach_hang }
        });
        
        if (existingGroup) {
            return res.status(400).json({
                success: false,
                message: "Mã nhóm khách hàng đã tồn tại"
            });
        }
        
        // Check if name already exists
        const existingName = await prisma.customer_group.findFirst({
            where: { nhom_khach_hang }
        });
        
        if (existingName) {
            return res.status(400).json({
                success: false,
                message: "Tên nhóm khách hàng đã tồn tại"
            });
        }
        
        // Validate user if provided
        if (nguoi_cap_nhat) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Người dùng không tồn tại"
                });
            }
        }
        
        // Get next sequence number
        const maxStt = await prisma.customer_group.findFirst({
            orderBy: { stt: 'desc' },
            select: { stt: true }
        });
        
        const nextStt = maxStt ? maxStt.stt + 1 : 1;
        
        // Create new customer group
        const customerGroup = await prisma.customer_group.create({
            data: {
                stt: nextStt,
                ma_nhom_khach_hang,
                nhom_khach_hang,
                mo_ta,
                nguoi_cap_nhat
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
            message: "Tạo nhóm khách hàng thành công",
            data: customerGroup
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo nhóm khách hàng",
            error: error.message
        });
    }
};

// Update customer group
export const updateCustomerGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { nhom_khach_hang, mo_ta, nguoi_cap_nhat } = req.body;
        
        // Check if customer group exists
        const existingGroup = await prisma.customer_group.findUnique({
            where: { ma_nhom_khach_hang: id }
        });
        
        if (!existingGroup) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhóm khách hàng"
            });
        }
        
        // Check if name already exists and belongs to a different record
        if (nhom_khach_hang) {
            const existingName = await prisma.customer_group.findFirst({
                where: { 
                    nhom_khach_hang,
                    ma_nhom_khach_hang: { not: id }
                }
            });
            
            if (existingName) {
                return res.status(400).json({
                    success: false,
                    message: "Tên nhóm khách hàng đã tồn tại"
                });
            }
        }
        
        // Validate user if provided
        if (nguoi_cap_nhat) {
            const user = await prisma.accounts.findUnique({
                where: { ma_nguoi_dung: nguoi_cap_nhat }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Người dùng không tồn tại"
                });
            }
        }
        
        // Prepare update data
        const updateData = {};
        
        if (nhom_khach_hang !== undefined) updateData.nhom_khach_hang = nhom_khach_hang;
        if (mo_ta !== undefined) updateData.mo_ta = mo_ta;
        if (nguoi_cap_nhat !== undefined) updateData.nguoi_cap_nhat = nguoi_cap_nhat;
        
        // Only update if we have data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có dữ liệu để cập nhật"
            });
        }
        
        // Update timestamp
        updateData.ngay_cap_nhat = new Date();
        
        // Update customer group
        const customerGroup = await prisma.customer_group.update({
            where: { ma_nhom_khach_hang: id },
            data: updateData,
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
            message: "Cập nhật nhóm khách hàng thành công",
            data: customerGroup
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật nhóm khách hàng",
            error: error.message
        });
    }
};

// Delete customer group
export const deleteCustomerGroup = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if customer group exists
        const customerGroup = await prisma.customer_group.findUnique({
            where: { ma_nhom_khach_hang: id },
            include: {
                potential_customer: true
            }
        });
        
        if (!customerGroup) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhóm khách hàng"
            });
        }
        
        // Check if there are potential customers using this group
        if (customerGroup.potential_customer.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa nhóm khách hàng vì đang được sử dụng bởi khách hàng tiềm năng",
                count: customerGroup.potential_customer.length
            });
        }
        
        // Delete customer group
        await prisma.customer_group.delete({
            where: { ma_nhom_khach_hang: id }
        });
        
        res.json({
            success: true,
            message: "Xóa nhóm khách hàng thành công"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa nhóm khách hàng",
            error: error.message
        });
    }
};

// Get customer group statistics
export const getCustomerGroupStats = async (req, res) => {
    try {
        const totalCount = await prisma.customer_group.count();
        
        const groupsWithPotentialCustomers = await prisma.customer_group.findMany({
            select: {
                ma_nhom_khach_hang: true,
                nhom_khach_hang: true,
                _count: {
                    select: {
                        potential_customer: true
                    }
                }
            },
            orderBy: {
                _count: {
                    potential_customer: 'desc'
                }
            },
            take: 5
        });
        
        const recentGroups = await prisma.customer_group.findMany({
            orderBy: {
                ngay_cap_nhat: 'desc'
            },
            take: 5,
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
            message: "Lấy thống kê nhóm khách hàng thành công",
            data: {
                totalCount,
                topGroupsByPotentialCustomers: groupsWithPotentialCustomers,
                recentGroups
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thống kê nhóm khách hàng",
            error: error.message
        });
    }
};